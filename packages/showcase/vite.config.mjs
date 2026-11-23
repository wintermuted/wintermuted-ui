import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const input = Object.fromEntries(
  readdirSync(root)
    .filter((file) => file.endsWith(".html"))
    .map((file) => [file.slice(0, -5), resolve(root, file)])
);

export default defineConfig(({ command }) => ({
  root,
  base: command === "serve" ? "/showcase/" : "./",
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
    outDir: resolve(root, "../../dist/packages/showcase/showcase"),
    emptyOutDir: true,
    rolldownOptions: { input }
  }
}));
