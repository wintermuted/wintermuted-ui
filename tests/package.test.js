import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const root = new URL("../", import.meta.url);
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
  assert.doesNotMatch(await readFile(new URL("react/index.js", root), "utf8"), /react-select/);
  assert.deepEqual(Object.keys(pkg.peerDependenciesMeta).sort(), ["react", "react-dom", "react-select"]);
  for (const name of Object.keys(pkg.peerDependencies)) assert.equal(pkg.peerDependenciesMeta[name].optional, true);
});

test("every component stylesheet is publicly exported and registered", async () => {
  const { readdir } = await import("node:fs/promises");
  const barrel = await readFile(new URL("styles/components.css", root), "utf8");
  for (const file of await readdir(new URL("styles/components/", root))) {
    assert.ok(pkg.exports[`./styles/components/${file}`], file);
    assert.ok(barrel.includes(`./components/${file}`), file);
  }
});

test("legacy TypeScript resolution points to public declarations", () => {
  assert.deepEqual(pkg.typesVersions["*"].react, ["react/index.d.ts"]);
  assert.deepEqual(pkg.typesVersions["*"]["react/select"], ["react/select.d.ts"]);
});
