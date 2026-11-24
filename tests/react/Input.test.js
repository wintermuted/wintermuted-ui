import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, userEvent } from "./setup.js";
import { testPrimitive } from "./primitive.js";
const { Input } = await import("../../packages/ui-react/src/components/Input.js");

testPrimitive("Input", Input, "input", "wm-input", { type: "text" });

test("Input supports native editing and blocks edits while disabled", async () => {
  const user = userEvent.setup();
  const changes = [];
  const view = render(h(Input, { "aria-label": "Name", defaultValue: "A", onChange: event => changes.push(event.target.value) }));
  const input = screen.getByRole("textbox", { name: "Name" });
  await user.type(input, "B");
  assert.equal(input.value, "AB");
  assert.deepEqual(changes, ["AB"]);
  view.rerender(h(Input, { "aria-label": "Name", disabled: true, onChange: event => changes.push(event.target.value) }));
  await user.type(input, "C");
  assert.equal(input.value, "AB");
  assert.deepEqual(changes, ["AB"]);
});
