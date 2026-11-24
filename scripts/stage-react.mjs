import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const source = new URL("../packages/ui-react/", import.meta.url);
const target = new URL("../dist/packages/ui-react/", import.meta.url);

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
manifest.main = "./src/index.js";
manifest.types = "./src/index.d.ts";
manifest.exports = {
  ".": { types: "./src/index.d.ts", default: "./src/index.js" },
  "./select": { types: "./src/select.d.ts", default: "./src/select.js" },
  "./theme": { types: "./src/theme.d.ts", default: "./src/theme.js" },
};
manifest.typesVersions = { "*": { select: ["src/select.d.ts"], theme: ["src/theme.d.ts"] } };
writeFileSync(new URL("package.json", target), `${JSON.stringify(manifest, null, 2)}\n`);
