# Using Wintermuted UI with agent chat

Start with the package matching your application. Ask your agent to check your installed package's exports and TypeScript declarations before using a component: documentation from a newer source revision can describe APIs not yet published.

## CSS-only applications

```sh
npm install @wintermuted/ui-theme
```

```js
import "@wintermuted/ui-theme/index.css";
```

Use semantic HTML, the theme's component classes, and `--wm-*` CSS custom properties. CSS-only consumers do not need React. The theme root imports CSS, not JavaScript behavior.

## React applications

```sh
npm install @wintermuted/ui-react @wintermuted/ui-theme react react-dom
```

```tsx
import "@wintermuted/ui-theme/index.css";
import { Button } from "@wintermuted/ui-react";

export function SaveAction() {
  return <Button onClick={() => console.log("Save requested")}>Save</Button>;
}
```

React components never inject global CSS. Load the aggregate theme explicitly, or follow the theme guide's modular stylesheet dependencies. Native attributes, accessible names, and application-owned state remain your responsibility.

## Searchable selects

```sh
npm install @wintermuted/ui-react-select @wintermuted/ui-theme react react-dom react-select
```

```tsx
import "@wintermuted/ui-theme/index.css";
import { MultiSelect } from "@wintermuted/ui-react-select";

export function DepartmentSelect() {
  return <MultiSelect aria-label="Departments"
    options={[{ value: "engineering", label: "Engineering" }]} />;
}
```

Use `Select` from `@wintermuted/ui-react` for native HTML selects. Use `MultiSelect` from the standalone adapter for searchable selection. The adapter does not require core `ui-react`, but does require its React, React DOM, and react-select peers.

## Theme initialization

React applications import `initTheme` and `getThemeScript` from the React-free `@wintermuted/ui-react/theme` entry point. Use the same storage key for initialization and `ThemeProvider`; put `ThemeSelect` inside that provider. For SSR, follow the theme preferences guide's first-paint, hydration, and CSP requirements.

## Agent-readable documentation

The showcase serves `llms.txt` and `agent-docs/*.md` without requiring JavaScript. The index links to installation, CSS, React, searchable-select, migration, theming, and individual component contracts.

Component Markdown is generated from the canonical React README and checked against component exports. Update those existing contracts rather than editing generated output. Applications continue to own routing, fetching, filtering, sorting, formatting, translations, and notification timing.

Share the [production index](https://wintermuted.github.io/wintermuted-ui/showcase/llms.txt) with your agent once the documentation deployment containing it has succeeded. PR previews have their own index under `previews/pr-<number>/showcase/llms.txt`, describing that preview's source. Local development serves the index at `http://localhost:4174/showcase/llms.txt`.
