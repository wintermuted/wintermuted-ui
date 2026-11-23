import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { site } from "./src/site.config.mjs";
import { showcaseSite } from "./src/templates/vite-plugin.mjs";

const packageRoot = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(packageRoot, "src");
const pagesRoot = resolve(root, "pages");
const sitePlugin = showcaseSite(site, pagesRoot);
const input = Object.fromEntries(
  site.pages.map((page) => [page.file.slice(0, -5), resolve(pagesRoot, ...page.source.split("/"))])
);

export default defineConfig(({ command }) => ({
  root,
  publicDir: resolve(packageRoot, "public"),
  plugins: [sitePlugin],
  base: command === "serve" ? "/showcase/" : "./",
  experimental: {
    // Page source directories are flattened in the published site.
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === "html") return `./${filename}`;
    }
  },
  server: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true
  },
  preview: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true
  },
  build: {
    outDir: resolve(packageRoot, "../../dist/packages/showcase/showcase"),
    emptyOutDir: true,
    rolldownOptions: { input }
  }
}));
