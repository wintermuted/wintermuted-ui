export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";
export const DEFAULT_THEME_KEY: string;
export function isThemePreference(value: unknown): value is ThemePreference;
export function readThemePreference(storageKey?: string): ThemePreference;
export function resolveTheme(preference: ThemePreference): ResolvedTheme;
export function applyTheme(preference: ThemePreference): ResolvedTheme;
export function initTheme(options?: { storageKey?: string }): ResolvedTheme;
export function getThemeScript(storageKey?: string): string;
