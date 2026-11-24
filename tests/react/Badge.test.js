import { test } from "node:test";
import assert from "node:assert/strict";
import { React, h, render, screen } from "./setup.js";
const { Badge } = await import("../../packages/ui-react/src/components/Badge.js");

test("Badge forwards span attributes and refs while composing the selected tone", () => {
  const ref = React.createRef();
  const view = render(h(Badge, { ref, "data-testid": "badge", title: "Status", className: "custom" }, "Pending"));
  const badge = screen.getByTestId("badge");
  assert.equal(ref.current, badge);
  assert.equal(badge.tagName, "SPAN");
  assert.equal(badge.title, "Status");
  assert.ok(badge.classList.contains("wm-badge-neutral"));
  view.rerender(h(Badge, { ref, "data-testid": "badge", tone: "success", className: "custom" }, "Ready"));
  assert.equal(badge.textContent, "Ready");
  assert.ok(badge.classList.contains("wm-badge-success"));
  assert.ok(badge.classList.contains("custom"));
  assert.ok(!badge.classList.contains("wm-badge-neutral"));
});
