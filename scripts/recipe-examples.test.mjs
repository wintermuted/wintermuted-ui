import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { transformWithOxc } from "vite";
import { act, dom, fireEvent, h, render, screen } from "../tests/react/setup.js";

const markdown = readFileSync(new URL("../docs/recipes.md", import.meta.url), "utf8");
const blocks = [...markdown.matchAll(/```(?:tsx|ts)\r?\n([\s\S]*?)```/g)].map(match => match[1]);

async function example(source, filename, modules = {}) {
  // Execute the documented code against real source exports; CSS is checked by asset tests.
  const { code } = await transformWithOxc(source.replace(/^import "@wintermuted\/ui-theme\/index.css";\r?\n/m, ""), filename, {
    jsx: { runtime: "automatic" },
  });
  const resolved = code.replace(/from "([^"]+)"/g, (_, specifier) =>
    `from "${modules[specifier] ?? import.meta.resolve(specifier)}"`);
  const url = `data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`;
  return { url, exports: await import(url) };
}

test("the documented form validates, submits trimmed values, and preserves drafts on failure", async () => {
  const { exports: { ContactForm } } = await example(blocks[0], "ContactForm.tsx");
  const saved = [];
  let finish;
  let fail = false;
  render(h(ContactForm, { onSave: async contact => {
    saved.push(contact);
    if (fail) throw new Error("Please retry saving.");
    await new Promise(resolve => { finish = resolve; });
  } }));
  fireEvent.click(screen.getByRole("button", { name: "Save contact" }));
  assert.equal(saved.length, 0);
  assert.equal(document.activeElement, screen.getByLabelText("Name"));
  assert.equal(screen.getByLabelText("Name").getAttribute("aria-invalid"), "true");
  const descriptions = screen.getByLabelText("Name").getAttribute("aria-describedby").split(" ");
  assert.equal(descriptions.length, 2);
  assert.ok(descriptions.every(id => document.getElementById(id)));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: " Ada " } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: " ada@example.test " } });
  fireEvent.click(screen.getByRole("button", { name: "Save contact" }));
  assert.equal(screen.getByRole("button", { name: "Saving contact..." }).matches(":disabled"), true);
  await act(async () => finish());
  assert.deepEqual(saved, [{ name: "Ada", email: "ada@example.test" }]);
  assert.equal(screen.getByRole("status").textContent, "Contact saved.");
  fail = true;
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save contact" })));
  assert.equal(screen.getByRole("alert").textContent, "Please retry saving.");
  assert.equal(screen.getByLabelText("Name").value, " Ada ");
});

test("the documented table sorts numbers, reverses direction, and does not mutate input", async () => {
  const { exports: { InvoiceTable } } = await example(blocks[1], "InvoiceTable.tsx");
  const invoices = Object.freeze([
    Object.freeze({ id: "b", customer: "Zed", total: 2 }),
    Object.freeze({ id: "a", customer: "Ada", total: 10 }),
  ]);
  const view = render(h(InvoiceTable, { invoices }));
  const customers = () => [...view.container.querySelectorAll("tbody th")].map(th => th.textContent);
  assert.deepEqual(customers(), ["Ada", "Zed"]);
  fireEvent.click(screen.getByRole("button", { name: "Total" }));
  assert.deepEqual(customers(), ["Zed", "Ada"]);
  assert.equal(screen.getByRole("columnheader", { name: /Total/ }).getAttribute("aria-sort"), "ascending");
  fireEvent.click(screen.getByRole("button", { name: "Sort total descending" }));
  assert.deepEqual(customers(), ["Ada", "Zed"]);
  fireEvent.click(screen.getByRole("button", { name: "Sort customer descending" }));
  assert.deepEqual(customers(), ["Zed", "Ada"]);
  assert.equal(view.container.querySelectorAll("th th").length, 0);
  view.rerender(h(InvoiceTable, { invoices: [] }));
  assert.ok(screen.getByText("No invoices available."));
});

test("the documented filters compose search, removable zero counts, reset, and mounted disclosure state", async () => {
  const { exports: { DocumentFilters } } = await example(blocks[2], "DocumentFilters.tsx");
  render(h(DocumentFilters, { documents: [
    { id: "g", title: "Getting started", category: "guide" },
    { id: "r", title: "API reference", category: "reference" },
  ] }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Guides/ }));
  assert.equal(screen.getByRole("status").textContent, "1 documents found");
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "API" } });
  const selected = screen.getByRole("checkbox", { name: /Guides/ });
  assert.equal(selected.checked, true);
  assert.equal(selected.disabled, false);
  assert.ok(screen.getByText("No matching documents."));
  fireEvent.click(screen.getByRole("button", { name: "Show filters" }));
  fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
  assert.equal(selected.checked, true);
  assert.equal(document.activeElement, screen.getByRole("button", { name: "Show filters" }));
  fireEvent.click(selected);
  assert.equal(screen.getByRole("status").textContent, "1 documents found");
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("checkbox", { name: /References/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /All categories/ }));
  assert.equal(screen.getByRole("status").textContent, "2 documents found");
});

test("the documented SSR entries bootstrap before CSS and hydrate a saved dark preference without errors", async () => {
  const config = await example(blocks[3], "theme-config.ts");
  const app = await example(blocks[4], "App.tsx", { "./theme-config": config.url });
  const server = await example(blocks[5], "server.tsx", { "./App": app.url, "./theme-config": config.url });
  const originalWindow = globalThis.window;
  let html;
  try {
    delete globalThis.window;
    html = server.exports.renderDocument({ nonce: "test-nonce", cssHref: "/assets/theme.css", clientSrc: "/assets/client.js" });
  } finally {
    globalThis.window = originalWindow;
  }
  const page = new dom.window.DOMParser().parseFromString(html, "text/html");
  assert.equal(page.querySelectorAll("#root select").length, 0);
  const bootstrap = page.querySelector("head script");
  assert.equal(bootstrap.getAttribute("nonce"), "test-nonce");
  assert.ok(html.indexOf(bootstrap.textContent) < html.indexOf('rel="stylesheet"'));
  document.body.innerHTML = page.body.innerHTML;
  window.localStorage.setItem(config.exports.storageKey, "dark");
  window.eval(bootstrap.textContent);
  assert.equal(document.documentElement.dataset.theme, "dark");
  const { hydrateRoot } = await import("react-dom/client");
  const errors = [];
  let root;
  await act(async () => {
    root = hydrateRoot(document.getElementById("root"), h(app.exports.App), { onRecoverableError: error => errors.push(error) });
  });
  assert.deepEqual(errors, []);
  assert.equal(screen.getByLabelText("Appearance").value, "dark");
  fireEvent.change(screen.getByLabelText("Appearance"), { target: { value: "light" } });
  assert.equal(window.localStorage.getItem(config.exports.storageKey), "light");
  assert.equal(document.documentElement.dataset.theme, "light");
  await act(async () => root.unmount());
  // Capture the real root so the documented client entry can be cleaned up.
  document.body.innerHTML = page.body.innerHTML;
  const clientWrapper = `import { hydrateRoot as hydrate } from "${import.meta.resolve("react-dom/client")}";
    export function hydrateRoot(...args) { return globalThis.__recipeRoot = hydrate(...args); }`;
  await act(async () => example(blocks[6], "client.tsx", { "./App": app.url, "./theme-config": config.url,
    "react-dom/client": `data:text/javascript;base64,${Buffer.from(clientWrapper).toString("base64")}` }));
  assert.equal(screen.getByLabelText("Appearance").value, "light");
  await act(async () => globalThis.__recipeRoot.unmount());
  delete globalThis.__recipeRoot;
});
