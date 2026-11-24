import { createContext } from "react";
import type { ThemeContextValue } from "./interfaces.js";

export const ThemeContext = createContext<ThemeContextValue | null>(null);
