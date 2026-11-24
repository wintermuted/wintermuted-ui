import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

test("reusable controls preserve native interaction and fit desktop/mobile theme layouts", { timeout: 90000 }, async () => {
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
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/showcase/react.html`);
    await page.getByRole("group", { name: "Documents", exact: true }).waitFor();
    const palette = page.getByRole("group", { name: "Ink palette" });
    assert.ok(await palette.evaluate(group => {
      const [first, second] = group.querySelectorAll("button");
      return second.getBoundingClientRect().left > first.getBoundingClientRect().right;
    }));
    await palette.getByRole("button", { name: "Green ink" }).click();
    assert.equal(await palette.getByRole("button", { name: "Green ink" }).getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator(".wm-facet-filter .wm-checkbox-filter-label").first()
      .evaluate(node => getComputedStyle(node).flexDirection), "row");
    await page.getByRole("button", { name: "Returns", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Returns", exact: true }).getAttribute("aria-pressed"), "true");
    await page.getByRole("checkbox", { name: /All Services/ }).uncheck();
    assert.equal(await page.getByRole("checkbox", { name: /Any department/ }).isChecked(), true);
    await page.getByRole("button", { name: "More departments" }).click();
    assert.equal(await page.getByRole("checkbox", { name: /Closed/ }).isDisabled(), true);
    await page.getByRole("button", { name: "Increase quantity" }).click();
    assert.equal(await page.locator(".wm-stepper-value").textContent(), "0.6");
    await page.getByRole("button", { name: "Reverse vendor" }).click();
    assert.equal(await page.getByRole("columnheader", { name: /Vendor/ }).getAttribute("aria-sort"), "descending");

    const locale = page.getByRole("button", { name: /^Popup locale:/ });
    await locale.click();
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.evaluate(() => document.activeElement.textContent), "German");
    await page.getByRole("button", { name: "Increase quantity" }).evaluate(button => button.click());
    assert.equal(await page.evaluate(() => document.activeElement.textContent), "German");
    await page.keyboard.press("Enter");
    assert.equal(await page.getByLabel("Native locale").inputValue(), "de");
    assert.equal(await page.getByRole("button", { name: "Popup locale: German" }).count(), 1);
    assert.ok(await locale.evaluate(node => node === document.activeElement));
    await locale.click();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("listbox", { name: "Popup locale" }).count(), 0);

    const picker = page.locator(".wm-color-picker"), trigger = picker.locator("summary");
    await trigger.click();
    const hex = page.getByRole("textbox", { name: "Ink hex" });
    await hex.fill("bad");
    await hex.press("Enter");
    assert.equal(await hex.getAttribute("aria-invalid"), "true");
    await hex.fill(" AABBCC ");
    await hex.press("Tab");
    assert.equal(await hex.inputValue(), "#aabbcc");
    assert.equal(await page.getByRole("status").filter({ hasText: "Preferences saved" }).count(), 0);
    await hex.focus();
    await hex.press("Enter");
    assert.equal(await picker.getAttribute("open"), null);
    assert.ok(await trigger.evaluate(node => node === document.activeElement));
    await page.getByRole("button", { name: "Dismiss notice" }).click();
    assert.equal(await page.locator(".wm-toast").getAttribute("inert"), "");
    assert.equal(await page.locator(".wm-toast").isVisible(), false);

    for (const theme of ["light", "dark"]) {
      await page.getByLabel("Appearance", { exact: true }).selectOption(theme);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1100 });
        await trigger.click();
        assert.ok(await picker.locator(".wm-color-picker-panel").isVisible());
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        assert.ok(await picker.locator(".wm-color-picker-panel").evaluate(node => {
          const bounds = node.getBoundingClientRect();
          return bounds.left >= 0 && bounds.right <= window.innerWidth;
        }));
        await page.keyboard.press("Escape");
      }
    }
    assert.deepEqual(failures, []);
    await context.close();
  } finally {
    await browser?.close();
    await server.close();
  }
});
