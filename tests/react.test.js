import { test } from "node:test";
import assert from "node:assert/strict";
import { React, h, dom, render, screen, fireEvent, act, userEvent, theme, setSystemTheme } from "./react/setup.js";

const ui = await import("@wintermuted/ui-react");
const { MultiSelect } = await import("@wintermuted/ui-react/select");

test("native props, polymorphism, slots, and button default do not submit forms", async () => {
  const user = userEvent.setup();
  let submissions = 0;
  const ref = React.createRef();
  render(h("form", { onSubmit: event => { event.preventDefault(); submissions++; } },
    h(ui.Card, { as: "article", title: "Surface" },
      h(ui.CardHeader, null, h(ui.CardTitle, { as: "h4" }, "Departures")),
      h(ui.CardBody, null, h(ui.Button, { ref, icon: "!", className: "custom" }, "Refresh")),
      h(ui.CardFooter, null, h(ui.Badge, { tone: "success", "data-testid": "badge" }, "Live"))),
    h(ui.ListGroup, null, h(ui.ListItem, { value: 3, style: { display: "flex" } }, "Stop"))));
  assert.equal(document.querySelector("article").title, "Surface");
  assert.equal(screen.getByRole("heading", { name: "Departures" }).tagName, "H4");
  assert.equal(ref.current, screen.getByRole("button", { name: "Refresh" }));
  await user.click(ref.current);
  assert.equal(submissions, 0);
  assert.match(ref.current.className, /custom/);
  assert.match(screen.getByTestId("badge").className, /wm-badge-success/);
  assert.equal(screen.getByRole("listitem").value, 3);
});

test("FieldGroup connects label, existing description and validation; native select works", async () => {
  const user = userEvent.setup();
  render(h("div", null,
    h("span", { id: "extra" }, "Required"),
    h(ui.FieldGroup, { label: "Stop", error: "Choose a stop" },
      h(ui.Input, { "aria-describedby": "extra" })),
    h(ui.FieldGroup, { label: "Direction", hint: "Choose a direction" },
      h(ui.Select, { defaultValue: "north" }, h("option", { value: "north" }, "North"),
        h("option", { value: "south" }, "South")))));
  const input = screen.getByLabelText("Stop");
  assert.equal(input.getAttribute("aria-invalid"), "true");
  assert.match(input.getAttribute("aria-describedby"), /^extra /);
  await user.click(screen.getByText("Stop", { selector: "label" }));
  assert.equal(document.activeElement, input);
  await user.selectOptions(screen.getByLabelText("Direction"), "south");
  assert.equal(screen.getByLabelText("Direction").value, "south");
});

test("Tabs support roving focus, disabled items, linked panels and controlled selection", async () => {
  const user = userEvent.setup();
  const changes = [];
  const items = [{ id: "a", label: "Arrivals", content: "Times" },
    { id: "b", label: "Unavailable", content: "No", disabled: true },
    { id: "c", label: "Map", content: "Places" }];
  const view = render(h(ui.Tabs, { items, label: "Views", onValueChange: id => changes.push(id) }));
  screen.getByRole("tab", { name: "Arrivals" }).focus();
  await user.keyboard("{ArrowRight}");
  assert.equal(document.activeElement.textContent, "Map");
  assert.equal(screen.getByRole("tabpanel").textContent, "Places");
  assert.equal(screen.getByRole("tabpanel").getAttribute("aria-labelledby"), document.activeElement.id);
  await user.keyboard("{Home}");
  assert.equal(document.activeElement.textContent, "Arrivals");
  assert.deepEqual(changes, ["c", "a"]);
  view.rerender(h(ui.Tabs, { items, label: "Views", value: "a", onValueChange: id => changes.push(id) }));
  await user.click(screen.getByRole("tab", { name: "Map" }));
  assert.equal(screen.getByRole("tab", { name: "Arrivals" }).getAttribute("aria-selected"), "true");
});

test("Menu keyboard skips disabled entries, closes on Escape, Tab, selection and outside pointer", async () => {
  const user = userEvent.setup();
  let selected = 0;
  render(h(ui.Menu, { label: "Actions", items: [
    { id: "a", label: "Refresh", onSelect: () => selected++ },
    { id: "b", label: "Disabled", disabled: true },
    { id: "c", label: "About", href: "#about" },
  ] }));
  const trigger = screen.getByRole("button", { name: "Actions" });
  trigger.focus();
  await user.keyboard("{ArrowDown}{ArrowDown}");
  assert.equal(document.activeElement.textContent, "About");
  await user.keyboard("{Escape}");
  assert.equal(screen.queryByRole("menu"), null);
  assert.equal(document.activeElement, trigger);
  await user.click(trigger);
  await user.keyboard("{Enter}");
  assert.equal(selected, 1);
  await user.click(trigger);
  await user.keyboard("{Tab}");
  assert.equal(screen.queryByRole("menu"), null);
  await user.click(trigger);
  fireEvent.pointerDown(document.body);
  assert.equal(screen.queryByRole("menu"), null);
});

test("Tooltip exposes description on focus/hover, preserves descriptions, and dismisses on Escape", async () => {
  const user = userEvent.setup();
  render(h(ui.Tooltip, { text: "Refresh arrivals" },
    h(ui.Button, { "aria-describedby": "existing" }, "Refresh")));
  const button = screen.getByRole("button");
  await user.tab();
  assert.equal(screen.getByRole("tooltip").textContent, "Refresh arrivals");
  assert.equal(button.getAttribute("aria-describedby"), `existing ${screen.getByRole("tooltip").id}`);
  await user.keyboard("{Escape}");
  assert.equal(screen.queryByRole("tooltip"), null);
  await user.tab();
  await user.unhover(button);
  await user.hover(button);
  assert.ok(screen.getByRole("tooltip"));
  await user.unhover(button);
  assert.equal(screen.queryByRole("tooltip"), null);
});

