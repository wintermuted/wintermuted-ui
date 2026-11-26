import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { site } from "../packages/showcase/src/site.config.mjs";
import { renderPage } from "../packages/showcase/src/templates/layout.mjs";
import { checkShowcase } from "./check-showcase.mjs";

function fixture(t) {
  const output = mkdtempSync(resolve(tmpdir(), "wintermuted-showcase-"));
  t.after(() => rmSync(output, { recursive: true, force: true }));
  for (const page of site.pages) {
    const docs = (page.layout ?? "docs") === "docs";
    const html = `<!doctype html><html><head><!-- site:head --></head><body>
      ${docs ? "<!-- site:docs-open -->" : ""}<main></main>${docs ? "<!-- site:docs-close -->" : ""}
      <!-- site:vendors --><!-- site:scripts --></body></html>`;
    const dom = new JSDOM(renderPage(html, page.file, site));
    for (const element of dom.window.document.querySelectorAll("a[href], link[href], script[src], img[src]")) {
      const attribute = element.hasAttribute("href") ? "href" : "src";
      const reference = element.getAttribute(attribute);
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference) || reference === "../storybook/") continue;
      const relative = reference.startsWith("/") ? `.${reference}` : reference;
      element.setAttribute(attribute, relative);
      const path = resolve(output, relative.split(/[?#]/)[0]);
      mkdirSync(dirname(path), { recursive: true });
      if (!existsSync(path)) writeFileSync(path, "");
    }
    writeFileSync(resolve(output, page.file), dom.serialize());
    dom.window.close();
  }
  return output;
}

test("showcase output accepts the sibling Storybook link without bundling its artifact", (t) => {
  const output = fixture(t);
  assert.equal(checkShowcase(output), site.pages.length);
});

test("the Storybook link exception does not bypass missing local links or assets", (t) => {
  const output = fixture(t);
  const page = resolve(output, "index.html");
  const original = readFileSync(page, "utf8");
  for (const markup of [
    '<a href="./missing.html">Missing page</a>',
    '<a href="../missing-catalog/">Missing catalog</a>',
    '<script src="../storybook/"></script>',
    '<img src="./missing.png">',
  ]) {
    writeFileSync(page, original.replace("</body>", `${markup}</body>`));
    assert.throws(() => checkShowcase(output), /references missing output/);
  }
  writeFileSync(page, original.replace("</body>", '<a href="/storybook/">Wrong base</a></body>'));
  assert.throws(() => checkShowcase(output), /root-relative asset\/link/);
});
