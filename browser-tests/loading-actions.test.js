import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

test("loading actions preserve native keyboard behavior, retained fields and responsive theme styling", { timeout: 90000 }, async () => {
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
    const url = `http://127.0.0.1:${server.httpServer.address().port}/showcase/react.html`;
    await page.goto(url);
    const disclosure = page.locator(".wm-action-disclosure");
    const section = page.locator(".react-doc-section").filter({ has: disclosure });
    const trigger = disclosure.getByRole("button", { name: "Record options", exact: true });
    const action = disclosure.getByRole("button", { name: "Edit record options" });
    await trigger.waitFor();
    const panelId = await trigger.getAttribute("aria-controls");
    const panel = page.locator(`[id="${panelId}"]`);
    const field = disclosure.getByRole("textbox", { name: "Record name" });
    await field.fill("Unsaved record draft");
    await trigger.focus();
    await page.keyboard.press("Enter");
    assert.equal(await panel.getAttribute("hidden"), "");
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(await panel.locator("input").inputValue(), "Unsaved record draft");
    await page.keyboard.press("Space");
    assert.equal(await panel.getAttribute("hidden"), null);
    assert.equal(await field.inputValue(), "Unsaved record draft");
    await trigger.click();
    await action.focus();
    await page.keyboard.press("Enter");
    assert.equal(await panel.getAttribute("hidden"), null);
    assert.equal(await action.evaluate(node => node === document.activeElement), true);
    assert.equal(await disclosure.getByText(/Editing options/).count(), 1);
    assert.equal(await action.evaluate(node => node.closest("h4, summary") === null), true);

    await section.getByRole("button", { name: "Show warning" }).click();
    assert.equal(await panel.getByRole("status").textContent(), "Some records are incomplete.");
    await section.getByRole("button", { name: "Update records", exact: true }).click();
    assert.equal(await section.getByRole("button", { name: "Updating records" }).isDisabled(), true);
    assert.equal(await panel.getByRole("status", { name: "Loading records" }).count(), 1);
    await section.getByRole("button", { name: "Complete update" }).click();
    await section.getByRole("button", { name: "Show error" }).click();
    const retry = panel.getByRole("button", { name: "Retry records", exact: true });
    await retry.focus();
    await page.keyboard.press("Enter");
    assert.equal(await retry.isDisabled(), true);
    assert.equal(await trigger.getAttribute("aria-expanded"), "true");
    assert.equal(await panel.getByRole("alert").textContent(), "Records could not be loaded. Some records are incomplete.");
    assert.equal(await panel.getByRole("status").count(), 0);
    await section.getByRole("button", { name: "Complete update" }).click();

    const help = section.getByRole("button", { name: "About excluded records" });
    await help.focus();
    await section.getByRole("tooltip").waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await section.getByRole("tooltip").count(), 0);

    const artifacts = process.env.WM_BROWSER_ARTIFACT_DIR;
    if (artifacts) await mkdir(artifacts, { recursive: true });
    for (const theme of ["light", "dark"]) {
      await page.getByLabel("Appearance", { exact: true }).selectOption(theme);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1100 });
        await section.getByRole("button", { name: "Show error" }).click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
        for (const control of [trigger, action, retry]) {
          assert.equal(await control.evaluate(node => {
            const bounds = node.getBoundingClientRect();
            return bounds.left >= 0 && bounds.right <= window.innerWidth && bounds.height >= 44;
          }), true);
        }
        assert.equal(await trigger.evaluate(node => getComputedStyle(node).backgroundColor), "rgba(0, 0, 0, 0)");
        await trigger.focus();
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Tab");
        assert.equal(await trigger.evaluate(node => getComputedStyle(node).outlineStyle), "solid");
        if (artifacts) await section.screenshot({ path: join(artifacts, `loading-actions-${theme}-${width}.png`) });
        await section.getByRole("button", { name: "Clear error" }).click();
      }
    }
    await page.evaluate(() => {
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => node.remove());
    });
    const sheet = fileURLToPath(new URL("../packages/ui-theme/styles/components/load-status.css", import.meta.url)).replaceAll("\\", "/");
    await page.addStyleTag({ url: new URL(`@fs/${sheet}`, url).href });
    const announcement = section.getByRole("status").filter({ hasText: "Archived records are excluded." });
    assert.equal(await announcement.count(), 1, "The help message must remain in the accessibility tree");
    assert.deepEqual(await announcement.evaluate(node => {
      const style = getComputedStyle(node);
      return { position: style.position, width: style.width, height: style.height,
        overflow: style.overflow, clipPath: style.clipPath };
    }), { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clipPath: "inset(50%)" },
    "Loading only load-status.css must supply its screen-reader-only dependency");
    assert.deepEqual(failures, []);
    await context.close();
  } finally {
    await browser?.close();
    await server.close();
  }
});
