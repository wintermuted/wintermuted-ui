import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, userEvent } from "./setup.js";
const { FieldGroup } = await import("../../packages/ui-react/src/components/FieldGroup.js");

test("FieldGroup links a generated control ID and merges hints and error descriptions", async () => {
  const user = userEvent.setup();
  const view = render(h(FieldGroup, { label: "Stop", hint: "Search by name", className: "custom" },
    h("input", { "aria-describedby": "existing", "aria-invalid": "grammar" })));
  const input = screen.getByLabelText("Stop");
  const hint = screen.getByText("Search by name");
  assert.ok(input.id);
  assert.equal(input.getAttribute("aria-describedby"), `existing ${hint.id}`);
  assert.equal(input.getAttribute("aria-invalid"), "grammar");
  assert.ok(input.parentElement.classList.contains("custom"));
  await user.click(screen.getByText("Stop", { selector: "label" }));
  assert.equal(document.activeElement, input);
  view.rerender(h(FieldGroup, { label: "Stop", hint: "Search by name", error: "Required" },
    h("input", { "aria-describedby": "existing", "aria-invalid": "grammar" })));
  assert.equal(input.getAttribute("aria-invalid"), "true");
  assert.equal(screen.queryByText("Search by name"), null);
  assert.equal(input.getAttribute("aria-describedby"), `existing ${screen.getByText("Required").id}`);
  view.rerender(h(FieldGroup, { label: "Stop" }, h("input", { "aria-describedby": "existing", "aria-invalid": "grammar" })));
  assert.equal(input.getAttribute("aria-describedby"), "existing");
  assert.equal(input.getAttribute("aria-invalid"), "grammar");
});

test("FieldGroup honors htmlFor and synchronizes custom inputId controls", () => {
  function Control({ inputId, id, ...props }) { return h("input", { ...props, id: inputId ?? id }); }
  const view = render(h(FieldGroup, { label: "Custom" }, h(Control, { inputId: "adapter-input" })));
  assert.equal(screen.getByLabelText("Custom").id, "adapter-input");
  view.rerender(h(FieldGroup, { label: "Custom", htmlFor: "explicit" }, h(Control, { inputId: "adapter-input" })));
  assert.equal(screen.getByLabelText("Custom").id, "explicit");
  view.rerender(h(FieldGroup, { label: "Native" }, h("input", { id: "native-id" })));
  assert.equal(screen.getByLabelText("Native").id, "native-id");
});
