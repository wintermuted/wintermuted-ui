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

test("transferred controls retain context-free sources, explicit CSS and public type exports", async () => {
  const reactRoot = new URL("../ui-react/src/", root);
  const barrel = await readFile(new URL("index.tsx", reactRoot), "utf8");
  const interfaces = await readFile(new URL("interfaces.ts", reactRoot), "utf8");
  for (const name of ["ToggleGroup", "FacetFilter", "SortableTableHeader", "StatCard", "RankedBarList",
    "Toast", "ColorPicker", "NumberStepper", "LanguageSelector"]) {
    assert.ok(barrel.includes(`export { ${name} } from "./components/${name}.js"`), name);
    assert.ok(barrel.includes(`${name}Props`), `${name} public props`);
    assert.ok(interfaces.includes(`export interface ${name}Props`), name);
    const source = await readFile(new URL(`components/${name}.tsx`, reactRoot), "utf8");
    assert.doesNotMatch(source, /wm-staged|game-of-life|ui-staging|i18next|localStorage|setTimeout|App\.css/);
    assert.doesNotMatch(source, /import\s+["'][^"']+\.css["']/);
    for (const match of source.matchAll(/from\s+["'](\.[^"']+)["']/g)) assert.ok(match[1].endsWith(".js"), match[1]);
  }
  for (const name of ["color-picker", "ranked-bar-list", "number-stepper", "language-selector"]) {
    const css = await readFile(new URL(`styles/components/${name}.css`, root), "utf8");
    assert.doesNotMatch(css, /wm-staged|grid-overlay-controls|play-about|App\.css/);
  }
});

test("React integration depends on the theme, not the reverse", async () => {
  const react = JSON.parse(await readFile(new URL("../ui-react/package.json", root), "utf8"));
  assert.equal(react.dependencies["@wintermuted/ui-theme"], `^${pkg.version}`);
  assert.ok(react.peerDependencies.react);
  assert.ok(react.peerDependencies["react-dom"]);
  assert.equal(react.peerDependenciesMeta["react-select"].optional, true);
  assert.doesNotMatch(await readFile(new URL("../ui-react/src/index.tsx", root), "utf8"), /react-select/);
});

test("React source package refuses packing and publishing through its prepack hook", async () => {
  const { spawnSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const source = new URL("../ui-react/", root);
  const react = JSON.parse(await readFile(new URL("package.json", source), "utf8"));
  const [command, ...args] = react.scripts.prepack.split(" ");
  assert.equal(command, "node");
  const result = spawnSync(process.execPath, args, { cwd: fileURLToPath(source), encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Cannot pack or publish.*TSX source workspace/);
  assert.match(result.stderr, /dist\/packages\/ui-react/);
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
