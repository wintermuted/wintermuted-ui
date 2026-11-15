import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: "./",
  publicDir: false,
  build: {
    outDir: "showcase-dist",
    rollupOptions: { input: fileURLToPath(new URL("./react.html", import.meta.url)) },
  },
});
