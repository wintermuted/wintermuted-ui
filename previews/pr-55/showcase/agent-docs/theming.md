## Theme preferences and SSR

`useTheme()` returns `{ preference, setPreference, resolvedTheme }`. Preference is `"system" | "light" | "dark"` and defaults to System. Overrides persist under `wintermuted:theme` by default; pass a namespaced `storageKey` to both initialization and provider to isolate applications. Returning to System follows OS changes immediately. Cross-tab storage changes synchronize. Storage failures warn explicitly while the current selection still works in memory.

For client rendering, call `initTheme({ storageKey })` from the React-free `@wintermuted/ui-react/theme` entry before mounting React. For SSR or first paint of server HTML, emit `getThemeScript(storageKey)` in a synchronous inline head script before styles, with the appropriate CSP nonce. The helper safely escapes `<` in serialized keys; never interpolate an unsanitized key into your own script.

Hydration markup should not branch on the client preference on the server; theme-dependent UI should render after mount. Importing the React-free helper on the server is safe. Only `document.documentElement.dataset.theme` and `style.colorScheme` are updated; map styles, tile sources, and application state are unchanged. Use one document-level provider per app. `ThemeSelect` defaults to label Appearance with System, Light, and Dark options and must be inside a provider.
