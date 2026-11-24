import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, fireEvent } from "./setup.js";
const { NumberStepper } = await import("@wintermuted/ui-react");
const props = { min: 0, max: 1, step: 0.25, label: "Quantity", decreaseLabel: "Less", increaseLabel: "More",
  valueLabel: "Current quantity", decreaseIcon: "-", increaseIcon: "+" };

test("NumberStepper supports fractional ranges, clamps boundaries and exposes canonical tooltips", () => {
  const changes = [];
  const view = render(h(NumberStepper, { ...props, value: 0.9, onChange: value => changes.push(value), tooltipPlacement: "right" }));
  fireEvent.click(screen.getByRole("button", { name: "More" }));
  assert.deepEqual(changes, [1]);
  fireEvent.focus(screen.getByRole("button", { name: "More" }));
  assert.match(screen.getByRole("tooltip").className, /wm-tooltip-right/);
  view.rerender(h(NumberStepper, { ...props, value: 0.3, step: 0.1, onChange: value => changes.push(value) }));
  fireEvent.click(screen.getByRole("button", { name: "Less" }));
  assert.equal(changes.at(-1), 0.2);
  view.rerender(h(NumberStepper, { ...props, value: 0, onChange() {} }));
  assert.equal(screen.getByRole("button", { name: "Less" }).disabled, true);
  view.rerender(h(NumberStepper, { ...props, value: 1, onChange() {} }));
  assert.equal(screen.getByRole("button", { name: "More" }).disabled, true);
  view.rerender(h(NumberStepper, { ...props, value: 0.5, disabled: true, onChange() {} }));
  assert.ok(screen.getAllByRole("button").every(button => button.disabled));
});

test("NumberStepper rejects invalid bounds, steps and values", () => {
  for (const invalid of [{ value: NaN }, { value: Infinity }, { value: -1 }, { value: 2 },
    { min: Infinity }, { max: NaN }, { min: 2 }, { step: 0 }, { step: -1 }, { step: Infinity }]) {
    assert.throws(() => render(h(NumberStepper, { ...props, value: 0.5, onChange() {}, ...invalid })), RangeError);
  }
});
