import { useContext } from "react";
import { ThemeContext } from "./ThemeContext.js";
import type { ThemeContextValue } from "./interfaces.js";

export function useTheme(): ThemeContextValue {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used inside ThemeProvider.");
  return theme;
}
