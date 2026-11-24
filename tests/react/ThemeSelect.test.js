import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, userEvent } from "./setup.js";
const { ThemeSelect } = await import("../../packages/ui-react/src/components/ThemeSelect.js");
const { ThemeContext } = await import("../../packages/ui-react/src/ThemeContext.js");

test("ThemeSelect labels its generated control and requests a typed preference change", async t => {
  const user = userEvent.setup();
  const setPreference = t.mock.fn();
  const context = { preference: "system", resolvedTheme: "light", setPreference };
  const view = render(h(ThemeContext.Provider, { value: context }, h(ThemeSelect)));
  const select = screen.getByRole("combobox", { name: "Appearance" });
  assert.ok(select.id);
  assert.deepEqual([...select.options].map(option => [option.value, option.textContent]),
    [["system", "System"], ["light", "Light"], ["dark", "Dark"]]);
  await user.selectOptions(select, "dark");
  assert.deepEqual(setPreference.mock.calls[0].arguments, ["dark"]);
  view.rerender(h(ThemeContext.Provider, { value: { ...context, preference: "dark", resolvedTheme: "dark" } },
    h(ThemeSelect, { id: "custom-theme", label: "Theme", disabled: true, className: "custom" })));
  const custom = screen.getByRole("combobox", { name: "Theme" });
  assert.equal(custom.id, "custom-theme");
  assert.equal(custom.value, "dark");
  assert.equal(custom.disabled, true);
  assert.ok(custom.classList.contains("custom"));
});
