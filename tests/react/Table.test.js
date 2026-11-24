import { test } from "node:test";
import assert from "node:assert/strict";
import { React, h, render, screen } from "./setup.js";
const { Table } = await import("../../packages/ui-react/src/components/Table.js");

test("Table keeps its ref on the table when enabling a named scrollable region", () => {
  const ref = React.createRef();
  const children = h("tbody", null, h("tr", null, h("td", null, "Arrival")));
  const view = render(h(Table, { ref, className: "custom", "aria-label": "Arrivals" }, children));
  const table = screen.getByRole("table", { name: "Arrivals" });
  assert.equal(ref.current, table);
  assert.equal(screen.queryByRole("region"), null);
  assert.ok(table.classList.contains("custom"));
  view.rerender(h(Table, { ref, responsive: true, "aria-label": "Arrivals" }, children));
  const region = screen.getByRole("region", { name: "Arrivals" });
  assert.equal(region.tabIndex, 0);
  assert.equal(region.firstElementChild, ref.current);
  assert.equal(ref.current, screen.getByRole("table", { name: "Arrivals" }));
  assert.equal(screen.getByRole("cell").textContent, "Arrival");
  view.rerender(h(Table, { responsive: true }, children));
  assert.ok(screen.getByRole("region", { name: "Scrollable table" }));
});
