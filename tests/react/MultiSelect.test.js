import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, userEvent } from "./setup.js";
const { MultiSelect } = await import("@wintermuted/ui-react/select");

test("MultiSelect preserves inputId precedence, instance props, formatted options, and single-value callbacks", async () => {
  const user = userEvent.setup();
  const option = { value: 1, label: "North", stop: { id: 1 } };
  let selection;
  render(h(MultiSelect, { id: "fallback", inputId: "control", instanceId: "stable", "aria-label": "Stop",
    isMulti: false, className: "custom", options: [option], formatOptionLabel: value => `Stop: ${value.label}`,
    onChange: value => { selection = value; } }));
  const input = screen.getByRole("combobox", { name: "Stop" });
  assert.equal(input.id, "control");
  assert.ok(input.closest(".wm-search-select").classList.contains("custom"));
  await user.click(input);
  assert.equal(input.getAttribute("aria-controls"), "react-select-stable-listbox");
  await user.click(screen.getByText("Stop: North"));
  assert.equal(selection, option);
});

test("MultiSelect defaults to multi-value selection and merges consumer styles over theme tokens", async t => {
  const user = userEvent.setup();
  const options = [{ value: 1, label: "North" }, { value: 2, label: "South" }];
  const styles = t.mock.fn(base => ({ ...base, minHeight: 70 }));
  const changes = [];
  render(h(MultiSelect, { id: "stops", "aria-label": "Stops", options, defaultValue: [options[0]],
    styles: { control: styles }, onChange: value => changes.push(value) }));
  assert.equal(screen.getByRole("combobox", { name: "Stops" }).id, "stops");
  assert.equal(styles.mock.calls[0].arguments[0].backgroundColor, "var(--wm-color-bg)");
  await user.click(screen.getByRole("combobox", { name: "Stops" }));
  await user.click(screen.getByText("South"));
  assert.deepEqual(changes[0], options);
});
