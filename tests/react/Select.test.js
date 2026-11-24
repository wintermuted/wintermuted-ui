import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, userEvent } from "./setup.js";
import { testPrimitive } from "./primitive.js";
const { Select } = await import("../../packages/ui-react/src/components/Select.js");

testPrimitive("Select", Select, "select", "wm-select");

test("Select supports option children, default selection, and change callbacks", async () => {
  const user = userEvent.setup();
  const changes = [];
  render(h(Select, { "aria-label": "Direction", defaultValue: "north", onChange: event => changes.push(event.target.value) },
    h("option", { value: "north" }, "North"), h("option", { value: "south" }, "South"),
    h("option", { value: "closed", disabled: true }, "Closed")));
  const select = screen.getByRole("combobox", { name: "Direction" });
  assert.equal(select.value, "north");
  await user.selectOptions(select, "south");
  await user.selectOptions(select, "closed");
  assert.equal(select.value, "south");
  assert.deepEqual(changes, ["south"]);
});
