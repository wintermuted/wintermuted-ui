import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, fireEvent } from "./setup.js";
const { SortableTableHeader } = await import("@wintermuted/ui-react");

test("SortableTableHeader owns the th and independent column/direction actions", () => {
  const sorts = [], directions = [];
  const props = { column: "amount", label: "Amount", active: true, direction: "asc",
    onSort: column => sorts.push(column), onDirection: column => directions.push(column),
    directionLabel: "Reverse amount", directionIcon: "^" };
  const table = props => h("table", null, h("thead", null, h("tr", null, h(SortableTableHeader, props))));
  const view = render(table(props));
  assert.equal(screen.getByRole("columnheader").getAttribute("aria-sort"), "ascending");
  fireEvent.click(screen.getByRole("button", { name: "Amount" }));
  assert.deepEqual(sorts, ["amount"]);
  assert.deepEqual(directions, []);
  fireEvent.click(screen.getByRole("button", { name: "Reverse amount" }));
  assert.deepEqual(directions, ["amount"]);
  view.rerender(table({ ...props, direction: "desc" }));
  assert.equal(screen.getByRole("columnheader").getAttribute("aria-sort"), "descending");
  view.rerender(table({ ...props, active: false }));
  assert.equal(screen.getByRole("columnheader").getAttribute("aria-sort"), "none");
});
