# `@wintermuted/ui-theme`

Shared plain-CSS design tokens, resets, component styles, and light/dark themes for Wintermuted projects.

## Install

```sh
npm install @wintermuted/ui-theme
```

## Usage

Import the complete theme through your application's bundler:

```js
import "@wintermuted/ui-theme";
```

Or load only the CSS you need:

```js
import "@wintermuted/ui-theme/styles/tokens.css";
import "@wintermuted/ui-theme/styles/base.css";
import "@wintermuted/ui-theme/styles/components/button.css";
```

The package exports `index.css`, `styles/tokens.css`, `styles/base.css`, `styles/components.css`, and individual component stylesheets. Use `--wm-*` custom properties in application styles. Set `data-theme="dark"` on the document root to select the dark theme.

This package lives in `packages/ui-theme` within the [Wintermuted UI monorepo](https://github.com/wintermuted/wintermuted-ui). New monorepo tags are not directly installable as the theme through a GitHub-source npm dependency; use npm releases or a tarball produced by `npm pack --workspace=@wintermuted/ui-theme`.

## Existing React entry points

The optional React API remains available for existing consumers:

```js
import { Button, ThemeProvider } from "@wintermuted/ui-theme/react";
import { MultiSelect } from "@wintermuted/ui-theme/react/select";
import { initTheme } from "@wintermuted/ui-theme/theme";
```

Install React/React DOM 18.3 or 19 for the React API, and react-select 5.8 or newer only for the select adapter. These peers remain optional for CSS-only consumers.

The canonical implementation lives in the separate `@wintermuted/ui-react` workspace. Theme packaging includes compatibility copies, preserving runtime exports and legacy TypeScript declaration mappings without maintaining two implementations. Standalone React publication is deferred.
