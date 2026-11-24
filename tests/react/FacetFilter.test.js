import { test } from "node:test";
import assert from "node:assert/strict";
import { React, h, render, screen, fireEvent } from "./setup.js";
const { FacetFilter } = await import("@wintermuted/ui-react");

test("FacetFilter separates reset from all and keeps supplied zero-count selections removable", () => {
  function Filters() {
    const [selected, setSelected] = React.useState(["all"]);
    return h(FacetFilter, { label: "Departments", selected, onChange: setSelected, available: true,
      emptyLabel: "No departments", moreLabel: "More", fewerLabel: "Fewer",
      reset: { label: "Any department", count: 4, selected: selected.length === 0, onSelect: () => setSelected([]) },
      options: [{ value: "all", label: "All Services", count: 0, disabled: !selected.includes("all") },
        { value: "support", label: "Support", count: 4 },
        { value: "closed", label: "Closed", count: 0, hidden: true, disabled: true }] });
  }
  render(h(Filters));
  const all = screen.getByRole("checkbox", { name: /All Services/ });
  assert.equal(all.checked, true);
  assert.equal(all.disabled, false);
  assert.equal(screen.queryByRole("checkbox", { name: /Closed/ }), null);
  fireEvent.click(screen.getByRole("button", { name: "More" }));
  assert.equal(screen.getByRole("checkbox", { name: /Closed/ }).disabled, true);
  fireEvent.click(all);
  assert.equal(screen.getByRole("checkbox", { name: /Any department/ }).checked, true);
  fireEvent.click(screen.getByRole("checkbox", { name: /Any department/ }));
  assert.equal(screen.getByRole("checkbox", { name: /Any department/ }).checked, true);
  fireEvent.click(screen.getByRole("checkbox", { name: /Support/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Any department/ }));
  assert.equal(screen.getByRole("checkbox", { name: /Support/ }).checked, false);
  fireEvent.click(screen.getByRole("button", { name: "Fewer" }));
  assert.equal(screen.queryByRole("checkbox", { name: /Closed/ }), null);
});

test("FacetFilter unavailable state suppresses options and expansion", () => {
  render(h(FacetFilter, { label: "Teams", options: [{ value: "x", label: "Legacy", count: 0, hidden: true }],
    selected: ["x"], onChange() {}, available: false, emptyLabel: "No matching teams",
    moreLabel: "More", fewerLabel: "Fewer", reset: { label: "Any", count: 0, selected: false, onSelect() {} } }));
  assert.ok(screen.getByText("No matching teams"));
  assert.equal(screen.queryByRole("checkbox"), null);
  assert.equal(screen.queryByRole("button"), null);
});
