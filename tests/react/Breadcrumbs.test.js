import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen } from "./setup.js";
const { Breadcrumbs } = await import("../../packages/ui-react/src/components/Breadcrumbs.js");

test("Breadcrumbs uses native links, marks the current non-link, and accepts a router-independent renderer", () => {
  const items = [{ id: "library", label: "Library", href: "/library" }, { id: "notes", label: "Notes" }];
  const view = render(h(Breadcrumbs, { items, label: "Document trail", className: "trail" }));
  assert.ok(screen.getByRole("navigation", { name: "Document trail" }).classList.contains("wm-nav"));
  assert.equal(screen.getByRole("link", { name: "Library" }).getAttribute("href"), "/library");
  assert.equal(screen.queryByRole("link", { name: "Notes" }), null);
  assert.equal(screen.getByText("Notes").getAttribute("aria-current"), "page");
  view.rerender(h(Breadcrumbs, { items, label: "Document trail",
    renderLink: item => h("a", { href: `#${item.id}`, "data-original-href": item.href }, item.label) }));
  assert.equal(screen.getByRole("link", { name: "Library" }).getAttribute("href"), "#library");
  assert.equal(screen.getByRole("link", { name: "Library" }).dataset.originalHref, "/library");
  view.rerender(h(Breadcrumbs, { items: [], label: "Empty trail" }));
  assert.equal(screen.getByRole("navigation", { name: "Empty trail" }).querySelectorAll("li").length, 0);
});
