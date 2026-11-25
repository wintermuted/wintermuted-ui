import { test } from "node:test";
import assert from "node:assert/strict";
import { React, h, render, screen, userEvent } from "./setup.js";
const { RefreshAction } = await import("@wintermuted/ui-react");
const labels = { idle: "Update records", loading: "Updating records", retry: "Retry records" };

test("RefreshAction gives loading precedence over errors and disables interaction", async () => {
  let calls = 0;
  const user = userEvent.setup();
  const props = { loading: true, error: true, onRefresh: () => calls++, labels };
  const view = render(h(RefreshAction, props));
  const button = screen.getByRole("button", { name: labels.loading });
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute("aria-busy"), "true");
  await user.click(button);
  assert.equal(calls, 0);
  view.rerender(h(RefreshAction, { ...props, loading: false }));
  await user.click(screen.getByRole("button", { name: labels.retry }));
  assert.equal(calls, 1);
  assert.equal(button.getAttribute("aria-busy"), "false");
});

test("RefreshAction forwards Button props, decorative icons, ref and the click event without submission", async () => {
  const ref = React.createRef(), user = userEvent.setup();
  let clicked, submissions = 0;
  render(h("form", { onSubmit: event => { event.preventDefault(); submissions++; } },
    h(RefreshAction, { ref, loading: false, error: false, labels,
      onRefresh: event => { clicked = { type: event.type, target: event.currentTarget }; },
      variant: "secondary", size: "sm", className: "host-action", title: "Record action",
      "data-record-id": "one", icon: h("span", null, "+") })));
  const button = screen.getByRole("button", { name: labels.idle });
  await user.click(button);
  assert.deepEqual(clicked, { type: "click", target: button });
  assert.equal(submissions, 0);
  assert.equal(ref.current, button);
  assert.equal(button.type, "button");
  assert.equal(button.title, "Record action");
  assert.equal(button.dataset.recordId, "one");
  for (const name of ["wm-btn", "wm-btn-secondary", "wm-btn-sm", "host-action"]) {
    assert.ok(button.classList.contains(name), name);
  }
  assert.equal(button.querySelector(".wm-btn-icon").getAttribute("aria-hidden"), "true");
});

test("RefreshAction respects caller disabling across transitions and supports React-node labels", async () => {
  let calls = 0;
  const user = userEvent.setup();
  const props = { loading: false, error: false, disabled: true, onRefresh: () => calls++,
    labels: { ...labels, idle: h("strong", null, labels.idle) } };
  const view = render(h(RefreshAction, props));
  assert.ok(screen.getByRole("button").querySelector("strong"));
  await user.click(screen.getByRole("button"));
  view.rerender(h(RefreshAction, { ...props, loading: true }));
  view.rerender(h(RefreshAction, props));
  assert.equal(screen.getByRole("button").disabled, true);
  await user.click(screen.getByRole("button"));
  assert.equal(calls, 0);
  view.rerender(h(RefreshAction, { ...props, disabled: false }));
  await user.click(screen.getByRole("button"));
  assert.equal(calls, 1);
});
