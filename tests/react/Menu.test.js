import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, fireEvent, userEvent } from "./setup.js";
const { Menu } = await import("../../packages/ui-react/src/components/Menu.js");

test("Menu opens at the last enabled action with ArrowUp and supports Home, End, and Escape", async () => {
  const user = userEvent.setup();
  render(h(Menu, { label: "Actions", items: [
    { id: "first", label: "First" }, { id: "disabled", label: "Disabled", disabled: true },
    { id: "last", label: "Last", href: "#last" },
  ] }));
  const trigger = screen.getByRole("button", { name: "Actions" });
  trigger.focus();
  await user.keyboard("{ArrowUp}");
  assert.equal(document.activeElement, screen.getByRole("menuitem", { name: "Last" }));
  assert.equal(trigger.getAttribute("aria-controls"), screen.getByRole("menu").id);
  await user.keyboard("{Home}");
  assert.equal(document.activeElement.textContent, "First");
  await user.keyboard("{End}{ArrowDown}");
  assert.equal(document.activeElement.textContent, "First");
  await user.keyboard("{Escape}");
  assert.equal(screen.queryByRole("menu"), null);
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  assert.equal(document.activeElement, trigger);
});

test("Menu blocks disabled links and passes selection events before restoring trigger focus", async () => {
  const user = userEvent.setup();
  let selected;
  let disabledSelections = 0;
  render(h(Menu, { label: "Actions", items: [
    { id: "disabled", label: "Disabled", href: "#disabled", disabled: true, onSelect: () => disabledSelections++ },
    { id: "enabled", label: "Run", onSelect: event => { selected = event.currentTarget.textContent; } },
  ] }));
  const trigger = screen.getByRole("button", { name: "Actions" });
  await user.click(trigger);
  const disabled = screen.getByRole("menuitem", { name: "Disabled" });
  assert.equal(disabled.tagName, "BUTTON");
  assert.equal(disabled.getAttribute("aria-disabled"), "true");
  assert.equal(fireEvent.click(disabled), false);
  assert.equal(disabledSelections, 0);
  assert.ok(screen.getByRole("menu"));
  await user.click(screen.getByRole("menuitem", { name: "Run" }));
  assert.equal(selected, "Run");
  assert.equal(screen.queryByRole("menu"), null);
  assert.equal(document.activeElement, trigger);
});
