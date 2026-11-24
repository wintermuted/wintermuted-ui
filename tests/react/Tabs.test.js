import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, userEvent } from "./setup.js";
const { Tabs } = await import("../../packages/ui-react/src/components/Tabs.js");

const items = [
  { id: "disabled", label: "Disabled", content: "Unavailable", disabled: true },
  { id: "first", label: "First", content: h("input", { "aria-label": "Panel input", defaultValue: "Keep me" }) },
  { id: "last", label: "Last", content: "Last panel" },
];

test("Tabs falls back from disabled selections and wraps keyboard navigation while retaining panels", async () => {
  const user = userEvent.setup();
  const changes = [];
  render(h(Tabs, { label: "Views", items, defaultValue: "disabled", onValueChange: value => changes.push(value) }));
  const first = screen.getByRole("tab", { name: "First" });
  const last = screen.getByRole("tab", { name: "Last" });
  const input = screen.getByRole("textbox", { name: "Panel input" });
  assert.equal(first.getAttribute("aria-selected"), "true");
  assert.equal(screen.getByRole("tab", { name: "Disabled" }).disabled, true);
  first.focus();
  await user.keyboard("{ArrowLeft}");
  assert.equal(document.activeElement, last);
  assert.equal(input.isConnected, true);
  assert.equal(input.closest("[role=tabpanel]").hidden, true);
  assert.equal(screen.getByRole("tabpanel").getAttribute("aria-labelledby"), last.id);
  await user.keyboard("{ArrowRight}{End}{Home}");
  assert.equal(document.activeElement, first);
  assert.equal(input.value, "Keep me");
  assert.deepEqual(changes, ["last", "first", "last", "first"]);
});

test("Tabs controlled selection requests changes without updating until the parent rerenders", async () => {
  const user = userEvent.setup();
  const changes = [];
  const view = render(h(Tabs, { label: "Views", items, value: "first", onValueChange: value => changes.push(value) }));
  await user.click(screen.getByRole("tab", { name: "Last" }));
  assert.deepEqual(changes, ["last"]);
  assert.equal(screen.getByRole("tab", { name: "First" }).getAttribute("aria-selected"), "true");
  view.rerender(h(Tabs, { label: "Views", items, value: "last" }));
  assert.equal(screen.getByRole("tab", { name: "Last" }).getAttribute("aria-selected"), "true");
  view.rerender(h(Tabs, { label: "Empty", items: [] }));
  assert.equal(screen.queryAllByRole("tab").length, 0);
  assert.equal(screen.queryByRole("tabpanel"), null);
});
