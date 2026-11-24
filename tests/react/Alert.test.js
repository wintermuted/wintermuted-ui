import { test } from "node:test";
import assert from "node:assert/strict";
import { React, h, render, screen } from "./setup.js";
const { Alert } = await import("../../packages/ui-react/src/components/Alert.js");

test("Alert defaults to status and supports urgent roles, tone changes, native props, and refs", () => {
  const ref = React.createRef();
  const view = render(h(Alert, { ref, title: "Notice", className: "custom" }, "Saved"));
  const alert = screen.getByRole("status");
  assert.equal(alert.textContent, "Saved");
  assert.equal(ref.current, alert);
  assert.equal(alert.title, "Notice");
  assert.ok(alert.classList.contains("wm-alert-info"));
  view.rerender(h(Alert, { ref, role: "alert", tone: "danger", className: "custom" }, "Failed"));
  assert.equal(screen.getByRole("alert"), alert);
  assert.equal(alert.textContent, "Failed");
  assert.ok(alert.classList.contains("wm-alert-danger"));
  assert.ok(alert.classList.contains("custom"));
});
