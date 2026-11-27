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

test("Dialog composes a named custom close action while preserving focus wrapping and restoration", async t => {
  const onClose = t.mock.fn();
  const dialogProps = {
    open: false, title: h("span", null, "Preferences"), titleId: "preferences-heading", onClose,
    closeAction: h("button", { type: "button", "aria-label": "Dismiss preferences", onClick: onClose }, "X"),
  };
  function Example() {
    return h("div", null, h("button", null, "Open preferences"),
      h(Dialog, dialogProps, h("button", null, "Save preferences")));
  }
  const view = render(h(Example));
  const trigger = screen.getByRole("button", { name: "Open preferences" });
  trigger.focus();
  dialogProps.open = true;
  view.rerender(h(Example));
  const dialog = screen.getByRole("dialog", { name: "Preferences" });
  assert.equal(dialog.getAttribute("aria-labelledby"), "preferences-heading");
  assert.equal(screen.getByRole("heading", { name: "Preferences" }).id, "preferences-heading");
  assert.equal(screen.queryByRole("button", { name: "Close dialog" }), null);
  assert.equal(dialog.hasAttribute("titleId"), false);
  assert.equal(dialog.hasAttribute("closeAction"), false);
  const close = screen.getByRole("button", { name: "Dismiss preferences" });
  const save = screen.getByRole("button", { name: "Save preferences" });
  for (const button of [close, save]) {
    t.mock.method(button, "getClientRects", () => [{ width: 10, height: 10 }]);
  }
  save.focus();
  fireEvent.keyDown(save, { key: "Tab" });
  assert.equal(document.activeElement, close);
  fireEvent.click(close);
  assert.equal(onClose.mock.callCount(), 1);
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  assert.equal(onClose.mock.callCount(), 2);
  dialogProps.open = false;
  view.rerender(h(Example));
  await act(async () => {});
  assert.equal(dialog.open, false);
  assert.equal(document.activeElement, trigger);
});

test("Dialog allows omitting its close action without removing the heading or Escape handling", t => {
  const onClose = t.mock.fn();
  render(h(Dialog, { open: true, title: "Confirmation", closeAction: null, onClose }, "Review the changes."));
  const dialog = screen.getByRole("dialog", { name: "Confirmation" });
  assert.equal(screen.queryByRole("button"), null);
  assert.ok(screen.getByRole("heading", { name: "Confirmation" }).id);
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  assert.equal(onClose.mock.callCount(), 1);
});
