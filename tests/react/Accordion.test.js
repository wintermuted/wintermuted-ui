import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, userEvent } from "./setup.js";
const { Accordion } = await import("../../packages/ui-react/src/components/Accordion.js");

test("Accordion exposes summary content and forwards native open and toggle behavior", async () => {
  const user = userEvent.setup();
  let toggles = 0;
  const view = render(h(Accordion, { title: h("strong", null, "Details"), className: "custom",
    onToggle: () => toggles++ }, "Body"));
  const summary = screen.getByText("Details").closest("summary");
  const details = summary.parentElement;
  assert.equal(details.tagName, "DETAILS");
  assert.equal(details.open, false);
  assert.equal(details.hasAttribute("title"), false);
  assert.ok(details.classList.contains("custom"));
  assert.equal(details.querySelector(".wm-accordion-body").textContent, "Body");
  await user.click(summary);
  assert.equal(details.open, true);
  assert.equal(toggles, 1);
  view.rerender(h(Accordion, { title: "Details", open: false }, "Body"));
  assert.equal(details.open, false);
});
