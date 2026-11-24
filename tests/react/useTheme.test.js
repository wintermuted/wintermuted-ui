import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render } from "./setup.js";
const { useTheme } = await import("../../packages/ui-react/src/useTheme.js");
const { ThemeContext } = await import("../../packages/ui-react/src/ThemeContext.js");

test("useTheme returns the provider context and rejects calls outside a provider", () => {
  let observed;
  function Observer() { observed = useTheme(); return null; }
  assert.throws(() => render(h(Observer)), {
    message: "useTheme must be used inside ThemeProvider.",
  });
  const context = { preference: "system", resolvedTheme: "light", setPreference: () => {} };
  render(h(ThemeContext.Provider, { value: context }, h(Observer)));
  assert.equal(observed, context);
});
