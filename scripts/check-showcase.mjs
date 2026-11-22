import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const source = fileURLToPath(new URL("../apps/showcase/", import.meta.url));
const output = fileURLToPath(new URL("../dist/apps/showcase/showcase/", import.meta.url));
const pages = readdirSync(source).filter((file) => file.endsWith(".html"));

for (const page of pages) {
  const path = resolve(output, page);
  assert.ok(existsSync(path), `Missing built page: ${page}`);
  const dom = new JSDOM(readFileSync(path, "utf8"));
  for (const element of dom.window.document.querySelectorAll("a[href], link[href], script[src], img[src]")) {
    const reference = element.getAttribute("href") ?? element.getAttribute("src");
    if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) continue;
    assert.ok(!reference.startsWith("/"), `${page} has a root-relative asset/link that breaks previews: ${reference}`);
    const local = decodeURIComponent(reference.split(/[?#]/)[0]);
    assert.ok(existsSync(resolve(output, local)), `${page} references missing output: ${reference}`);
  }
  dom.window.close();
}
assert.ok(existsSync(resolve(output, "showcase.js")), "Missing shared classic showcase script");
console.log(`Verified ${pages.length} built pages and relative assets for production and nested PR previews.`);
