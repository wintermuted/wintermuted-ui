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

test("NumberStepper retains integer and fractional step direction and stays within both bounds", () => {
  let changed;
  const onChange = value => { changed = value; };
  const view = render(h(NumberStepper, { ...props, value: 0.5, onChange }));
  for (const [range, button, expected] of [
    [{ value: 1000000000000009, min: 1000000000000000, max: 1000000000000009, step: 1 }, "Less", 1000000000000008],
    [{ value: 1000000000000008, min: 1000000000000000, max: 1000000000000009, step: 1 }, "More", 1000000000000009],
    [{ value: 1, min: 0, max: 2, step: Number.EPSILON }, "More", 1 + Number.EPSILON],
    [{ value: 1, min: 0, max: 2, step: Number.EPSILON }, "Less", 1 - Number.EPSILON],
    [{ value: 0.1234567890123456, min: 0, max: 1, step: 1e-16 }, "More", 0.1234567890123457],
    [{ value: 0, min: 0, max: 1e-119, step: 1e-120 }, "More", 1e-120],
    [{ value: Number.MIN_VALUE, min: 0, max: 3 * Number.MIN_VALUE, step: Number.MIN_VALUE }, "More", 2 * Number.MIN_VALUE],
    [{ value: 0.3, min: 0.25, max: 0.35, step: 0.1 }, "Less", 0.25],
    [{ value: 0.3, min: 0.25, max: 0.35, step: 0.1 }, "More", 0.35],
    [{ value: Number.MAX_VALUE / 2, min: 0, max: Number.MAX_VALUE, step: Number.MAX_VALUE }, "More", Number.MAX_VALUE],
  ]) {
    changed = undefined;
    view.rerender(h(NumberStepper, { ...props, ...range, onChange }));
    fireEvent.click(screen.getByRole("button", { name: button }));
    assert.equal(changed, expected);
    assert.ok(changed >= range.min && changed <= range.max);
    assert.ok(button === "More" ? changed > range.value : changed < range.value);
    view.rerender(h(NumberStepper, { ...props, ...range, value: changed, onChange }));
  }
});
