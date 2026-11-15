export const DEFAULT_THEME_KEY = "wintermuted:theme";

export function isThemePreference(value) {
  return value === "system" || value === "light" || value === "dark";
}

export function readThemePreference(storageKey = DEFAULT_THEME_KEY) {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(storageKey);
    return isThemePreference(stored) ? stored : "system";
  } catch (error) {
    console.warn("Wintermuted theme preference could not be read.", error);
    return "system";
  }
}

export function resolveTheme(preference) {
  return preference === "system"
    ? (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
}

export function applyTheme(preference) {
  const resolved = resolveTheme(preference);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }
  return resolved;
}

export function initTheme({ storageKey = DEFAULT_THEME_KEY } = {}) {
  return applyTheme(readThemePreference(storageKey));
}

// Keep this synchronous bootstrap self-contained so SSR can emit it before CSS.
export function getThemeScript(storageKey = DEFAULT_THEME_KEY) {
  const key = JSON.stringify(storageKey).replace(/</g, "\\u003c");
  return `(function(){var p="system";try{var s=localStorage.getItem(${key});if(s==="light"||s==="dark")p=s;}catch(e){console.warn("Wintermuted theme preference could not be read.",e);}var t=p==="system"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p;document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;})();`;
}
