import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, fireEvent, userEvent } from "./setup.js";
const { LanguageSelector } = await import("@wintermuted/ui-react");
const options = [{ value: "ja", label: "Japanese" }, { value: "sv", label: "Swedish", disabled: true },
  { value: "de", label: "German" }];

test("LanguageSelector native selection uses supplied values and disabled choices", () => {
  const changes = [];
  render(h(LanguageSelector, { options, value: "ja", label: "Locale", onChange: value => changes.push(value), className: "host" }));
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "de" } });
  assert.deepEqual(changes, ["de"]);
  assert.equal(screen.getByRole("option", { name: "Swedish" }).disabled, true);
  assert.match(screen.getByRole("combobox").className, /wm-select host/);
});

test("LanguageSelector dropup skips disabled choices, restores focus and dismisses", async () => {
  const user = userEvent.setup(), changes = [];
  render(h("div", null, h(LanguageSelector, { options, value: "ja", label: "Locale", variant: "dropup",
    onChange: value => changes.push(value) }), h("button", null, "Outside")));
  const trigger = screen.getByRole("button", { name: "Locale: Japanese" });
  await user.click(trigger);
  assert.equal(document.activeElement, screen.getByRole("option", { name: "Japanese" }));
  await user.keyboard("{ArrowDown}");
  assert.equal(document.activeElement, screen.getByRole("option", { name: "German" }));
  await user.keyboard("{ArrowDown}{End}{Home}");
  assert.equal(document.activeElement, screen.getByRole("option", { name: "Japanese" }));
  await user.keyboard("{ArrowUp}{Enter}");
  assert.deepEqual(changes, ["de"]);
  assert.equal(document.activeElement, trigger);
  assert.equal(screen.queryByRole("listbox"), null);
  await user.keyboard("{ArrowDown}{Escape}");
  assert.equal(document.activeElement, trigger);
  await user.click(trigger);
  fireEvent.mouseDown(document.body);
  assert.equal(screen.queryByRole("listbox"), null);
  await user.click(trigger);
  await user.tab();
  assert.equal(screen.queryByRole("listbox"), null);
  assert.equal(document.activeElement, screen.getByRole("button", { name: "Outside" }));
});

test("LanguageSelector preserves navigated focus across equivalent and reordered options", async () => {
  const user = userEvent.setup(), changes = [];
  const props = { options, value: "ja", label: "Locale", variant: "dropup", onChange: value => changes.push(value) };
  const view = render(h(LanguageSelector, props));
  await user.click(screen.getByRole("button", { name: /Locale/ }));
  await user.keyboard("{ArrowDown}");
  const german = screen.getByRole("option", { name: "German" });
  assert.equal(document.activeElement, german);
  view.rerender(h(LanguageSelector, { ...props, options: options.map(option => ({ ...option })) }));
  assert.equal(document.activeElement, german);
  view.rerender(h(LanguageSelector, { ...props, options: [...options].reverse() }));
  assert.equal(document.activeElement, german);
  await user.keyboard("{Enter}");
  assert.deepEqual(changes, ["de"]);
});

test("LanguageSelector recovers focus when the navigated option is disabled or removed", async () => {
  const user = userEvent.setup();
  const props = { options, value: "ja", label: "Locale", variant: "dropup", onChange() {} };
  const view = render(h(LanguageSelector, props));
  await user.click(screen.getByRole("button", { name: /Locale/ }));
  await user.keyboard("{ArrowDown}");
  view.rerender(h(LanguageSelector, { ...props,
    options: options.map(option => ({ ...option, disabled: option.value !== "ja" })) }));
  assert.equal(document.activeElement, screen.getByRole("option", { name: "Japanese" }));
  view.rerender(h(LanguageSelector, props));
  await user.keyboard("{ArrowDown}");
  assert.equal(document.activeElement, screen.getByRole("option", { name: "German" }));
  view.rerender(h(LanguageSelector, { ...props, options: options.filter(option => option.value !== "de") }));
  assert.equal(document.activeElement, screen.getByRole("option", { name: "Japanese" }));
});

test("LanguageSelector dropup exposes the selected label in its accessible name", () => {
  const props = { options, value: "ja", label: "Locale", variant: "dropup", onChange() {} };
  const view = render(h(LanguageSelector, props));
  assert.equal(screen.getByRole("button", { name: "Locale: Japanese" }).textContent.includes("Japanese"), true);
  view.rerender(h(LanguageSelector, { ...props, value: "de" }));
  assert.equal(screen.getByRole("button", { name: "Locale: German" }).textContent.includes("German"), true);
});

test("LanguageSelector empty and all-disabled dropups cannot open", () => {
  const view = render(h(LanguageSelector, { options: [], value: "", label: "Locale", variant: "dropup", onChange() {} }));
  assert.equal(screen.getByRole("button").disabled, true);
  view.rerender(h(LanguageSelector, { options: options.map(option => ({ ...option, disabled: true })),
    value: "ja", label: "Locale", variant: "dropup", onChange() {} }));
  assert.equal(screen.getByRole("button").disabled, true);
});
