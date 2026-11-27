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
  assert.equal(screen.getByText("Search by name"), hint);
  assert.equal(input.getAttribute("aria-describedby"), `existing ${hint.id} ${screen.getByText("Required").id}`);
  view.rerender(h(FieldGroup, { label: "Stop" }, h("input", { "aria-describedby": "existing", "aria-invalid": "grammar" })));
  assert.equal(input.getAttribute("aria-describedby"), "existing");
  assert.equal(input.getAttribute("aria-invalid"), "grammar");
});

test("FieldGroup renders independent explicit hint and error IDs and preserves error content semantics", () => {
  const view = render(h(FieldGroup, {
    label: "Project name", hint: "Use a unique name.", hintId: "name-hint",
    error: h("p", { role: "alert" }, "This name is taken."), errorId: "name-error",
  }, h("input", { "aria-describedby": "external-note" })));
  const input = screen.getByLabelText("Project name");
  assert.equal(screen.getByText("Use a unique name.").id, "name-hint");
  assert.equal(screen.getByRole("alert").parentElement.id, "name-error");
  assert.equal(input.getAttribute("aria-describedby"), "external-note name-hint name-error");
  assert.equal(input.getAttribute("aria-invalid"), "true");
  view.rerender(h(FieldGroup, {
    label: "Project name", error: "This name is taken.", hintId: "name-hint", errorId: "name-error",
  }, h("input", { "aria-describedby": "external-note" })));
  assert.equal(document.getElementById("name-hint"), null);
  assert.equal(input.getAttribute("aria-describedby"), "external-note name-error");
  assert.equal(input.parentElement.hasAttribute("hintId"), false);
  assert.equal(input.parentElement.hasAttribute("errorId"), false);
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
