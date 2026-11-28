import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { chromium } from "playwright";
import { createServer } from "vite";

test("non-React showcase counterparts render, copy independently and retain their interaction contracts", { timeout: 240000 }, async t => {
  const server = await createServer({
    configFile: fileURLToPath(new URL("../packages/showcase/vite.config.mjs", import.meta.url)),
    server: { host: "127.0.0.1", port: 0 },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.route("https://api.github.com/**", route => route.fulfill({ json: [] }));
    // Tests need only local assets, not documentation's optional CDN vendors.
    await context.route(/https:\/\/(?:cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//,
      route => route.fulfill({ body: "", contentType: "text/javascript" }));
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const base = `http://127.0.0.1:${server.httpServer.address().port}/showcase/`;
    const visit = async file => {
      await page.goto(`${base}${file}`);
      await page.waitForFunction(() => [...document.querySelectorAll("[data-demo-markup]")]
        .every(code => code.textContent.includes("data-demo=")));
    };

    await t.test("all added and expanded pages expose usable, standalone examples", async () => {
      const files = [
        "accordion.html", "menu.html", "tooltip.html", "number-stepper.html", "language-selector.html",
        "color-picker.html", "filters.html", "ranked-bar-list.html", "document-primitives.html",
        "loading-actions.html", "forms.html", "tags.html", "feedback.html", "navigation.html",
        "modal.html", "tables.html", "cards.html", "data-display.html", "installation.html",
      ];
      const copied = await context.newPage();
      const copyErrors = [];
      copied.on("pageerror", error => copyErrors.push(error.message));
      await copied.route("**/copied-example.html", route => route.fulfill({
        contentType: "text/html", body: "<!doctype html><html><head></head><body></body></html>",
      }));
      await copied.goto(`${base}copied-example.html`);
      for (const file of files) {
        await visit(file);
        const snippets = await page.locator("[data-demo-script]").evaluateAll(nodes => nodes.map(code => ({
          script: code.textContent,
          html: document.querySelector(`[data-demo-markup="${code.dataset.demoScript}"]`).textContent,
        })));
        for (const snippet of snippets) {
          assert.ok(snippet.script.includes("document.getElementById"), file);
          await copied.setContent(snippet.html);
          await copied.addScriptTag({ content: snippet.script });
        }
      }
      assert.deepEqual(copyErrors, []);
      await copied.close();
    });

    await t.test("native accordion, lists, fields and progress keep their semantics", async () => {
      await visit("accordion.html");
      const accordion = page.locator("#accordion-example details").first();
      await accordion.locator("summary").focus();
      await page.keyboard.press("Space");
      assert.equal(await accordion.evaluate(node => node.open), false);
      await page.keyboard.press("Enter");
      assert.equal(await accordion.evaluate(node => node.open), true);
      await visit("tags.html");
      assert.equal(await page.locator("#list-group-example ul > li.wm-list-item").count(), 3);
      await visit("forms.html");
      assert.equal(await page.getByRole("textbox", { name: "Document name" }).getAttribute("aria-describedby"),
        "name-context name-hint name-error");
      assert.ok(await page.locator("#name-hint").isVisible());
      assert.ok(await page.locator("#name-error").isVisible());
      await visit("feedback.html");
      assert.equal(await page.locator("#document-progress").evaluate(node => node.position), 0.6);
      assert.equal(await page.locator("#pending-progress").evaluate(node => node.position), -1);
      assert.equal(await page.locator("#spinner-example [role=status]").textContent().then(text => text.trim()), "Loading documents");
    });

    await t.test("tabs skip disabled items, link panels and use roving focus", async () => {
      await visit("navigation.html");
      const guides = page.locator("#tab-guides"), reference = page.locator("#tab-reference");
      await guides.focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(await reference.getAttribute("aria-selected"), "true");
      assert.equal(await guides.getAttribute("tabindex"), "-1");
      assert.ok(await page.locator("#panel-reference").isVisible());
      assert.equal(await page.locator("#panel-guides").isVisible(), false);
      await page.keyboard.press("Home");
      assert.ok(await guides.evaluate(node => node === document.activeElement));
      await page.keyboard.press("End");
      assert.ok(await reference.evaluate(node => node === document.activeElement));
      await page.keyboard.press("ArrowRight");
      assert.ok(await guides.evaluate(node => node === document.activeElement));
    });

    await t.test("menus and language listboxes skip disabled options and dismiss correctly", async () => {
      await visit("menu.html");
      const trigger = page.getByRole("button", { name: "Document actions", exact: true });
      await trigger.focus();
      await page.keyboard.press("ArrowUp");
      assert.ok(await page.getByRole("menuitem", { name: "Installation guide" }).evaluate(node => node === document.activeElement));
      await page.keyboard.press("ArrowDown");
      assert.ok(await page.getByRole("menuitem", { name: "Duplicate" }).evaluate(node => node === document.activeElement));
      await page.keyboard.press("Enter");
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      assert.match(await page.locator("#menu-example output").textContent(), /Duplicate selected/);
      await trigger.click();
      await page.keyboard.press("Escape");
      assert.ok(await trigger.evaluate(node => node === document.activeElement));
      await trigger.click();
      await page.keyboard.press("Tab");
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      await trigger.click();
      await page.locator(".page-title").click();
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");

      await visit("language-selector.html");
      const language = page.getByRole("button", { name: "Language: English" });
      await language.focus();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("End");
      assert.ok(await page.getByRole("listbox", { name: "Language", exact: true }).getByRole("option", { name: "French" })
        .evaluate(node => node === document.activeElement));
      await page.keyboard.press("Enter");
      assert.equal(await page.getByRole("button", { name: "Language: French" }).getAttribute("aria-expanded"), "false");
      assert.equal(await page.locator('[role=option][aria-selected=true]').textContent(), "French");
      await page.getByRole("button", { name: "Language: French" }).click();
      await page.keyboard.press("Escape");
      assert.ok(await page.getByRole("button", { name: "Language: French" }).evaluate(node => node === document.activeElement));
      await page.locator("#native-language-value").selectOption("fr");
      assert.equal(await page.locator("#native-language-value").inputValue(), "fr");
    });

    await t.test("tooltips preserve descriptions and remain dismissed until new interaction", async () => {
      await visit("tooltip.html");
      const save = page.getByRole("button", { name: "Save draft" });
      await save.focus();
      assert.equal(await save.getAttribute("aria-describedby"), "save-hint save-tooltip");
      assert.ok(await page.locator("#save-tooltip").isVisible());
      await page.keyboard.press("Escape");
      assert.equal(await save.getAttribute("aria-describedby"), "save-hint");
      assert.equal(await page.locator("#save-tooltip").isVisible(), false);
      await page.getByRole("button", { name: "More", exact: true }).focus();
      await save.focus();
      assert.ok(await page.locator("#save-tooltip").isVisible());
    });

    await t.test("decimal steppers clamp bounds without accumulating display artifacts", async () => {
      await visit("number-stepper.html");
      for (let index = 0; index < 10; index++) await page.getByRole("button", { name: "Increase speed", exact: true }).click();
      assert.equal(await page.locator("#stepper-example .wm-stepper-value").textContent(), "2");
      assert.ok(await page.getByRole("button", { name: "Increase speed", exact: true }).isDisabled());
      await page.getByRole("button", { name: "Decrease speed", exact: true }).focus();
      for (let index = 0; index < 15; index++) await page.keyboard.press("Enter");
      assert.equal(await page.locator("#stepper-example .wm-stepper-value").textContent(), "0.5");
      assert.ok(await page.getByRole("button", { name: "Decrease speed", exact: true }).isDisabled());
      assert.ok(await page.getByRole("button", { name: "Increase locked speed" }).isDisabled());
    });

    await t.test("color selection validates drafts, normalizes hex and restores focus", async () => {
      await visit("color-picker.html");
      const trigger = page.locator("#color-example summary");
      await trigger.click();
      await page.getByRole("button", { name: "Green", exact: true }).click();
      assert.match(await page.locator("#color-example output").textContent(), /#137333/);
      assert.ok(await trigger.evaluate(node => node === document.activeElement));
      await trigger.click();
      const hex = page.getByRole("textbox", { name: "Hex color" });
      await hex.fill("not-a-color");
      await hex.press("Enter");
      assert.equal(await hex.getAttribute("aria-invalid"), "true");
      assert.ok(await page.locator("#accent-error").isVisible());
      assert.match(await page.locator("#color-example output").textContent(), /#137333/);
      await hex.fill("abc");
      await hex.press("Enter");
      assert.match(await page.locator("#color-example output").textContent(), /#aabbcc/);
      assert.equal(await page.locator("#color-example details").evaluate(node => node.open), false);
      await trigger.click();
      await hex.press("Escape");
      assert.ok(await trigger.evaluate(node => node === document.activeElement));
    });

    await t.test("facets retain hidden selection and responsive panels consume only unhandled Escape", async () => {
      await visit("filters.html");
      const panel = page.locator("#document-filters");
      assert.ok(await panel.isVisible());
      const facet = page.locator("[data-facet]");
      await facet.getByRole("button", { name: "Show more" }).click();
      await facet.locator('[data-value="all"]').check();
      assert.equal(await facet.locator("[data-reset]").isChecked(), false);
      await facet.getByRole("button", { name: "Show fewer" }).click();
      assert.ok(await facet.locator('[data-value="all"]').isChecked());
      await facet.locator("[data-reset]").check();
      assert.equal(await facet.locator('[data-value="all"]').isChecked(), false);
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await panel.isVisible(), false);
      const trigger = page.getByRole("button", { name: "Open document filters" });
      await trigger.click();
      const help = panel.locator("[data-filter-help]");
      await help.locator("summary").click();
      await help.locator("summary").press("Escape");
      assert.equal(await help.evaluate(node => node.open), false);
      assert.equal(await trigger.getAttribute("aria-expanded"), "true");
      await help.locator("summary").press("Escape");
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      assert.ok(await trigger.evaluate(node => node === document.activeElement));
      await trigger.click();
      await page.getByRole("button", { name: "Close document filters" }).click();
      assert.ok(await trigger.evaluate(node => node === document.activeElement));
      await trigger.click();
      await page.getByRole("button", { name: "Dismiss document filters" }).click({ position: { x: 5, y: 150 } });
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      await page.setViewportSize({ width: 1440, height: 1000 });
      assert.ok(await panel.isVisible());
    });

    await t.test("native dialogs use modality, wrap focus and restore it after Escape", async () => {
      await visit("modal.html");
      const trigger = page.getByRole("button", { name: "Open document dialog" });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Edit document" });
      assert.ok(await dialog.evaluate(node => node.matches(":modal")));
      await page.getByRole("textbox", { name: "Document title", exact: true }).focus();
      await page.keyboard.press("Tab");
      assert.ok(await dialog.getByRole("button", { name: "Close document dialog" }).evaluate(node => node === document.activeElement));
      await page.keyboard.press("Shift+Tab");
      assert.ok(await page.getByRole("textbox", { name: "Document title", exact: true }).evaluate(node => node === document.activeElement));
      await page.keyboard.press("Escape");
      assert.equal(await dialog.isVisible(), false);
      assert.ok(await trigger.evaluate(node => node === document.activeElement));
    });

    await t.test("sortable headers reorder numeric values and expose separate direction state", async () => {
      await visit("tables.html");
      const table = page.locator("#sorting-example");
      await table.getByRole("button", { name: "Amount", exact: true }).click();
      assert.deepEqual(await table.locator("tbody tr").evaluateAll(rows => rows.map(row => row.dataset.merchant)),
        ["Figma", "Netflix", "Adobe"]);
      assert.equal(await table.locator('[data-column="amount"]').getAttribute("aria-sort"), "ascending");
      await table.getByRole("button", { name: "Sort amount descending" }).click();
      assert.deepEqual(await table.locator("tbody tr").evaluateAll(rows => rows.map(row => row.dataset.merchant)),
        ["Adobe", "Netflix", "Figma"]);
      assert.equal(await table.locator('[data-column="amount"]').getAttribute("aria-sort"), "descending");
    });

    await t.test("image fallback retries changed sources and ranked bars handle zero maxima", async () => {
      await visit("document-primitives.html");
      await page.getByRole("button", { name: "Use missing image" }).click();
      await page.getByRole("img", { name: "Preview unavailable" }).waitFor();
      await page.getByRole("button", { name: "Restore image" }).click();
      const image = page.getByRole("img", { name: "Wintermuted project preview" });
      await image.waitFor();
      await page.waitForFunction(() => document.querySelector("#preview-example img").naturalWidth > 0);
      assert.equal(await page.getByRole("img", { name: "Preview unavailable" }).isVisible(), false);
      await visit("ranked-bar-list.html");
      assert.deepEqual(await page.locator("#ranked-example .wm-ranked-fill").evaluateAll(nodes => nodes.map(node => node.style.width)),
        ["100%", "50%", "0%"]);
      const source = await page.locator('[data-demo-script="ranked-example"]').textContent();
      await page.locator("#ranked-example").evaluate(node => { node.dataset.maximum = "0"; });
      await page.addScriptTag({ content: source });
      assert.deepEqual(await page.locator("#ranked-example .wm-ranked-fill").evaluateAll(nodes => nodes.map(node => node.style.width)),
        ["0%", "0%", "0%"]);
      await page.locator("#ranked-example").evaluate(node => { node.dataset.maximum = "2"; node.dataset.minimum = "20"; });
      await page.addScriptTag({ content: source });
      assert.deepEqual(await page.locator("#ranked-example .wm-ranked-fill").evaluateAll(nodes => nodes.map(node => node.style.width)),
        ["100%", "100%", "20%"]);
    });

    await t.test("loading states prioritize busy labels and disclosures retain edited content", async () => {
      await visit("loading-actions.html");
      const root = page.locator("#loading-example");
      assert.equal(await root.locator(".wm-load-status").isVisible(), false);
      await root.getByRole("button", { name: "Show errors" }).click();
      assert.equal(await root.locator("[data-message]").getAttribute("role"), "alert");
      await root.getByRole("button", { name: "Retry all failed sources" }).click();
      assert.equal(await root.locator("output").textContent(), "Recovery callbacks: 2");
      assert.ok(await root.getByRole("button", { name: "Refreshing" }).isDisabled());
      await root.getByRole("button", { name: "Show warning" }).click();
      assert.equal(await root.locator("[data-message]").getAttribute("role"), "status");
      await root.getByRole("button", { name: "Complete successfully" }).click();
      assert.equal(await root.locator(".wm-load-status").isVisible(), false);
      const note = page.getByRole("textbox", { name: "Draft note" });
      await note.fill("Edited draft");
      await page.getByRole("button", { name: "Notes", exact: true }).click();
      assert.equal(await note.isVisible(), false);
      assert.equal(await page.locator("#notes-value").inputValue(), "Edited draft");
      await page.getByRole("button", { name: "Edit notes", exact: true }).click();
      assert.ok(await note.evaluate(node => node === document.activeElement));
      assert.equal(await note.inputValue(), "Edited draft");
    });

    await t.test("plain-JavaScript theme selection persists overrides and follows system changes", async () => {
      await visit("installation.html");
      const select = page.locator("#appearance-value");
      await select.selectOption("dark");
      assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
      await page.reload();
      assert.equal(await select.inputValue(), "dark");
      await select.selectOption("system");
      await page.emulateMedia({ colorScheme: "light" });
      await page.waitForFunction(() => !document.documentElement.hasAttribute("data-theme"));
      await page.emulateMedia({ colorScheme: "dark" });
      await page.waitForFunction(() => document.documentElement.getAttribute("data-theme") === "dark");
      const toolbar = page.locator("[data-theme-toggle]").first();
      await toolbar.click();
      assert.equal(await select.inputValue(), "light");
      await page.emulateMedia({ colorScheme: "light" });
      await page.emulateMedia({ colorScheme: "dark" });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.locator("html").getAttribute("data-theme"), null);
      assert.equal(await page.evaluate(() => localStorage.getItem("wm-showcase-theme")), "light");

      await select.selectOption("system");
      await page.emulateMedia({ colorScheme: "light" });
      await page.waitForFunction(() => !document.documentElement.hasAttribute("data-theme"));
      await toolbar.click();
      assert.equal(await select.inputValue(), "dark");
      await page.emulateMedia({ colorScheme: "dark" });
      await page.emulateMedia({ colorScheme: "light" });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
      assert.equal(await page.evaluate(() => localStorage.getItem("wm-showcase-theme")), "dark");
      await select.selectOption("light");
      assert.equal(await page.locator("html").getAttribute("data-theme"), null);
    });

    await t.test("desktop/mobile light/dark examples remain readable without horizontal page overflow", async () => {
      const screenshots = process.env.WM_SHOWCASE_SCREENSHOTS;
      if (screenshots) await mkdir(screenshots, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const theme of ["light", "dark"]) {
          await page.evaluate(value => localStorage.setItem("wm-showcase-theme", value), theme);
          for (const file of ["components.html", "color-picker.html", "filters.html", "document-primitives.html", "loading-actions.html"]) {
            await visit(file);
            if (file === "color-picker.html") await page.locator("#color-example summary").click();
            await page.waitForFunction(() => {
              const probe = document.createElement("div");
              probe.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue("--docs-page-bg");
              return getComputedStyle(document.body).backgroundColor === probe.style.backgroundColor;
            });
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${file}: ${width}/${theme}`);
            assert.ok(await page.locator(".page-title").isVisible(), file);
            if (screenshots) await page.screenshot({ path: join(screenshots, `${file.replace(".html", "")}-${width}-${theme}.png`) });
          }
        }
      }
    });
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    await browser?.close();
    await server.close();
  }
});
