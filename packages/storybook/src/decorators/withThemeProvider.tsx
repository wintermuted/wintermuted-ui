import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { Decorator } from "@storybook/react-vite";
import { useGlobals } from "storybook/preview-api";
import { ThemeProvider, useTheme } from "@wintermuted/ui-react";
import { resolveTheme, type ResolvedTheme } from "@wintermuted/ui-react/theme";

function ThemeScope({ theme, onThemeChange, children }: {
  theme: ResolvedTheme;
  onThemeChange: (theme: ResolvedTheme) => void;
  children: ReactNode;
}) {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const previousTheme = useRef<ResolvedTheme | null>(null);
  const previousSelection = useRef({ preference, resolvedTheme });
  useLayoutEffect(() => {
    if (previousTheme.current === theme) return;
    previousTheme.current = theme;
    if (resolveTheme(preference) !== theme) setPreference(theme);
  }, [theme, preference, setPreference]);
  useLayoutEffect(() => {
    const previous = previousSelection.current;
    previousSelection.current = { preference, resolvedTheme };
    if (previous.preference !== preference || previous.resolvedTheme !== resolvedTheme) {
      onThemeChange(resolvedTheme);
    }
  }, [preference, resolvedTheme, onThemeChange]);
  return <>{children}</>;
}

export const withThemeProvider: Decorator = (Story, context) => {
  const [globals, updateGlobals] = useGlobals();
  const theme = globals.theme === "dark" ? "dark" : "light";
  return <ThemeProvider key={context.id} storageKey={`wintermuted:storybook:${context.id}`}>
    <ThemeScope theme={theme} onThemeChange={next => updateGlobals({ theme: next })}>
      <Story />
    </ThemeScope>
  </ThemeProvider>;
};
