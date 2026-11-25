import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, fireEvent, userEvent } from "./setup.js";
const { LoadStatus, Tooltip, Button } = await import("@wintermuted/ui-react");
const labels = { retry: "Retry records", loading: "Loading records" };

test("LoadStatus renders nothing when idle, announces loading, and shows nonretryable errors", () => {
  const view = render(h(LoadStatus, { issues: [], labels }));
  assert.equal(view.container.childNodes.length, 0);
  view.rerender(h(LoadStatus, { issues: [], loading: true, labels }));
  assert.equal(screen.getByRole("status", { name: labels.loading }).textContent, labels.loading);
  assert.equal(screen.queryByRole("alert"), null);
  view.rerender(h(LoadStatus, { issues: [{ message: "Records unavailable" }], labels }));
  assert.equal(screen.getByRole("alert").textContent.trim(), "Records unavailable");
  assert.equal(screen.queryByRole("button"), null);
});

test("LoadStatus keeps warnings separate from loading and disables retry while retaining errors", async () => {
  let retries = 0;
  const user = userEvent.setup();
  const view = render(h(LoadStatus, { issues: [], warnings: ["Some records are missing"], loading: true, labels }));
  assert.equal(screen.getByText("Some records are missing").getAttribute("role"), "status");
  assert.ok(screen.getByRole("status", { name: labels.loading }));
  view.rerender(h(LoadStatus, { issues: [{ message: "Records unavailable", retry: () => retries++ }],
    warnings: ["Some records are missing"], loading: true, labels }));
  assert.equal(screen.getByRole("alert").textContent.trim(), "Records unavailable Some records are missing");
  assert.equal(screen.queryByRole("status"), null);
  const retry = screen.getByRole("button", { name: labels.retry });
  assert.equal(retry.disabled, true);
  await user.click(retry);
  assert.equal(retries, 0);
});

test("LoadStatus runs each retry once without bubbling click or keydown or submitting a form", async () => {
  const user = userEvent.setup();
  let first = 0, second = 0, clicks = 0, keys = 0, submissions = 0;
  const issues = Object.freeze([
    Object.freeze({ message: "First unavailable", retry: () => first++ }),
    Object.freeze({ message: "Read-only source unavailable" }),
    Object.freeze({ message: "Second unavailable", retry: () => second++ }),
  ]);
  render(h("form", { onSubmit: event => { event.preventDefault(); submissions++; },
    onClick: () => clicks++, onKeyDown: () => keys++ },
  h(LoadStatus, { issues, labels })));
  const retry = screen.getByRole("button", { name: labels.retry });
  await user.click(retry);
  assert.equal(first, 1);
  assert.equal(second, 1);
  fireEvent.keyDown(retry, { key: "Enter" });
  assert.equal(keys, 0);
  assert.equal(clicks, 0);
  assert.equal(submissions, 0);
  await user.keyboard("{Enter}");
  assert.equal(first, 2);
  assert.equal(second, 2);
  assert.equal(keys, 0);
  assert.equal(clicks, 0);
});

test("LoadStatus supplies exact help messages and tones and composes the existing Tooltip", async () => {
  const user = userEvent.setup(), received = [];
  let clicks = 0, keys = 0;
  const props = {
    issues: [{ message: "Records unavailable" }], warnings: Object.freeze(["Some records are missing"]), labels,
    renderHelp: help => {
      received.push(help);
      return h(Tooltip, { text: help.message },
        h(Button, { "aria-label": `About ${help.tone}`, variant: "ghost" }, "?"));
    },
  };
  const view = render(h("div", { onClick: () => clicks++, onKeyDown: () => keys++ }, h(LoadStatus, props)));
  assert.deepEqual(received.at(-1), { message: "Records unavailable Some records are missing", tone: "error" });
  assert.ok(screen.getByRole("alert").classList.contains("wm-sr-only"));
  await user.click(screen.getByRole("button", { name: "About error" }));
  assert.equal(screen.getByRole("tooltip").textContent, received.at(-1).message);
  await user.keyboard("{Escape}");
  assert.equal(screen.queryByRole("tooltip"), null);
  assert.equal(clicks, 0);
  assert.equal(keys, 0);
  view.rerender(h(LoadStatus, { ...props, issues: [] }));
  assert.deepEqual(received.at(-1), { message: "Some records are missing", tone: "warning" });
  assert.ok(screen.getByRole("status").classList.contains("wm-sr-only"));
  assert.equal(screen.queryByRole("alert"), null);
});

test("LoadStatus preserves supplied classes and icons and isolates simultaneous instances", async () => {
  let first = 0, second = 0;
  const user = userEvent.setup();
  render(h("div", null,
    h(LoadStatus, { issues: [{ message: "One unavailable", retry: () => first++ }],
      labels: { retry: "Retry one", loading: "Loading one" }, className: "host-status",
      retryIcon: h("span", { "aria-hidden": true }, "!") }),
    h(LoadStatus, { issues: [{ message: "Two unavailable", retry: () => second++ }],
      labels: { retry: "Retry two", loading: "Loading two" } }),
    h(LoadStatus, { issues: [], loading: true, labels,
      loadingIcon: h("span", { "aria-hidden": true }, "...") })));
  const firstButton = screen.getByRole("button", { name: "Retry one" });
  assert.ok(firstButton.closest(".host-status"));
  assert.equal(firstButton.textContent, "!");
  assert.equal(screen.getByRole("status", { name: labels.loading }).textContent, "...");
  await user.click(firstButton);
  assert.equal(first, 1);
  assert.equal(second, 0);
  assert.equal(screen.getAllByRole("alert").length, 2);
});
