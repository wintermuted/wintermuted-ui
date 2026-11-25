import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen } from "./setup.js";
const { PageHeader } = await import("../../packages/ui-react/src/components/PageHeader.js");

test("PageHeader preserves supplied content and class slots, including zero-valued content", () => {
  const view = render(h(PageHeader, {
    title: "Documents", eyebrow: "Library", description: h("strong", null, "Shared files"),
    icon: h("span", { "aria-hidden": true }, "D"), action: h("button", null, "Create document"),
    classNames: { root: "header", title: "title", eyebrow: "eyebrow", action: "action" },
  }));
  const heading = screen.getByRole("heading", { level: 1, name: "Documents" });
  assert.ok(heading.parentElement.classList.contains("title"));
  assert.ok(heading.closest("header").classList.contains("wm-view-header"));
  assert.ok(screen.getByText("Library").classList.contains("eyebrow"));
  assert.ok(screen.getByRole("button", { name: "Create document" }).parentElement.classList.contains("action"));
  assert.equal(screen.getByText("Shared files").tagName, "STRONG");
  view.rerender(h(PageHeader, { title: "Documents", description: 0, action: 0 }));
  assert.equal(screen.queryByText("Library"), null);
  assert.equal(screen.getAllByText("0").length, 2);
});
