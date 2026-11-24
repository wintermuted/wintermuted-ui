import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, fireEvent } from "./setup.js";
const { ToggleGroup } = await import("@wintermuted/ui-react");

test("ToggleGroup preserves controlled selection, disabled choices and canonical variants", () => {
  const changes = [];
  const props = { label: "Documents", value: "receipts", onChange: value => changes.push(value),
    options: [{ value: "invoices", label: "Invoices", swatchColor: "#123456" },
      { value: "receipts", label: "Receipts", disabled: true }] };
  const view = render(h(ToggleGroup, { ...props, appearance: "outline", orientation: "vertical", fullWidth: true }));
  assert.equal(screen.getByRole("button", { name: "Receipts" }).getAttribute("aria-pressed"), "true");
  fireEvent.click(screen.getByRole("button", { name: "Receipts" }));
  fireEvent.click(screen.getByRole("button", { name: "Invoices" }));
  assert.deepEqual(changes, ["invoices"]);
  assert.match(screen.getByRole("group").className, /wm-toggle-group-outline/);
  assert.match(screen.getByRole("group").className, /wm-toggle-group-vertical/);
  view.rerender(h(ToggleGroup, { ...props, disabled: true, appearance: "swatches" }));
  assert.match(screen.getByRole("group").className, /wm-toggle-group-swatches/);
  assert.equal(screen.getByRole("button", { name: "Invoices" }).disabled, true);
  assert.ok(view.container.querySelector(".wm-toggle-group-swatch"));
});
