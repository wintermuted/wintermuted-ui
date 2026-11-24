import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen } from "./setup.js";
const { ProgressBar } = await import("../../packages/ui-react/src/components/ProgressBar.js");

test("ProgressBar clamps values to its range and preserves native accessible labels", () => {
  const view = render(h(ProgressBar, { value: 150, max: 80, label: "Sync", className: "custom", title: "Progress" }));
  const progress = screen.getByRole("progressbar", { name: "Sync" });
  assert.equal(progress.value, 80);
  assert.equal(progress.max, 80);
  assert.equal(progress.title, "Progress");
  assert.ok(progress.classList.contains("custom"));
  view.rerender(h(ProgressBar, { value: -5, "aria-label": "Native label" }));
  assert.equal(screen.getByRole("progressbar", { name: "Native label" }).value, 0);
  view.rerender(h(ProgressBar, { label: "Default range" }));
  assert.equal(progress.value, 0);
  assert.equal(progress.max, 100);
});

test("ProgressBar rejects nonfinite values and invalid maxima", () => {
  for (const props of [{ value: NaN }, { value: Infinity }, { max: 0 }, { max: -1 }, { max: NaN }, { max: Infinity }]) {
    assert.throws(() => render(h(ProgressBar, props)), {
      name: "RangeError", message: "ProgressBar requires a finite value and a positive finite max.",
    });
  }
});
