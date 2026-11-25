import { test } from "node:test";
import assert from "node:assert/strict";
import { React, h, render, screen, userEvent } from "./setup.js";
const { ActionDisclosure, LoadStatus, Accordion } = await import("@wintermuted/ui-react");

test("ActionDisclosure defaults expanded, keeps children mounted, and collapses before hiding", async () => {
  const user = userEvent.setup();
  let panel, collapses = 0, mounts = 0, unmounts = 0;
  function Records() {
    const [value, setValue] = React.useState("Original");
    React.useEffect(() => { mounts++; return () => { unmounts++; }; }, []);
    return h("input", { "aria-label": "Record name", value, onChange: event => setValue(event.target.value) });
  }
  const view = render(h(ActionDisclosure, { title: "Record options", onCollapse: () => {
    assert.equal(panel.hidden, false);
    collapses++;
  } }, h(Records)));
  const trigger = screen.getByRole("button", { name: "Record options" });
  panel = document.getElementById(trigger.getAttribute("aria-controls"));
  assert.equal(screen.getByRole("heading", { level: 3 }).contains(trigger), true);
  assert.equal(panel.hidden, false);
  await user.type(screen.getByRole("textbox"), " draft");
  trigger.focus();
  await user.keyboard("{Enter}");
  assert.equal(panel.hidden, true);
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  assert.equal(screen.queryByRole("textbox"), null);
  assert.equal(panel.querySelector("input").value, "Original draft");
  await user.keyboard(" ");
  assert.equal(panel.hidden, false);
  assert.equal(collapses, 1);
  assert.equal(mounts, 1);
  assert.equal(unmounts, 0);
  view.unmount();
  assert.equal(unmounts, 1);
});

test("ActionDisclosure keeps an action separate, forwards its ref, and calls it before committed expansion", async () => {
  const user = userEvent.setup(), ref = React.createRef();
  let panel, actions = 0, collapses = 0;
  render(h(ActionDisclosure, { title: "Record options", defaultExpanded: false,
    headingLevel: 2, headingId: "record-options-title", className: "host-disclosure",
    classNames: { header: "host-header", heading: "host-heading", action: "host-edit" },
    indicator: h("span", null, ">"), onCollapse: () => collapses++,
    action: { label: "Edit records", buttonRef: ref, icon: h("span", null, "+"), onClick: () => {
      assert.equal(panel.hidden, actions === 0);
      actions++;
    } } }, h("input", { "aria-label": "Record name" })));
  const trigger = screen.getByRole("button", { name: "Record options" });
  panel = document.getElementById(trigger.getAttribute("aria-controls"));
  const action = screen.getByRole("button", { name: "Edit records" });
  const heading = screen.getByRole("heading", { level: 2 });
  assert.equal(heading.id, "record-options-title");
  assert.ok(heading.classList.contains("host-heading"));
  assert.ok(trigger.closest(".host-disclosure"));
  assert.ok(trigger.closest(".host-header"));
  assert.ok(action.classList.contains("host-edit"));
  assert.equal(action.parentElement, heading.parentElement);
  assert.equal(trigger.contains(action), false);
  assert.equal(action.closest("summary"), null);
  assert.equal(action.type, "button");
  assert.equal(ref.current, action);
  assert.equal(action.querySelector(".wm-btn-icon").getAttribute("aria-hidden"), "true");
  assert.equal(trigger.querySelector(".wm-action-disclosure-indicator").textContent, ">");
  await user.click(action);
  assert.equal(panel.hidden, false);
  assert.equal(document.activeElement, action);
  await user.keyboard("{Enter}");
  assert.equal(actions, 2);
  assert.equal(panel.hidden, false);
  assert.equal(collapses, 0);
});

test("ActionDisclosure panel IDs stay unique and stable and text-only actions do not submit forms", async () => {
  let submissions = 0;
  const user = userEvent.setup();
  const content = () => h("form", { onSubmit: event => { event.preventDefault(); submissions++; } },
    h(ActionDisclosure, { title: "First records", headingLevel: 6 }, h("p", null, "First content")),
    h(ActionDisclosure, { title: "Second records",
      action: { label: "Edit second records", onClick() {} } }, h("p", null, "Second content")));
  const view = render(content());
  const first = screen.getByRole("button", { name: "First records" });
  const second = screen.getByRole("button", { name: "Second records" });
  const firstId = first.getAttribute("aria-controls"), secondId = second.getAttribute("aria-controls");
  assert.notEqual(firstId, secondId);
  await user.click(first);
  assert.equal(document.getElementById(firstId).hidden, true);
  assert.equal(document.getElementById(secondId).hidden, false);
  view.rerender(content());
  assert.equal(first.getAttribute("aria-controls"), firstId);
  assert.equal(second.getAttribute("aria-controls"), secondId);
  await user.click(screen.getByRole("button", { name: "Edit second records" }));
  assert.equal(submissions, 0);
  assert.equal(screen.getByRole("heading", { level: 6 }).contains(first), true);
});

test("LoadStatus controls do not toggle a surrounding disclosure and native Accordion remains unchanged", async () => {
  let collapses = 0, retries = 0;
  const user = userEvent.setup();
  render(h("div", { onClick: () => collapses++, onKeyDown: () => collapses++ },
    h(ActionDisclosure, { title: "Resources" },
      h(LoadStatus, { issues: [{ message: "Records unavailable", retry: () => retries++ }],
        labels: { retry: "Retry records", loading: "Loading records" } })),
    h(Accordion, { title: "Native instructions", open: true }, "Content")));
  const trigger = screen.getByRole("button", { name: "Resources" });
  const retry = screen.getByRole("button", { name: "Retry records" });
  await user.click(retry);
  await user.keyboard("{Enter}");
  assert.equal(retries, 2);
  assert.equal(collapses, 0);
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
  const summary = screen.getByText("Native instructions");
  assert.equal(summary.tagName, "SUMMARY");
  assert.equal(summary.parentElement.tagName, "DETAILS");
  assert.equal(summary.parentElement.open, true);
});
