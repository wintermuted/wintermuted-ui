import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";

test("native modal focus containment, keyboard interactions, themes and responsive showcase", { timeout: 90000 }, async () => {
  const server = await createServer({ configFile: false, server: { host: "127.0.0.1", port: 0 } });
  let browser;
  try {
    await server.listen();
    const address = server.httpServer.address();
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, colorScheme: "dark" });
    const page = await context.newPage();
    const failures = [];
    page.on("pageerror", error => failures.push(error.message));
    await page.route("https://api.github.com/**", route => route.fulfill({ json: [] }));
    await page.goto(`http://127.0.0.1:${address.port}/showcase/react.html`);
    const appearance = page.getByLabel("Appearance", { exact: true });
    await appearance.waitFor();
    assert.equal(await appearance.inputValue(), "system");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await appearance.selectOption("light");
    await page.emulateMedia({ colorScheme: "light" });
    await page.emulateMedia({ colorScheme: "dark" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
    await page.reload();
    await appearance.waitFor();
    assert.equal(await appearance.inputValue(), "light");

    const opener = page.getByRole("button", { name: "Open dialog", exact: true });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "Stop details" });
    await dialog.waitFor();
    assert.ok(await dialog.evaluate(node => node.matches(":modal")));
    for (const key of ["Tab", "Shift+Tab"]) {
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press(key);
        assert.ok(await dialog.evaluate(node => node.contains(document.activeElement)));
      }
    }
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.ok(await opener.evaluate(node => node === document.activeElement));
    await opener.click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    assert.ok(await opener.evaluate(node => node === document.activeElement));

    await page.getByRole("button", { name: "More actions" }).focus();
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.evaluate(() => document.activeElement.textContent), "Refresh");
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.evaluate(() => document.activeElement.textContent), "Read installation guide");
    await page.keyboard.press("Escape");
    assert.ok(await page.getByRole("button", { name: "More actions" }).evaluate(node => node === document.activeElement));

    await page.getByRole("tab", { name: "Arrivals" }).focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.getByRole("tab", { name: "Routes" }).getAttribute("aria-selected"), "true");
    await page.keyboard.press("Home");
    await page.getByLabel("Search stops", { exact: true }).fill("South");
    await page.getByRole("option", { name: "South at Main" }).click();
    assert.ok(await page.getByText("South at Main", { exact: true }).count() >= 1);
    await page.getByRole("heading", { name: "React components", exact: true }).click();

    const screenshotDir = process.env.WM_SCREENSHOT_DIR;
    if (screenshotDir) {
      await mkdir(screenshotDir, { recursive: true });
      await page.screenshot({ path: join(screenshotDir, "react-desktop-light.png"), fullPage: true, animations: "disabled" });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await appearance.selectOption("system");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    if (screenshotDir) {
      await page.screenshot({ path: join(screenshotDir, "react-mobile-dark.png"), fullPage: true, animations: "disabled" });
    }
    assert.deepEqual(failures, []);
    await context.close();
  } finally {
    await browser?.close();
    await server.close();
  }
});
