import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const source = new URL("../packages/ui-react/", import.meta.url);
const target = new URL("../dist/packages/ui-react/", import.meta.url);

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
for (const file of ["src", "README.md", "LICENSE"]) {
  cpSync(new URL(file, source), new URL(file, target), { recursive: true });
}
const manifest = JSON.parse(readFileSync(new URL("package.json", source), "utf8"));
delete manifest.nx;
writeFileSync(new URL("package.json", target), `${JSON.stringify(manifest, null, 2)}\n`);
