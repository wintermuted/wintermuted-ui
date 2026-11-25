import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, fireEvent } from "./setup.js";
const { FilterPanel } = await import("../../packages/ui-react/src/components/FilterPanel.js");

const labels = { toggle: "Refine", panel: "Document filters", title: "Refine documents",
  dismiss: "Dismiss refinement", close: "Close refinement" };
const panel = (props = {}) => h(FilterPanel, {
  labels, search: h("input", { "aria-label": "Find documents" }), summary: 0,
  classNames: { controls: "controls", controlsOpen: "open" }, ...props,
}, h("input", { "aria-label": "Owner", defaultValue: "Ada" }));

for (const dismissal of ["escape", "close", "scrim", "toggle"]) {
  test(`FilterPanel preserves mounted inputs and restores focus after ${dismissal}`, () => {
    const view = render(panel());
    const toggle = screen.getByRole("button", { name: labels.toggle });
    const controls = screen.getByRole("complementary", { name: labels.panel });
    const input = screen.getByRole("textbox", { name: "Owner" });
    assert.equal(toggle.getAttribute("aria-controls"), controls.id);
    assert.equal(toggle.getAttribute("aria-expanded"), "false");
    assert.equal(screen.queryByRole("dialog"), null);
    fireEvent.click(toggle);
    assert.ok(controls.classList.contains("open"));
    fireEvent.change(input, { target: { value: "Grace" } });
    input.focus();
    view.rerender(panel({ closeIcon: h("span", { "aria-hidden": true }, "X") }));
    if (dismissal === "escape") fireEvent.keyDown(input, { key: "Escape" });
    else if (dismissal === "toggle") { toggle.focus(); fireEvent.click(toggle); }
    else fireEvent.click(screen.getByRole("button", { name: dismissal === "close" ? labels.close : labels.dismiss }));
    assert.equal(toggle.getAttribute("aria-expanded"), "false");
    assert.equal(document.activeElement, toggle);
    assert.equal(controls.classList.contains("open"), false);
    assert.equal(screen.queryByRole("button", { name: labels.dismiss }), null);
    fireEvent.click(toggle);
    assert.equal(screen.getByRole("textbox", { name: "Owner" }), input);
    assert.equal(input.value, "Grace");
  });
}

test("FilterPanel Escape is scoped to focused content and respects nested handled Escape", () => {
  const view = render(h("div", null, panel(), h("button", null, "Outside")));
  const toggle = screen.getByRole("button", { name: labels.toggle });
  fireEvent.click(toggle);
  const outside = screen.getByRole("button", { name: "Outside" });
  outside.focus();
  fireEvent.keyDown(outside, { key: "Escape" });
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  const input = screen.getByRole("textbox", { name: "Owner" });
  input.focus();
  input.addEventListener("keydown", event => event.preventDefault(), { once: true });
  fireEvent.keyDown(input, { key: "Escape" });
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  fireEvent.keyDown(input, { key: "Escape" });
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  view.unmount();
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(document.body.textContent, "");
});

test("FilterPanel gives multiple instances independent relationships and dismissal", () => {
  render(h("div", null, panel(), panel({ labels: { ...labels, toggle: "Other filters", panel: "Other panel" } })));
  const first = screen.getByRole("button", { name: labels.toggle });
  const second = screen.getByRole("button", { name: "Other filters" });
  assert.notEqual(first.getAttribute("aria-controls"), second.getAttribute("aria-controls"));
  fireEvent.click(first);
  fireEvent.click(second);
  second.focus();
  fireEvent.keyDown(second, { key: "Escape" });
  assert.equal(second.getAttribute("aria-expanded"), "false");
  assert.equal(first.getAttribute("aria-expanded"), "true");
});
