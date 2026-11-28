# Initialize dark mode with SSR

Install `@wintermuted/ui-react`, `@wintermuted/ui-theme`, React and React DOM. Check your installed exports and declarations before using these source-revision examples.

This React 18/19 example renders a document on the server and hydrates only `#root`. It respects a saved light/dark preference or the operating system, rather than forcing dark mode for every visitor. The synchronous bootstrap runs before CSS to avoid a light first paint for dark-mode users.

Save the following modules alongside one another. The application chooses one storage key, uses it for bootstrap, client initialization and the provider, and waits until mount to render preference-dependent controls. The server and initial client tree both omit those controls, avoiding a hydration mismatch when local storage differs from the server's System default.

`theme-config.ts`:

```ts
export const storageKey = "document-app:theme";
```

`App.tsx`:

```tsx
import { useEffect, useState } from "react";
import { ThemeProvider, ThemeSelect } from "@wintermuted/ui-react";
import { storageKey } from "./theme-config";

export function App() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <main>
    <h1>Document library</h1>
    {mounted ? <ThemeProvider storageKey={storageKey}>
      <ThemeSelect label="Appearance" />
    </ThemeProvider> : null}
    <p>Theme styling is available before these controls mount.</p>
  </main>;
}
```

`server.tsx`:

```tsx
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { getThemeScript } from "@wintermuted/ui-react/theme";
import { App } from "./App";
import { storageKey } from "./theme-config";

export function renderDocument({ nonce, cssHref, clientSrc }: {
  nonce: string; cssHref: string; clientSrc: string;
}) {
  const appMarkup = renderToString(<App />);
  return "<!doctype html>" + renderToStaticMarkup(<html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Document library</title>
      <script nonce={nonce} dangerouslySetInnerHTML={{ __html: getThemeScript(storageKey) }} />
      <link rel="stylesheet" href={cssHref} />
    </head>
    <body>
      <div id="root" dangerouslySetInnerHTML={{ __html: appMarkup }} />
      <script type="module" nonce={nonce} src={clientSrc} />
    </body>
  </html>);
}
```

`client.tsx`:

```tsx
import "@wintermuted/ui-theme/index.css";
import { hydrateRoot } from "react-dom/client";
import { initTheme } from "@wintermuted/ui-react/theme";
import { App } from "./App";
import { storageKey } from "./theme-config";

initTheme({ storageKey });
const root = document.getElementById("root");
if (!root) throw new Error("Missing application root.");
hydrateRoot(root, <App />);
```

The server route must supply `cssHref` and `clientSrc` from its bundler's asset manifest; `cssHref` points to the emitted theme CSS from the client import, not an npm package name or a guessed asset filename. Generate a fresh CSP nonce for each response and include it in the response's `script-src` policy. React escapes the nonce and asset attributes; `getThemeScript` escapes its serialized storage key. Do not insert untrusted HTML into either `dangerouslySetInnerHTML`.

Do not defer or make the bootstrap a module script. It changes only the document theme attributes, outside the hydrated root. For frameworks hydrating the document itself, use their supported head-script and hydration integration instead of copying this root-only server entry. Render other `useTheme`-dependent content inside the mounted provider, and keep a single document-level provider; do not suppress hydration warnings to hide divergent markup.

## References

- [Installation and package selection](../installation.md)
- [All task-oriented recipes](../recipes.md)
- [React component contracts](../react.md)
- [CSS imports and dependencies](../theme.md)
- [Theme preferences and SSR](../theming.md)
