import { test } from "node:test";
import assert from "node:assert/strict";
import { React, h, render, screen, fireEvent, act } from "./setup.js";
const { ColorPicker } = await import("@wintermuted/ui-react");
const { normalizeHex } = await import("../../packages/ui-react/src/components/colorValue.js");
const props = { value: "#123456", label: "Ink", inputLabel: "Pick ink", hexLabel: "Ink hex",
  invalidLabel: "Use six hexadecimal digits",
  groups: [{ id: "brand", label: "Brand", choices: [{ value: "#abcdef", label: "Ocean ink" }] }] };
const open = container => {
  const details = container.querySelector("details");
  act(() => { details.open = true; fireEvent(details, new Event("toggle")); });
  return details;
};

test("ColorPicker validates six-digit hex and distinguishes blur from Enter commits and selection metadata", () => {
  for (const [input, expected] of [[" AABBCC ", "#aabbcc"], ["#123456", "#123456"],
    ["#abc", null], ["#12345g", null], ["", null]]) assert.equal(normalizeHex(input), expected);
  const changes = [], commits = [], selections = [];
  const view = render(h(ColorPicker, { ...props, onChange: value => changes.push(value),
    onCommit: value => commits.push(value), onSelect: (...args) => selections.push(args), triggerClassName: "toolbar-trigger" }));
  const details = open(view.container);
  const hex = screen.getByRole("textbox", { name: "Ink hex" });
  assert.match(details.querySelector("summary").className, /toolbar-trigger/);
  fireEvent.change(hex, { target: { value: "bad" } });
  fireEvent.keyDown(hex, { key: "Enter" });
  assert.deepEqual(changes, []);
  assert.equal(hex.getAttribute("aria-invalid"), "true");
  assert.equal(document.getElementById(hex.getAttribute("aria-describedby")).textContent, props.invalidLabel);
  fireEvent.change(hex, { target: { value: " AABBCC " } });
  fireEvent.blur(hex);
  assert.deepEqual(changes, ["#aabbcc"]);
  assert.deepEqual(commits, []);
  act(() => hex.focus());
  fireEvent.keyDown(hex, { key: "Enter" });
  assert.deepEqual(commits, ["#aabbcc"]);
  assert.equal(changes.length, 2);
  assert.equal(details.open, false);
  assert.equal(document.activeElement, details.querySelector("summary"));
  open(view.container);
  fireEvent.click(screen.getByRole("button", { name: "Ocean ink" }));
  assert.deepEqual(selections, [["#abcdef", "brand", 0]]);
  assert.equal(details.open, false);
});

test("ColorPicker preserves controlled drafts across unmounts and resets invalid drafts on reselect", () => {
  function Host() {
    const [draft, setDraft] = React.useState("unfinished");
    const [mounted, setMounted] = React.useState(true);
    return h("div", null, h("button", { onClick: () => setMounted(!mounted) }, "Toggle picker"),
      mounted && h(ColorPicker, { ...props, draftValue: draft, onDraftChange: setDraft, onChange() {}, onSelect() {},
        groups: [{ id: "current", label: "Current", choices: [{ value: props.value, label: "Current ink" }] }] }));
  }
  const view = render(h(Host));
  open(view.container);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "not finished" } });
  fireEvent.click(screen.getByRole("button", { name: "Toggle picker" }));
  fireEvent.click(screen.getByRole("button", { name: "Toggle picker" }));
  const details = open(view.container);
  assert.equal(screen.getByRole("textbox").value, "not finished");
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
  fireEvent.click(screen.getByRole("button", { name: "Current ink" }));
  open(view.container);
  assert.equal(screen.getByRole("textbox").value, props.value);
  assert.equal(screen.getByRole("textbox").getAttribute("aria-invalid"), "false");
  fireEvent.keyDown(details, { key: "Escape" });
  assert.equal(details.open, false);
  open(view.container);
  fireEvent.mouseDown(document.body);
  assert.equal(details.open, false);
});

test("ColorPicker generates unique IDs, supports explicit IDs, and disables editable controls", () => {
  const view = render(h("div", null, h(ColorPicker, { ...props, disabled: true, onChange() {}, onSelect() {} }),
    h(ColorPicker, { ...props, inputId: "explicit-ink", disabled: true, onChange() {}, onSelect() {} })));
  act(() => { for (const details of view.container.querySelectorAll("details")) {
    details.open = true; fireEvent(details, new Event("toggle"));
  } });
  const native = screen.getAllByLabelText("Pick ink");
  assert.notEqual(native[0].id, native[1].id);
  assert.equal(native[1].id, "explicit-ink");
  assert.ok(native.every(input => input.disabled));
  assert.ok(screen.getAllByRole("textbox").every(input => input.disabled));
  assert.ok(screen.getAllByRole("button", { name: "Ocean ink" }).every(button => button.disabled));
});

test("ColorPicker rejects incomplete controlled-draft contracts", () => {
  assert.throws(() => render(h(ColorPicker, { ...props, draftValue: "x", onChange() {}, onSelect() {} })), /supplied together/);
  assert.throws(() => render(h(ColorPicker, { ...props, onDraftChange() {}, onChange() {}, onSelect() {} })), /supplied together/);
});
