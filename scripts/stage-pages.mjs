import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

export function checkStorybook(directory) {
  for (const page of ["index.html", "iframe.html"]) {
    const document = new JSDOM(readFileSync(resolve(directory, page), "utf8"));
    try {
      for (const element of document.window.document.querySelectorAll("script[src], link[href], img[src]")) {
        const reference = element.getAttribute("src") ?? element.getAttribute("href");
        if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) continue;
        assert.ok(!reference.startsWith("/"), `${page} has a root-relative asset that breaks previews: ${reference}`);
        const local = decodeURIComponent(reference.split(/[?#]/)[0]);
        assert.ok(existsSync(resolve(directory, local)), `${page} references missing output: ${reference}`);
      }
    } finally {
      document.window.close();
    }
  }
  const index = JSON.parse(readFileSync(resolve(directory, "index.json"), "utf8"));
  assert.ok(Object.keys(index.entries).length > 0, "Storybook has no published stories or docs");
}

export function stagePages({ showcaseDir, storybookDir, pagesDir, previewNumber }) {
  assert.ok(previewNumber === undefined || /^[1-9]\d*$/.test(String(previewNumber)), "Invalid PR number");
  assert.ok(existsSync(resolve(showcaseDir, "showcase", "index.html")), "Missing built showcase");
  checkStorybook(storybookDir);

  const target = previewNumber === undefined ? pagesDir : resolve(pagesDir, "previews", `pr-${previewNumber}`);
  if (previewNumber !== undefined) {
    rmSync(target, { recursive: true, force: true });
  } else if (existsSync(target)) {
    for (const name of readdirSync(target)) {
      if (name !== ".git" && name !== "previews") rmSync(resolve(target, name), { recursive: true, force: true });
    }
  }
  mkdirSync(target, { recursive: true });
  cpSync(showcaseDir, target, { recursive: true });
  cpSync(storybookDir, resolve(target, "storybook"), { recursive: true });
  writeFileSync(resolve(pagesDir, ".nojekyll"), "");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length <= 3, "Usage: node scripts/stage-pages.mjs [PR-number]");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  stagePages({
    showcaseDir: resolve(root, "dist/packages/showcase"),
    storybookDir: resolve(root, "dist/packages/storybook"),
    pagesDir: resolve(root, "gh-pages-out"),
    previewNumber: process.argv[2],
  });
}
