import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

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
