import { useRef, useState } from "react";
import {
  DEFAULT_THEME_KEY, applyTheme, isThemePreference, readThemePreference, resolveTheme,
} from "../theme.js";
import type { ThemePreference } from "../theme.js";
import type { ThemeProviderProps } from "../interfaces.js";
import { ThemeContext } from "../ThemeContext.js";
import { useClientLayoutEffect } from "../utils.js";

export function ThemeProvider({ children, storageKey = DEFAULT_THEME_KEY }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState(() => readThemePreference(storageKey));
  const currentPreference = useRef(preference);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(preference));
  useClientLayoutEffect(() => {
    const sync = () => {
      const current = readThemePreference(storageKey);
      currentPreference.current = current;
      setPreferenceState(current);
      setResolvedTheme(applyTheme(current));
    };
    sync();
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    const systemChange = () => setResolvedTheme(applyTheme(currentPreference.current));
    const storage = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) sync(); };
    query?.addEventListener("change", systemChange);
    window.addEventListener("storage", storage);
    return () => {
      query?.removeEventListener("change", systemChange);
      window.removeEventListener("storage", storage);
    };
  }, [storageKey]);
  function setPreference(next: ThemePreference) {
    if (!isThemePreference(next)) throw new TypeError("Theme preference must be system, light, or dark.");
    try { window.localStorage.setItem(storageKey, next); }
    catch (error) { console.warn("Wintermuted theme preference could not be saved.", error); }
    currentPreference.current = next;
    setPreferenceState(next);
    setResolvedTheme(applyTheme(next));
  }
  return <ThemeContext.Provider value={{ preference, setPreference, resolvedTheme }}>{children}</ThemeContext.Provider>;
}
