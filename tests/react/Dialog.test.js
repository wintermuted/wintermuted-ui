import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, fireEvent, act } from "./setup.js";
const { Dialog } = await import("../../packages/ui-react/src/components/Dialog.js");

test("Dialog wraps Tab focus around enabled visible controls", async t => {
  render(h(Dialog, { open: true, title: "Settings", onClose: () => {} },
    h("input", { "aria-label": "Name" }), h("button", null, "Save"),
    h("button", { disabled: true }, "Disabled"), h("button", { style: { visibility: "hidden" } }, "Hidden")));
  const dialog = screen.getByRole("dialog", { name: "Settings" });
  const first = screen.getByRole("button", { name: "Close dialog" });
  const last = screen.getByRole("button", { name: "Save" });
  for (const element of dialog.querySelectorAll("button, input")) {
    t.mock.method(element, "getClientRects", () => [{ width: 10, height: 10 }]);
  }
  last.focus();
  fireEvent.keyDown(last, { key: "Tab" });
  assert.equal(document.activeElement, first);
  fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
  assert.equal(document.activeElement, last);
  dialog.focus();
  fireEvent.keyDown(dialog, { key: "Tab" });
  assert.equal(document.activeElement, first);
  await act(async () => {});
});

test("Dialog respects cancelled Escape requests and distinguishes external from controlled closes", async t => {
  const onClose = t.mock.fn();
  const onCancel = t.mock.fn(event => event.preventDefault());
  const view = render(h(Dialog, { open: true, title: "Settings", onClose, onCancel }));
  const dialog = screen.getByRole("dialog", { name: "Settings" });
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  assert.equal(onCancel.mock.callCount(), 1);
  assert.equal(onClose.mock.callCount(), 0);
  view.rerender(h(Dialog, { open: true, title: "Settings", onClose }));
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  assert.equal(onClose.mock.callCount(), 1);
  view.rerender(h(Dialog, { open: false, title: "Settings", onClose }));
  await act(async () => {});
  assert.equal(dialog.open, false);
  assert.equal(onClose.mock.callCount(), 1);
  view.rerender(h(Dialog, { open: true, title: "Settings", onClose }));
  await act(() => dialog.close());
  assert.equal(onClose.mock.callCount(), 2);
});

test("Dialog lets a caller prevent its keyboard focus trap", t => {
  const onKeyDown = t.mock.fn(event => event.preventDefault());
  render(h(Dialog, { open: true, title: "Settings", onClose: () => {}, onKeyDown }, h("button", null, "Save")));
  const last = screen.getByRole("button", { name: "Save" });
  last.focus();
  fireEvent.keyDown(last, { key: "Tab" });
  assert.equal(onKeyDown.mock.callCount(), 1);
  assert.equal(document.activeElement, last);
});
