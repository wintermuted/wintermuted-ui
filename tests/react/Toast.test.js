import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, fireEvent, userEvent } from "./setup.js";
const { Toast } = await import("@wintermuted/ui-react");

test("Toast supplies actions and dismissal while hidden notices are inert and untabbable", async () => {
  let dismissed = 0;
  const props = { open: true, message: "Invoice saved", dismissLabel: "Close notice",
    onDismiss: () => dismissed++, action: h("a", { href: "#invoices" }, "View invoices") };
  const view = render(h(Toast, props));
  assert.match(screen.getByRole("status").textContent, /Invoice saved/);
  assert.equal(screen.getByRole("link").getAttribute("href"), "#invoices");
  fireEvent.click(screen.getByRole("button"));
  assert.equal(dismissed, 1);
  view.rerender(h(Toast, { ...props, open: false }));
  assert.equal(screen.queryByRole("status"), null);
  assert.equal(view.container.firstChild.hasAttribute("inert"), true);
  await userEvent.setup().tab();
  assert.equal(document.activeElement, document.body);
  view.rerender(h(Toast, props));
  assert.equal(view.container.firstChild.hasAttribute("inert"), false);
  assert.ok(screen.getByRole("status"));
});
