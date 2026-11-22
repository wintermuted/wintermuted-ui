import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const version = JSON.parse(readFileSync(join(root, "packages", "ui-theme", "package.json"), "utf8")).version;
const [major, minor, patch] = version.split(".").map(Number);

for (const [type, expected] of [
  ["feat", `${major}.${minor + 1}.0`],
  ["fix", `${major}.${minor}.${patch + 1}`],
  ["feat!", `${major + 1}.0.0`],
  ["chore", null]
]) {
  test(`Nx dry-run derives ${type} releases without publishing or changing manifests`, { timeout: 90000 }, (t) => {
    const cwd = mkdtempSync(join(tmpdir(), "wm-nx-release-"));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    for (const path of ["package.json", "package-lock.json", "nx.json", ".gitignore", "packages", "apps", "scripts"]) {
      cpSync(join(root, path), join(cwd, path), { recursive: true });
    }
    symlinkSync(join(root, "node_modules"), join(cwd, "node_modules"), process.platform === "win32" ? "junction" : "dir");
    const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    git("init", "--quiet");
    git("config", "user.name", "Release test");
    git("config", "user.email", "release-test@example.invalid");
    git("remote", "add", "origin", "https://github.com/wintermuted/wintermuted-ui.git");
    git("add", ".");
    git("commit", "--quiet", "-m", "chore: release fixture baseline");
    git("tag", `v${version}`);
    const tokens = join(cwd, "packages", "ui-theme", "styles", "tokens.css");
    writeFileSync(tokens, `${readFileSync(tokens, "utf8")}\n/* release fixture change */\n`);
    git("add", ".");
    git("commit", "--quiet", "-m", `${type}: update theme`);
    const manifest = join(cwd, "packages", "ui-theme", "package.json");
    const lock = join(cwd, "package-lock.json");
    const before = [readFileSync(manifest, "utf8"), readFileSync(lock, "utf8")];
    const output = execFileSync(process.execPath, ["scripts/release.mjs", "--dry-run"], {
      cwd,
      encoding: "utf8",
      env: { ...process.env, NX_DAEMON: "false", NX_INTERACTIVE: "false" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    if (expected) {
      assert.ok(output.includes(expected), output);
      assert.match(output, /CHANGELOG\.md/);
    } else {
      assert.match(output, /No releasable theme changes/);
    }
    assert.match(output, /Skipped publishing packages/);
    assert.doesNotMatch(output, /Running release version for project: ui-react/);
    assert.deepEqual([readFileSync(manifest, "utf8"), readFileSync(lock, "utf8")], before);
    assert.equal(git("tag", "--list", "ui-theme@*"), "");
  });
}
