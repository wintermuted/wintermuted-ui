import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { site } from "../packages/showcase/src/site.config.mjs";
import { validateSite } from "../packages/showcase/src/templates/layout.mjs";
import { discoverPages } from "../packages/showcase/src/templates/vite-plugin.mjs";

const source = fileURLToPath(new URL("../packages/showcase/src/pages/", import.meta.url));
const output = fileURLToPath(new URL("../dist/packages/showcase/showcase/", import.meta.url));
const registry = validateSite(site, discoverPages(source));
const pages = site.pages.map((page) => page.file);
const navigationFiles = site.navigation.flatMap((section) => section.items.flatMap((item) =>
  typeof item === "object" && item.items ? item.items : [item]
)).map((item) => typeof item === "string" ? item : item.page);

for (const page of pages) {
  const path = resolve(output, page);
  assert.ok(existsSync(path), `Missing built page: ${page}`);
  const html = readFileSync(path, "utf8");
  assert.ok(!/<!--\s*site:/.test(html), `Unexpanded template slot in ${page}`);
  const dom = new JSDOM(html);
  const docs = (registry.get(page).layout ?? "docs") === "docs";
  assert.equal(dom.window.document.querySelectorAll(".docs-topbar-global").length, docs ? 1 : 0, `Incorrect layout for ${page}`);
  assert.equal(dom.window.document.querySelectorAll(".docs-sidebar .docs-nav-group").length, docs ? 1 : 0, `Missing or duplicate static navigation in ${page}`);
  const links = Array.from(dom.window.document.querySelectorAll(".docs-sidebar [data-page]"));
  assert.deepEqual(links.map((link) => link.getAttribute("data-page")), docs ? navigationFiles : [], `Incorrect static navigation entries in ${page}`);
  assert.equal(dom.window.document.querySelectorAll(".docs-sidebar [aria-current=page]").length, docs && navigationFiles.includes(page) ? 1 : 0, `Incorrect active-page state in ${page}`);
  const navLink = dom.window.document.querySelector(`.docs-sidebar [data-page="${page}"]`);
  if (navLink) {
    assert.equal(navLink.getAttribute("aria-current"), "page", `Missing static active-page state in ${page}`);
    const disclosure = navLink.closest("details");
    if (disclosure) assert.ok(disclosure.open, `Active navigation group is closed in ${page}`);
  }
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
assert.ok(existsSync(resolve(output, "logo.png")), "Missing logo used by the shared script's runtime header image");
console.log(`Verified ${pages.length} built pages and relative assets for production and nested PR previews.`);
