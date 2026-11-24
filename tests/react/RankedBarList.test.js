import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen } from "./setup.js";
const { RankedBarList } = await import("@wintermuted/ui-react");

test("RankedBarList scales, clamps, supplies minimum widths and keeps empty/zero scales valid", () => {
  const props = { label: "Departments", maximum: 100, minimumWidthPercent: 6, empty: "No departments",
    items: [{ id: "a", label: "Shipping", value: 50, valueLabel: "50 orders", color: "#123456" },
      { id: "b", label: "Returns", value: 1, valueLabel: "1 order" },
      { id: "c", label: "Inventory", value: 200, valueLabel: "200 orders" }] };
  const view = render(h(RankedBarList, props));
  assert.equal(screen.getAllByRole("listitem").length, 3);
  assert.deepEqual([...view.container.querySelectorAll(".wm-ranked-fill")].map(bar => bar.style.width), ["50%", "6%", "100%"]);
  view.rerender(h(RankedBarList, { ...props, maximum: 0 }));
  assert.deepEqual([...view.container.querySelectorAll(".wm-ranked-fill")].map(bar => bar.style.width), ["0%", "0%", "0%"]);
  view.rerender(h(RankedBarList, { ...props, items: [] }));
  assert.ok(screen.getByText("No departments"));
});

test("RankedBarList rejects nonfinite, negative and out-of-range numeric contracts", () => {
  const props = { label: "Stock", maximum: 10, items: [], empty: "Empty" };
  for (const invalid of [{ maximum: Infinity }, { maximum: NaN }, { maximum: -1 },
    { minimumWidthPercent: Infinity }, { minimumWidthPercent: -1 }, { minimumWidthPercent: 101 },
    { items: [{ id: "a", label: "Boxes", value: Infinity, valueLabel: "Invalid" }] },
    { items: [{ id: "a", label: "Boxes", value: -1, valueLabel: "Invalid" }] }]) {
    assert.throws(() => render(h(RankedBarList, { ...props, ...invalid })), RangeError);
  }
});
