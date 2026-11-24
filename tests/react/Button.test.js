import { test } from "node:test";
import assert from "node:assert/strict";
import { React, h, render, screen, userEvent } from "./setup.js";
const { Button } = await import("../../packages/ui-react/src/components/Button.js");

test("Button defaults to a non-submit button and forwards its ref, props, and decorative icon", async () => {
  const user = userEvent.setup();
  const ref = React.createRef();
  let submissions = 0;
  let clicked;
  render(h("form", { onSubmit: event => { event.preventDefault(); submissions++; } },
    h(Button, { ref, icon: "!", variant: "secondary", size: "sm", className: "custom", title: "Refresh",
      onClick: event => { clicked = event.currentTarget; } }, "Reload")));
  const button = screen.getByRole("button", { name: "Reload" });
  await user.click(button);
  assert.equal(submissions, 0);
  assert.equal(clicked, button);
  assert.equal(ref.current, button);
  assert.equal(button.title, "Refresh");
  assert.ok(button.classList.contains("wm-btn-secondary"));
  assert.ok(button.classList.contains("wm-btn-sm"));
  assert.ok(button.classList.contains("custom"));
  assert.equal(button.querySelector(".wm-btn-icon").getAttribute("aria-hidden"), "true");
});

test("Button honors explicit submit behavior and disabled state", async () => {
  const user = userEvent.setup();
  let submissions = 0;
  const view = render(h("form", { onSubmit: event => { event.preventDefault(); submissions++; } },
    h(Button, { type: "submit" }, "Save")));
  await user.click(screen.getByRole("button", { name: "Save" }));
  assert.equal(submissions, 1);
  view.rerender(h("form", { onSubmit: event => { event.preventDefault(); submissions++; } },
    h(Button, { type: "submit", disabled: true }, "Save")));
  await user.click(screen.getByRole("button", { name: "Save" }));
  assert.equal(submissions, 1);
});
