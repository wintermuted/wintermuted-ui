import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";
import { site } from "../packages/showcase/src/site.config.mjs";

test("project card links retain normal theme underlines and hover feedback", { timeout: 90000 }, async () => {
  const server = await createServer({
    configFile: fileURLToPath(new URL("../packages/showcase/vite.config.mjs", import.meta.url)),
    server: { host: "127.0.0.1", port: 0 },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    await page.route("https://**", route => route.fulfill({ body: "", contentType: "text/plain" }));
    const base = `http://127.0.0.1:${server.httpServer.address().port}/showcase/`;
    await page.goto(`${base}projects.html`);
    const icons = page.locator(".project-card-icon");
    assert.equal(await icons.count(), 5);
    assert.ok(await icons.evaluateAll(images => images.every(image =>
      image.complete && image.naturalWidth > 0 &&
      image.getBoundingClientRect().width === 64 && image.getBoundingClientRect().height === 64
    )));
    await page.addStyleTag({ content: "a { transition: none !important; }" });
    const decoration = link => link.evaluate(node => {
      const style = getComputedStyle(node);
      return { line: style.textDecorationLine, underline: style.textDecorationColor, color: style.color };
    });
    for (const theme of ["light", "dark"]) {
      await page.locator("html").evaluate((node, value) => node.dataset.theme = value, theme);
      await page.mouse.move(0, 0);
      const ordinary = page.locator('a[href$="/issues/new"]');
      const normal = await decoration(ordinary);
      await ordinary.hover();
      const hovered = await decoration(ordinary);
      assert.equal(normal.line, "underline");
      assert.notEqual(normal.underline, hovered.underline);
      for (const selector of ["h3 a", "p a:first-child", "p a:last-child"]) {
        const link = page.locator("article.component-card").first().locator(selector);
        await page.mouse.move(0, 0);
        assert.deepEqual(await decoration(link), normal);
        await link.hover();
        assert.deepEqual(await decoration(link), hovered);
      }
    }
    await page.goto(`${base}index.html`);
    const tile = page.locator('.component-index > a[href="./projects.html"]');
    await tile.hover();
    assert.equal((await decoration(tile)).line, "none");
  } finally {
    await browser?.close();
    await server.close();
  }
});

test("static layouts work without JavaScript and enhance navigation without duplicating chrome", { timeout: 90000 }, async () => {
  const server = await createServer({
    configFile: fileURLToPath(new URL("../packages/showcase/vite.config.mjs", import.meta.url)),
    server: { host: "127.0.0.1", port: 0 }
  });
  let browser;
  try {
    await server.listen();
    const base = `http://127.0.0.1:${server.httpServer.address().port}/showcase/`;
    browser = await chromium.launch();
    const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1100 } });
    await noScript.route("https://**", route => route.fulfill({ body: "", contentType: "text/plain" }));
    const staticPage = await noScript.newPage();
    for (const file of ["cards.html", "layout-topnav.html", "react.html"]) {
      await staticPage.goto(`${base}${file}`);
      assert.equal(await staticPage.locator(".docs-topbar-global").count(), 1);
      const active = staticPage.locator(".docs-sidebar [aria-current=page]");
      assert.equal(await active.getAttribute("href"), `./${file}`);
      assert.ok(await active.isVisible());
    }
    await staticPage.setViewportSize({ width: 390, height: 844 });
    assert.ok(await staticPage.locator('.docs-sidebar [data-page="react.html"]').isVisible());
    assert.equal(await staticPage.getByRole("button", { name: "Toggle page navigation" }).isVisible(), false);
    await staticPage.goto(`${base}layout-example-sidebar.html`);
    assert.equal(await staticPage.locator(".docs-topbar-global, .docs-sidebar").count(), 0);
    assert.ok(await staticPage.locator(".layout-mock-banner").isVisible());
    await noScript.close();

    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    await context.route("https://**", route => route.fulfill({ body: "", contentType: "text/plain" }));
    await context.route("https://api.github.com/**", route => route.fulfill({ json: [{ tag_name: "ui-theme@1.0.0" }] }));
    const page = await context.newPage();
    const failures = [];
    page.on("pageerror", error => failures.push(error.message));
    await page.goto(`${base}cards.html`);
    await page.waitForFunction(() => document.querySelector(".docs-topbar-version").options[0].textContent === "ui-theme@1.0.0");
    assert.equal(await page.locator(".docs-topbar-global").count(), 1);
    assert.equal(await page.locator(".docs-sidebar .docs-nav-group").count(), 1);
    assert.ok(await page.locator(".docs-outline-link").count() > 0);
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await page.reload();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.locator(".docs-topbar-global").evaluate(node => node.getBoundingClientRect().right <= window.innerWidth));
    const menu = page.getByRole("button", { name: "Toggle page navigation" });
    await menu.click();
    assert.equal(await menu.getAttribute("aria-expanded"), "true");
    await page.keyboard.press("Escape");
    assert.equal(await menu.getAttribute("aria-expanded"), "false");
    await menu.click();
    await page.locator(".docs-nav-disclosure > summary").click();
    await page.locator('.docs-sidebar [data-page="layout-topnav.html"]').click();
    await page.waitForURL(`${base}layout-topnav.html`);
    assert.equal(await page.locator(".docs-nav-disclosure").getAttribute("open"), "");
    assert.equal(await page.locator(".docs-sidebar [aria-current=page]").getAttribute("href"), "./layout-topnav.html");
    assert.equal(await page.locator(".docs-topbar-global").count(), 1);
    await page.goto(`${base}sample-data.html`);
    assert.equal(await page.locator("[data-sample-stats] .stat-card").count(), 3);
    assert.deepEqual(failures, []);
    await context.close();
  } finally {
    await browser?.close();
    await server.close();
  }
});

test("native modal focus containment, keyboard interactions, themes and responsive showcase", { timeout: 90000 }, async () => {
  const server = await createServer({
    configFile: fileURLToPath(new URL("../packages/showcase/vite.config.mjs", import.meta.url)),
    server: { host: "127.0.0.1", port: 0 }
  });
  let browser;
  try {
    await server.listen();
    const address = server.httpServer.address();
    for (const { file } of site.pages) {
      const response = await fetch(`http://127.0.0.1:${address.port}/showcase/${file}`);
      assert.ok(response.ok, `Missing showcase page: ${file}`);
    }
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, colorScheme: "dark" });
    const page = await context.newPage();
    const failures = [];
    page.on("pageerror", error => failures.push(error.message));
    await page.route("https://api.github.com/**", route => route.fulfill({ json: [] }));
    await page.goto(`http://127.0.0.1:${address.port}/showcase/react.html`);
    const appearance = page.getByLabel("Appearance", { exact: true });
    await appearance.waitFor();
    await page.waitForFunction(() => {
      const logo = document.querySelector(".docs-topbar-brand-icon");
      return logo?.complete && logo.naturalWidth > 0;
    });
    assert.notEqual(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--wm-color-text")), "");
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
