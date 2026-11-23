import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const root = new URL("../packages/ui-theme/", import.meta.url);
const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

test("all exports exist and legacy CSS entry points remain CSS-only", async () => {
  for (const [name, target] of Object.entries(pkg.exports)) {
    for (const path of typeof target === "string" ? [target] : Object.values(target)) {
      await access(new URL(path, root));
    }
    if (name.endsWith(".css")) assert.equal(target, name);
  }
  assert.equal(pkg.exports["."], "./index.js");
  assert.doesNotMatch(await readFile(new URL("index.js", root), "utf8"), /react/);
  assert.equal(pkg.peerDependencies, undefined);
  assert.equal(pkg.peerDependenciesMeta, undefined);
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.typesVersions, undefined);
  assert.equal(pkg.scripts.prepack, undefined);
  assert.equal(pkg.nx.implicitDependencies, undefined);
  for (const name of ["./react", "./react/select", "./theme"]) {
    assert.equal(pkg.exports[name], undefined);
  }
});

test("every component stylesheet is publicly exported and registered", async () => {
  const { readdir } = await import("node:fs/promises");
  const barrel = await readFile(new URL("styles/components.css", root), "utf8");
  for (const file of await readdir(new URL("styles/components/", root))) {
    assert.ok(pkg.exports[`./styles/components/${file}`], file);
    assert.ok(barrel.includes(`./components/${file}`), file);
  }
});

test("React integration depends on the theme, not the reverse", async () => {
  const react = JSON.parse(await readFile(new URL("../ui-react/package.json", root), "utf8"));
  assert.equal(react.dependencies["@wintermuted/ui-theme"], `^${pkg.version}`);
  assert.ok(react.peerDependencies.react);
  assert.ok(react.peerDependencies["react-dom"]);
  assert.equal(react.peerDependenciesMeta["react-select"].optional, true);
  assert.doesNotMatch(await readFile(new URL("../ui-react/src/index.js", root), "utf8"), /react-select/);
});

test("local linking links CSS-only theme without preparing React sources", async () => {
  const { mkdtemp, mkdir, cp, writeFile, rm } = await import("node:fs/promises");
  const { execFileSync } = await import("node:child_process");
  const { tmpdir } = await import("node:os");
  const { delimiter, join } = await import("node:path");
  const temp = await mkdtemp(join(tmpdir(), "wm-local-link-"));
  try {
    const repo = join(temp, "repo");
    const bin = join(temp, "bin");
    await mkdir(join(repo, "scripts"), { recursive: true });
    await mkdir(join(repo, "packages", "ui-theme"), { recursive: true });
    await mkdir(bin);
    await cp(new URL("../scripts/link-local.sh", import.meta.url), join(repo, "scripts", "link-local.sh"));
    await cp(new URL("package.json", root), join(repo, "packages", "ui-theme", "package.json"));
    for (const consumer of ["consumer one", "consumer two"]) await mkdir(join(temp, consumer));
    await writeFile(join(bin, "npm"), `#!/usr/bin/env bash
set -euo pipefail
if [ "$2" = "--workspace=@wintermuted/ui-theme" ]; then
  node -e 'const assert = require("node:assert/strict"); const pkg = require("./packages/ui-theme/package.json"); assert.equal(pkg.peerDependencies, undefined); assert.equal(pkg.exports["./react"], undefined);'
fi
echo "npm $*"
`, { mode: 0o755 });
    const output = execFileSync("bash", [join(repo, "scripts", "link-local.sh"), "consumer one", "consumer two"], {
      cwd: temp,
      env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH}` },
      encoding: "utf8"
    });
    assert.deepEqual(output.split(/\r?\n/).filter(line => line.startsWith("npm ")), [
      "npm link --workspace=@wintermuted/ui-theme",
      "npm link @wintermuted/ui-theme",
      "npm link @wintermuted/ui-theme"
    ]);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
