import { readFileSync } from "node:fs";

const { nx: { name } } = JSON.parse(readFileSync("package.json", "utf8"));
console.error(`Cannot pack or publish the ${name} TSX source workspace. Use the compiled dist/packages/${name} package through Nx instead.`);
process.exitCode = 1;
