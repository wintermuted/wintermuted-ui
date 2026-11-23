import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { integrity, isPublished, preparePackages, publishPackages, validatePackages } from "./release-publication.mjs";

const theme = { project: "ui-theme", name: "@wintermuted/ui-theme", version: "1.0.0",
  file: "wintermuted-ui-theme-1.0.0.tgz", integrity: integrity(Buffer.from("theme")) };
const react = { project: "ui-react", name: "@wintermuted/ui-react", version: "1.0.0",
  file: "wintermuted-ui-react-1.0.0.tgz", integrity: integrity(Buffer.from("react")) };
const response = (status, metadata) => async () => ({ status, ok: status === 200, async json() { return metadata; } });

test("registry checks require exact identity and integrity; only explicit absence permits publication", async () => {
  assert.equal(await isPublished(theme, response(200, { name: theme.name, versions: {
    [theme.version]: { name: theme.name, version: theme.version, dist: { integrity: theme.integrity } }
  } })), true);
  assert.equal(await isPublished(react, response(200, { name: react.name, versions: {} })), false);
  assert.equal(await isPublished(react, response(404, { error: "Not found" })), false);
  await assert.rejects(isPublished(react, response(404, { error: "No match found for version" })), /Registry lookup failed/);
  for (const status of [401, 403, 404, 429, 500]) {
    await assert.rejects(isPublished(react, response(status, { error: "unauthorized or unavailable" })), /Registry lookup failed/);
  }
  for (const metadata of [
    { name: react.name, version: theme.version, dist: { integrity: theme.integrity } },
    { name: theme.name, version: "1.0.1", dist: { integrity: theme.integrity } },
    { name: theme.name, version: theme.version, dist: { integrity: react.integrity } }
  ]) await assert.rejects(isPublished(theme, response(200, { name: theme.name, versions: { [theme.version]: metadata } })), /mismatch/);
  await assert.rejects(isPublished(react, response(404, {})), /Registry lookup failed/);
  await assert.rejects(isPublished(react, response(200, {})), /metadata mismatch/);
  await assert.rejects(isPublished(react, async () => { throw new Error("network unavailable"); }), /network unavailable/);
  await assert.rejects(isPublished(react, async () => ({ status: 404, async json() { throw new SyntaxError("invalid JSON"); } })), /invalid JSON/);
});

test("fallback retries only missing React after trusted theme success", async () => {
  const published = new Set();
  const attempts = [];
  const journal = {};
  const lookup = async (pkg) => published.has(pkg.project);
  await assert.rejects(publishPackages([theme, react], { lookup, attempts: journal, async publish(pkg) {
    attempts.push(`trusted:${pkg.project}`);
    if (pkg.project === "ui-react") throw Object.assign(new Error("ENEEDAUTH"), { retryableAuth: true });
    published.add(pkg.project);
  } }), /ENEEDAUTH/);
  await publishPackages([theme, react], { lookup, attempts: journal, async publish(pkg) {
    attempts.push(`token:${pkg.project}`);
    published.add(pkg.project);
  } });
  assert.deepEqual(attempts, ["trusted:ui-theme", "trusted:ui-react", "token:ui-react"]);
});

test("uncertain or mismatched registry state stops the full selection before any publish", async () => {
  let writes = 0;
  await assert.rejects(publishPackages([theme, react], {
    async lookup(pkg) { if (pkg.project === "ui-react") throw new Error("integrity mismatch"); return false; },
    async publish() { writes++; }
  }), /integrity mismatch/);
  assert.equal(writes, 0);
});

test("accepted publication with a lost response is verified without a second write", async () => {
  let visible = false;
  let writes = 0;
  await publishPackages([react], {
    async lookup() { return visible; },
    async publish() { writes++; visible = true; throw new Error("connection lost"); }
  });
  assert.equal(writes, 1);
});

test("dry runs never write and successful commands still require registry evidence", async () => {
  let writes = 0;
  await publishPackages([react], { lookup: async () => false, dryRun: true, publish: async () => { writes++; } });
  assert.equal(writes, 0);
  const attempts = {};
  await assert.rejects(publishPackages([react], { lookup: async () => false, attempts, publish: async () => {} }), /not visible/);
  await assert.rejects(publishPackages([react], { lookup: async () => false, attempts, publish: async () => { writes++; } }), /unresolved/);
  assert.equal(writes, 0);
});

test("unknown network failures are not converted into token retries", async () => {
  const attempts = {};
  await assert.rejects(publishPackages([react], { lookup: async () => false, attempts,
    publish: async () => { throw new Error("connection lost"); } }), /connection lost/);
  await assert.rejects(publishPackages([react], { lookup: async () => false, attempts,
    publish: async () => { assert.fail("must not retry"); } }), /unresolved/);
});

test("prepared manifests reject duplicate projects, unknown identities, and escaping tarball paths", () => {
  assert.deepEqual(validatePackages([theme, react]), [theme, react]);
  for (const packages of [[], [theme, theme], [{ ...react, name: theme.name }], [{ ...react, file: "../secret.tgz" }]]) {
    assert.throws(() => validatePackages(packages), /prepared package|prepared packages/);
  }
});

test("React-only preparation retains the staged identity and rejects tampered recovery bytes", (t) => {
  const source = mkdtempSync(join(tmpdir(), "wm-publication-"));
  t.after(() => rmSync(source, { recursive: true, force: true }));
  const staged = join(source, "dist", "packages", "ui-react");
  const destination = join(source, "prepared");
  mkdirSync(staged, { recursive: true });
  const manifest = JSON.stringify({ name: react.name, version: react.version });
  writeFileSync(join(staged, "package.json"), manifest);
  const packages = preparePackages(source, destination, "ui-react", (command, args) => {
    assert.equal(command, "npm");
    assert.equal(args[0], "pack");
    assert.equal(args[1], staged);
    writeFileSync(join(destination, react.file), "react");
    return JSON.stringify([{ name: react.name, version: react.version, filename: react.file, integrity: react.integrity }]);
  });
  assert.deepEqual(packages, [react]);
  assert.throws(() => preparePackages(source, destination, "ui-react"), /already prepared/);
  assert.equal(readFileSync(join(staged, "package.json"), "utf8"), manifest);
  writeFileSync(join(destination, react.file), "changed bytes");
  assert.throws(() => execFileSync(process.execPath, ["scripts/release-publication.mjs", "publish"], {
    encoding: "utf8", env: { ...process.env, RELEASE_ARTIFACT_DIR: destination, DRY_RUN: "true" },
    stdio: ["ignore", "pipe", "pipe"]
  }), /tarball integrity mismatch/);
});
