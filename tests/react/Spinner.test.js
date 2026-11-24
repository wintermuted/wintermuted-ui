import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen } from "./setup.js";
const { Spinner } = await import("../../packages/ui-react/src/components/Spinner.js");

test("Spinner announces loading text while hiding its decorative indicator", () => {
  const view = render(h(Spinner, { title: "Working", className: "custom" }));
  const spinner = screen.getByRole("status");
  assert.equal(spinner.textContent, "Loading");
  assert.equal(spinner.title, "Working");
  assert.ok(spinner.classList.contains("custom"));
  assert.equal(spinner.querySelector(".wm-spinner-indicator").getAttribute("aria-hidden"), "true");
  view.rerender(h(Spinner, { label: "Fetching arrivals" }));
  assert.equal(spinner.textContent, "Fetching arrivals");
});
