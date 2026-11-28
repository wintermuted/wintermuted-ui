import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transformWithOxc } from "vite";

const sources = ["ui-react", "ui-react-select"].map(
  project => new URL(`../packages/${project}/src/`, import.meta.url).href,
);

export async function resolve(specifier, context, nextResolve) {
  if (context.parentURL && specifier.startsWith(".") && specifier.endsWith(".js")) {
    const target = new URL(specifier, context.parentURL);
    if (sources.some(source => target.href.startsWith(source))) {
      for (const extension of [".ts", ".tsx"]) {
        const candidate = new URL(target.href.replace(/\.js$/, extension));
        if (existsSync(candidate)) return nextResolve(candidate.href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (!sources.some(source => url.startsWith(source)) || !/\.tsx?$/.test(url)) return nextLoad(url, context);
  const filename = fileURLToPath(url);
  const { code } = await transformWithOxc(await readFile(filename, "utf8"), filename, {
    jsx: { runtime: "automatic" },
  });
  return { format: "module", source: code, shortCircuit: true };
}
