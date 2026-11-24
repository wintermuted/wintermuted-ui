import { test } from "node:test";
import assert from "node:assert/strict";
import { h, dom, render, screen, act, setSystemTheme } from "./setup.js";
const { ThemeProvider } = await import("../../packages/ui-react/src/components/ThemeProvider.js");
const { useTheme } = await import("../../packages/ui-react/src/useTheme.js");

test("ThemeProvider initializes custom storage and follows system appearance only for system preference", async () => {
  let context;
  function Observer() {
    context = useTheme();
    return h("output", null, `${context.preference}:${context.resolvedTheme}`);
  }
  window.localStorage.setItem("app:theme", "dark");
  render(h(ThemeProvider, { storageKey: "app:theme" }, h(Observer)));
  assert.equal(screen.getByRole("status").textContent, "dark:dark");
  await setSystemTheme(false);
  assert.equal(context.resolvedTheme, "dark");
  await act(() => context.setPreference("system"));
  assert.equal(context.resolvedTheme, "light");
  await setSystemTheme(true);
  assert.equal(context.resolvedTheme, "dark");
  assert.equal(window.localStorage.getItem("app:theme"), "system");
  assert.equal(document.documentElement.dataset.theme, "dark");
});

test("ThemeProvider synchronizes storage events for its key and cleans up subscriptions", async t => {
  let context;
  function Observer() { context = useTheme(); return null; }
  const removed = t.mock.method(window, "removeEventListener");
  const view = render(h(ThemeProvider, { storageKey: "app:theme" }, h(Observer)));
  await act(() => {
    window.localStorage.setItem("app:theme", "dark");
    window.dispatchEvent(new dom.window.StorageEvent("storage", { key: "unrelated" }));
  });
  assert.equal(context.preference, "system");
  await act(() => window.dispatchEvent(new dom.window.StorageEvent("storage", { key: "app:theme" })));
  assert.equal(context.preference, "dark");
  await act(() => {
    window.localStorage.clear();
    window.dispatchEvent(new dom.window.StorageEvent("storage", { key: null }));
  });
  assert.equal(context.preference, "system");
  view.unmount();
  assert.ok(removed.mock.calls.some(call => call.arguments[0] === "storage"));
});

test("ThemeProvider rejects invalid preferences and warns on failed persistence without losing in-memory changes", async t => {
  let context;
  function Observer() { context = useTheme(); return null; }
  render(h(ThemeProvider, null, h(Observer)));
  assert.throws(() => context.setPreference("invalid"), {
    name: "TypeError", message: "Theme preference must be system, light, or dark.",
  });
  const failure = new Error("Storage unavailable");
  t.mock.method(dom.window.Storage.prototype, "setItem", () => { throw failure; });
  const warnings = t.mock.method(console, "warn", () => {});
  await act(() => context.setPreference("light"));
  assert.equal(context.preference, "light");
  assert.equal(context.resolvedTheme, "light");
  assert.equal(document.documentElement.dataset.theme, "light");
  assert.deepEqual(warnings.mock.calls[0].arguments, ["Wintermuted theme preference could not be saved.", failure]);
});
