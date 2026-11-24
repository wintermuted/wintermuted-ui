import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen } from "./setup.js";
const { StatCard, RankedBarList } = await import("@wintermuted/ui-react");

test("StatCard retains zero values and composes compact dashboard content", () => {
  const view = render(h(StatCard, { label: "Orders", value: 0, tone: "success", variant: "compact" },
    h(RankedBarList, { label: "Departments", maximum: 10, items: [], empty: "No departments" })));
  assert.equal(screen.getByRole("article").firstChild.textContent, "Orders");
  assert.ok(screen.getByText("0"));
  assert.ok(screen.getByRole("list", { name: "Departments" }));
  assert.match(screen.getByRole("article").className, /wm-stat-card-success/);
  view.rerender(h(StatCard, { label: "Orders", value: 12 }));
  assert.equal(screen.getByRole("article").firstChild.textContent, "12");
  view.rerender(h(StatCard, { label: "Orders" }, "Custom content"));
  assert.equal(view.container.querySelector(".wm-stat-value"), null);
  assert.ok(screen.getByText("Custom content"));
});