test("Dialog uses native modal, labelled title, controlled Escape and restores focus", async () => {
  const user = userEvent.setup();
  function Example() {
    const [open, setOpen] = React.useState(false);
    return h("div", null, h(ui.Button, { onClick: () => setOpen(true) }, "Open"),
      h(ui.Dialog, { open, onClose: () => setOpen(false), title: "Choose route" }, h(ui.Input)));
  }
  render(h(React.StrictMode, null, h(Example)));
  const trigger = screen.getByRole("button", { name: "Open" });
  await user.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Choose route" });
  assert.equal(dialog.open, true);
  assert.ok(dialog.contains(document.activeElement));
  await act(async () => fireEvent(dialog, new Event("cancel", { cancelable: true })));
  assert.equal(screen.queryByRole("dialog"), null);
  assert.ok(document.activeElement === trigger);
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Close dialog" }));
  assert.ok(document.activeElement === trigger);
});

test("Theme defaults to System, tracks OS, persists override, resets and accepts storage updates", async () => {
  const user = userEvent.setup();
  function Status() { return h("output", null, ui.useTheme().resolvedTheme); }
  render(h(ui.ThemeProvider, null, h(ui.ThemeSelect), h(Status)));
  assert.equal(screen.getByLabelText("Appearance").value, "system");
  await setSystemTheme(true);
  assert.equal(document.documentElement.dataset.theme, "dark");
  await user.selectOptions(screen.getByLabelText("Appearance"), "light");
  assert.equal(window.localStorage.getItem(theme.DEFAULT_THEME_KEY), "light");
  await setSystemTheme(true);
  assert.equal(document.documentElement.dataset.theme, "light");
  await user.selectOptions(screen.getByLabelText("Appearance"), "system");
  assert.equal(document.documentElement.dataset.theme, "dark");
  await act(() => {
    window.localStorage.setItem(theme.DEFAULT_THEME_KEY, "light");
    window.dispatchEvent(new dom.window.StorageEvent("storage", { key: theme.DEFAULT_THEME_KEY }));
  });

  assert.equal(screen.getByLabelText("Appearance").value, "light");
  assert.equal(screen.getByRole("status").textContent, "light");
});

test("initially open Dialog keeps focus through StrictMode replay and restores it on unmount", async () => {
  const outside = document.createElement("button");
  outside.textContent = "Opener";
  document.body.append(outside);
  outside.focus();
  let closes = 0;
  const view = render(h(React.StrictMode, null,
    h(ui.Dialog, { open: true, onClose: () => closes++, title: "Initially open" }, h(ui.Input))));
  await act(async () => {});
  const dialog = screen.getByRole("dialog", { name: "Initially open" });
  assert.ok(dialog.contains(document.activeElement));
  assert.equal(closes, 0);
  view.unmount();
  await act(async () => {});
  assert.ok(document.activeElement === outside);
  assert.equal(closes, 0);
  outside.remove();
});

test("Theme bootstrap honors override before mount, validates storage, and escapes script keys", () => {
  window.localStorage.setItem("app:appearance", "dark");
  assert.equal(theme.initTheme({ storageKey: "app:appearance" }), "dark");
  assert.equal(document.documentElement.style.colorScheme, "dark");
  window.localStorage.setItem("app:appearance", "invalid");
  assert.equal(theme.initTheme({ storageKey: "app:appearance" }), "light");
  assert.equal(theme.getThemeScript("</script>").includes("</script>"), false);
  window.localStorage.setItem(theme.DEFAULT_THEME_KEY, "dark");
  window.eval(theme.getThemeScript());
  assert.equal(document.documentElement.dataset.theme, "dark");
});

test("MultiSelect preserves default selection, option shape, onChange, multi and single modes", async () => {
  const user = userEvent.setup();
  const options = [{ value: 1, label: "North at Main", stop: { id: 1 } },
    { value: 2, label: "South at Main", stop: { id: 2 } }];
  const changes = [];
  const view = render(h(ui.FieldGroup, { label: "Stops" },
    h(MultiSelect, { options, defaultValue: [options[0]], onChange: values => changes.push(values),
      menuPortalTarget: document.body })));
  assert.ok(screen.getByText("North at Main"));
  await user.click(screen.getByLabelText("Stops"));
  await user.click(screen.getByText("South at Main"));
  assert.deepEqual(changes[0], options);
  view.unmount();
  render(h(MultiSelect, { "aria-label": "One stop", isMulti: false, options, onChange: value => changes.push(value) }));
  await user.click(screen.getByLabelText("One stop"));
  await user.click(screen.getByText("South at Main"));
  assert.equal(changes[1], options[1]);
});

test("Progress clamps range and feedback has accessible names", () => {
  render(h("div", null, h(ui.ProgressBar, { value: 150, label: "Refresh" }),
    h(ui.Spinner, { label: "Fetching arrivals" }), h(ui.Alert, { tone: "danger", role: "alert" }, "Request failed")));
  assert.equal(screen.getByRole("progressbar", { name: "Refresh" }).value, 100);
  assert.equal(screen.getByRole("status").textContent, "Fetching arrivals");
  assert.equal(screen.getByRole("alert").textContent, "Request failed");
});
