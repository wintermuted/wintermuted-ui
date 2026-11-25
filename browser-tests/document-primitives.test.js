import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

test("review regressions: nested Escape, unclipped filter popups, long-panel scrolling and standalone gallery sizing", { timeout: 90000 }, async () => {
    const server = await createServer({
      configFile: fileURLToPath(new URL("../packages/showcase/vite.config.mjs", import.meta.url)),
      server: { host: "127.0.0.1", port: 0 },
    });
    let browser;
    try {
      await server.listen();
      browser = await chromium.launch();
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const failures = [];
      page.on("pageerror", error => failures.push(error.message));
      const fixture = fileURLToPath(new URL("./fixtures/filter-panel-review.js", import.meta.url)).replaceAll("\\", "/");
      await page.route("**/review-fixture.html", route => route.fulfill({
        contentType: "text/html",
        body: `<html><head><link rel="stylesheet" href="/showcase/styles/theme.css"></head>
          <body><div id="react-showcase"></div><script type="module" src="/showcase/@fs/${fixture}"></script></body></html>`,
      }));
      await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/showcase/review-fixture.html`);
      await page.getByRole("button", { name: "Open containing dialog" }).click();
      const dialog = page.getByRole("dialog", { name: "Containing dialog" });
      const nestedToggle = dialog.getByRole("button", { name: "Open Nested filters" });
      await nestedToggle.click();
      await page.getByRole("textbox", { name: "Nested filters field 0" }).focus();
      await page.keyboard.press("Escape");
      assert.equal(await nestedToggle.getAttribute("aria-expanded"), "false");
      assert.ok(await dialog.evaluate(node => node.matches(":modal")));
      assert.ok(await nestedToggle.evaluate(node => node === document.activeElement));
      await page.keyboard.press("Escape");
      assert.equal(await dialog.isVisible(), false);

      await page.getByRole("button", { name: "Open Long filters" }).click();
      const panel = page.getByRole("complementary", { name: "Long filters", exact: true });
      const picker = panel.locator(".wm-color-picker");
      await picker.locator("summary").click();
      const swatch = page.getByRole("button", { name: "Long filters green" });
      assert.ok(await swatch.evaluate(button => {
        const bounds = button.getBoundingClientRect();
        const panelBounds = button.closest("aside").getBoundingClientRect();
        const x = bounds.left + bounds.width / 2, y = bounds.top + bounds.height / 2;
        return bounds.top < panelBounds.top && button.contains(document.elementFromPoint(x, y));
      }), "The popup extends above the filter panel and remains hit-testable");
      await swatch.click();
      await picker.locator("summary").click();
      await page.getByRole("textbox", { name: "Long filters hex" }).press("Escape");
      assert.equal(await page.getByRole("button", { name: "Open Long filters" }).getAttribute("aria-expanded"), "true");
      const last = page.getByRole("textbox", { name: "Long filters field 23" });
      await last.scrollIntoViewIfNeeded();
      await last.fill("Still reachable");
      assert.ok(await page.evaluate(() => window.scrollY > 0));
      assert.equal(await last.inputValue(), "Still reachable");
      assert.equal(await panel.evaluate(node => getComputedStyle(node).overflowY), "visible");
      await last.press("Escape");

      const css = await readFile(new URL("../packages/ui-theme/styles/components/gallery.css", import.meta.url), "utf8");
      await page.setContent(`<style>:root { --wm-space-4: 1rem; } ${css}</style>
        <div style="width: 240px"><img class="wm-preview-image" alt="Cover"
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='10'/%3E">
          <div class="wm-preview-image wm-preview-image-fallback" role="img" aria-label="No cover">No cover</div></div>`);
      assert.deepEqual(await page.locator(".wm-preview-image").evaluateAll(nodes =>
        nodes.map(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }))),
      [{ width: 240, height: 150 }, { width: 240, height: 150 }]);
      assert.deepEqual(failures, []);
    } finally {
      await browser?.close();
      await server.close();
    }
});

test("document primitives retain navigation, image retry and non-modal responsive disclosure behavior", { timeout: 90000 }, async () => {
  const server = await createServer({
    configFile: fileURLToPath(new URL("../packages/showcase/vite.config.mjs", import.meta.url)),
    server: { host: "127.0.0.1", port: 0 },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await context.newPage(), failures = [];
    page.on("pageerror", error => failures.push(error.message));
    await page.route("https://api.github.com/**", route => route.fulfill({ json: [] }));
    await page.route("**/missing-document-cover.png", route => route.fulfill({ status: 404, body: "" }));
    const base = `http://127.0.0.1:${server.httpServer.address().port}/showcase/`;
    await page.goto(`${base}react.html`);
    const trail = page.getByRole("navigation", { name: "Document trail" });
    await trail.waitFor();
    assert.equal(await trail.getByText("Documents", { exact: true }).getAttribute("aria-current"), "page");
    await trail.getByRole("link", { name: "Installation guide" }).click();
    await page.waitForURL(`${base}installation.html`);
    await page.goto(`${base}react.html`);
    await page.getByRole("img", { name: "Cover unavailable" }).waitFor();
    await page.getByRole("button", { name: "Use unavailable cover" }).click();
    await page.getByRole("img", { name: "Cover unavailable" }).waitFor();
    await page.getByRole("button", { name: "Load cover", exact: true }).click();
    const image = page.getByRole("img", { name: "Document cover", exact: true });
    await image.waitFor();
    await page.waitForFunction(() => {
      const image = document.querySelector("img.wm-preview-image");
      return image?.complete && image.naturalWidth > 0;
    });
    await page.getByRole("button", { name: "Use unavailable cover" }).click();
    await page.getByRole("img", { name: "Cover unavailable" }).waitFor();
    const toggle = page.getByRole("button", { name: "Refine documents", exact: true });
    const panel = page.locator(".wm-filter-panel-controls");
    const owner = page.getByRole("textbox", { name: "Document owner" });
    await owner.fill("Grace");
    await owner.evaluate(node => { node.dataset.mounted = "original"; });

    for (const theme of ["light", "dark"]) {
      await page.getByLabel("Appearance", { exact: true }).selectOption(theme);
      await page.setViewportSize({ width: 1440, height: 1100 });
      assert.equal(await toggle.isVisible(), false);
      assert.ok(await panel.isVisible());
      assert.equal(await owner.inputValue(), "Grace");
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(await toggle.isVisible());
      assert.equal(await panel.isVisible(), false);
      assert.equal(await owner.isVisible(), false);
      assert.equal(await page.getByRole("textbox", { name: "Document owner" }).count(), 0);
      for (const dismissal of ["escape", "close", "scrim"]) {
        await toggle.click();
        assert.equal(await toggle.getAttribute("aria-expanded"), "true");
        assert.equal(await toggle.getAttribute("aria-controls"), await panel.getAttribute("id"));
        assert.ok(await panel.isVisible());
        assert.equal(await panel.getAttribute("aria-modal"), null);
        assert.equal(await panel.getAttribute("role"), null);
        assert.equal(await page.locator("dialog:modal").count(), 0);
        assert.equal(await owner.inputValue(), "Grace");
        assert.equal(await owner.getAttribute("data-mounted"), "original");
        assert.ok(await panel.evaluate(node => {
          const rect = node.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= window.innerWidth;
        }));
        const select = page.getByRole("combobox", { name: "Document type" });
        await select.focus();
        await page.keyboard.press("Tab");
        assert.equal(await panel.evaluate(node => node.contains(document.activeElement)), false);
        await owner.focus();
        if (dismissal === "escape") await page.keyboard.press("Escape");
        else if (dismissal === "close") await page.getByRole("button", { name: "Close document filters" }).click();
        else await page.locator(".wm-filter-panel-scrim").click({ position: { x: 2, y: 842 } });
        assert.equal(await toggle.getAttribute("aria-expanded"), "false");
        assert.equal(await panel.isVisible(), false);
        assert.ok(await toggle.evaluate(node => node === document.activeElement));
      }
      await toggle.click();
      await page.setViewportSize({ width: 1440, height: 1100 });
      assert.ok(await panel.isVisible());
      assert.equal(await page.locator(".wm-filter-panel-scrim").isVisible(), false);
      assert.equal(await owner.inputValue(), "Grace");
      await page.setViewportSize({ width: 390, height: 844 });
      await owner.focus();
      await page.keyboard.press("Escape");
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1100 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        if (process.env.WM_SCREENSHOT_DIR) {
          await mkdir(process.env.WM_SCREENSHOT_DIR, { recursive: true });
          await page.locator(".wm-page-header").scrollIntoViewIfNeeded();
          if (width === 390) await toggle.click();
          await page.screenshot({ path: join(process.env.WM_SCREENSHOT_DIR, `documents-${theme}-${width}.png`), animations: "disabled" });
          if (width === 390) { await owner.focus(); await page.keyboard.press("Escape"); }
        }
      }
    }
    assert.deepEqual(failures, []);
    await context.close();
  } finally {
    await browser?.close();
    await server.close();
  }
});
