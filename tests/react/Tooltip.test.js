import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, userEvent } from "./setup.js";
const { Tooltip } = await import("../../packages/ui-react/src/components/Tooltip.js");

test("Tooltip merges its description, dismisses on Escape, and reopens on a new hover", async () => {
  const user = userEvent.setup();
  render(h(Tooltip, { text: "More detail" }, h("button", { "aria-describedby": "existing" }, "Help")));
  const button = screen.getByRole("button", { name: "Help" });
  assert.equal(screen.queryByRole("tooltip"), null);
  await user.hover(button);
  const tooltip = screen.getByRole("tooltip");
  assert.equal(tooltip.textContent, "More detail");
  assert.equal(button.getAttribute("aria-describedby"), `existing ${tooltip.id}`);
  await user.keyboard("{Escape}");
  assert.equal(screen.queryByRole("tooltip"), null);
  assert.equal(button.getAttribute("aria-describedby"), "existing");
  await user.unhover(button);
  await user.hover(button);
  assert.ok(screen.getByRole("tooltip"));
  await user.unhover(button);
  assert.equal(screen.queryByRole("tooltip"), null);
});
