# `@wintermuted/ui-theme`

Shared plain-CSS design tokens, resets, component styles, and light/dark themes for Wintermuted projects.

The patch release accompanying the typed React source migration preserves the CSS-only exports and `--wm-*` tokens; React components remain in `@wintermuted/ui-react`.

See the [theme architecture guide](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-theme/docs/architecture.md) for CSS layers, token ownership, public-path registration, and extension rules.

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

Context-free React controls reuse the existing `toggle-group.css`, `stat-card.css`,
`checkbox-filter.css`, `table.css`, `toast.css`, `button.css` and `tooltip.css`.
Additive treatments are `.wm-toggle-group-outline`, `.wm-stat-card-compact` and
`.wm-tooltip-right`; existing defaults and legacy aliases remain intact.
New public component sheets are `color-picker.css`, `number-stepper.css`,
`language-selector.css` and `ranked-bar-list.css` under `styles/components/`.
They are also included in the aggregate theme and use the existing tokens.
NumberStepper needs button and tooltip CSS when loading sheets individually.
Color-picker and selector styles never depend on application toolbar or game selectors.

`load-status.css` and `action-disclosure.css` provide scoped `.wm-load-status` and
`.wm-action-disclosure-*` styles for neutral loading/retry feedback and independent
header actions. They are exported under `styles/components/` and registered in the
aggregate theme. Load tokens and button CSS when importing these sheets individually;
base CSS is optional for document defaults. `load-status.css` imports `spinner.css`,
which owns `.wm-sr-only`, so help-mode announcements stay visually hidden with modular imports.
RefreshAction uses button CSS alone.
The additive `--wm-color-warning-text` token supplies readable warning text in light/dark
themes without changing the existing warning color or Button/Accordion defaults.

This package lives in `packages/ui-theme` within the [Wintermuted UI monorepo](https://github.com/wintermuted/wintermuted-ui). New monorepo tags are not directly installable as the theme through a GitHub-source npm dependency; use npm releases or a tarball produced by `npm pack --workspace=@wintermuted/ui-theme`.

## Migrating to 1.0

Version 1.0.0 removes the legacy `react`, `react/select`, and `theme` entry points, their TypeScript mappings, and all React-related peer dependencies. CSS imports and `--wm-*` tokens are unchanged. CSS-only consumers need no React packages.

React components and theme runtime helpers now come exclusively from `@wintermuted/ui-react`:

```js
import "@wintermuted/ui-theme/index.css";
import { Button, ThemeProvider } from "@wintermuted/ui-react";
import { MultiSelect } from "@wintermuted/ui-react/select";
import { initTheme } from "@wintermuted/ui-react/theme";
```

Install `@wintermuted/ui-react` and React/React DOM 18.3 or 19; add react-select 5.8 or newer only for the select adapter. See the [1.0 migration guide](https://github.com/wintermuted/wintermuted-ui/blob/main/docs/migration-to-v1.md) for installation, import mappings, test tooling, and release ordering.
