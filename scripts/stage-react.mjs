import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const project = process.argv[2] ?? "ui-react";
if (process.argv.length > 3 || !["ui-react", "ui-react-select"].includes(project)) {
  throw new Error("Stage ui-react or ui-react-select.");
}
const source = new URL(`../packages/${project}/`, import.meta.url);
const target = new URL(`../dist/packages/${project}/`, import.meta.url);

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
const require = createRequire(import.meta.url);
const typescriptManifest = require.resolve("typescript/package.json");
const typescriptBin = JSON.parse(readFileSync(typescriptManifest, "utf8")).bin.tsc;
execFileSync(process.execPath, [
  resolve(dirname(typescriptManifest), typescriptBin),
  "--project", fileURLToPath(new URL("tsconfig.json", source)),
], { stdio: "inherit" });
for (const file of ["README.md", "LICENSE"]) {
  cpSync(new URL(file, source), new URL(file, target), { recursive: true });
}
const manifest = JSON.parse(readFileSync(new URL("package.json", source), "utf8"));
delete manifest.nx;
delete manifest.scripts.prepack;
if (Object.keys(manifest.scripts).length === 0) delete manifest.scripts;
const compiled = (path, types = false) => path.replace(/\.tsx?$/, types ? ".d.ts" : ".js");
manifest.main = compiled(manifest.main);
manifest.types = compiled(manifest.types, true);
manifest.exports = Object.fromEntries(Object.entries(manifest.exports).map(([name, targets]) => [
  name, { types: compiled(targets.types, true), default: compiled(targets.default) },
]));
if (manifest.typesVersions) {
  manifest.typesVersions = Object.fromEntries(Object.entries(manifest.typesVersions).map(([range, paths]) => [
    range, Object.fromEntries(Object.entries(paths).map(([name, targets]) => [
      name, targets.map(path => compiled(path, true)),
    ])),
  ]));
}
writeFileSync(new URL("package.json", target), `${JSON.stringify(manifest, null, 2)}\n`);
