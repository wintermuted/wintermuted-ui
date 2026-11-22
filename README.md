# `@wintermuted/ui-theme`

Shared design tokens and base component styles for Wintermuted projects.

The package is derived from the styling language introduced in the CV project and extracts the reusable parts of that system so application repositories can depend on a single source of truth instead of copying CSS.

## Install

### npmjs

```bash
npm install @wintermuted/ui-theme
```

### GitHub repository release

If you prefer to consume the package directly from GitHub without GitHub Packages auth, install from a tagged release:

```bash
npm install github:wintermuted/wintermuted-ui#v0.1.0
```

## Includes

- Core color, spacing, radius, shadow, and typography tokens
- Base document and form-control styling
- Shared surface, button, badge, tag, list, separator, and side-nav primitives
- Light and dark theme variables via `[data-theme="dark"]`

## Usage

### Full Theme (single import)

```ts
import "@wintermuted/ui-theme";
```

Then use the exported CSS variables in application styles:

```css
.app-shell {
  color: var(--wm-color-text);
  background: var(--wm-color-surface);
  border: 1px solid var(--wm-color-border);
}
```

### Modular Imports (factor by need)

Import only the slices you need. Most component files require tokens, and many apps also want base element styles.

```ts
import "@wintermuted/ui-theme/styles/tokens.css";
import "@wintermuted/ui-theme/styles/base.css";
import "@wintermuted/ui-theme/styles/components/button.css";
import "@wintermuted/ui-theme/styles/components/card.css";
```

Available modular entry points:

- `@wintermuted/ui-theme/styles/tokens.css`
- `@wintermuted/ui-theme/styles/base.css`
- `@wintermuted/ui-theme/styles/components.css` (all components)
- `@wintermuted/ui-theme/styles/components/button.css`
- `@wintermuted/ui-theme/styles/components/card.css`
- `@wintermuted/ui-theme/styles/components/badge.css`
- `@wintermuted/ui-theme/styles/components/tag.css`
- `@wintermuted/ui-theme/styles/components/list.css`
- `@wintermuted/ui-theme/styles/components/separator.css`
- `@wintermuted/ui-theme/styles/components/side-nav.css`


## Static Design System Test Page

This repo includes a static showcase app for validating common component scenarios.

The optional React examples run through the local Vite development server; the existing HTML pages stay static.

```bash
npm run showcase:serve
```

Then open `http://localhost:4174/showcase/`.

### GitHub Copilot app

Review and accept `.github/github-app.yml` when prompted by the app. Node.js 22
and npm must be available locally.

The **Install dependencies** script runs `npm ci --no-audit --no-fund` when a
session is created and can also be rerun manually. **Run showcase** starts the
existing Vite development server on port 4174.

Open `http://127.0.0.1:4174/showcase/` to view the documentation and React examples.
Automatic browser opening is disabled because Vite reports the repository root
URL, while the showcase lives under `/showcase/`. Stop the run script before
starting the showcase in another session, since the server requires port 4174.

Helpful local viewing scripts:

```bash
npm run showcase:open
npm run showcase:open:sample-data
npm run showcase:open:forms
```

The showcase includes:

- Light and dark theme toggle
- Buttons, badges, cards, and alerts
- Form controls and focus states
- A representative data table
- A sample-data page that renders stats, chart bars, and table rows from one dataset

Files:

- `showcase/index.html`
- `showcase/sample-data.html`
- `showcase/showcase.css`

## GitHub Pages Deployments

The showcase is deployed with a preview/main pattern:

- Pushes to `main` publish production content to the root Pages site.
- Pull requests to `main` publish isolated previews under `previews/pr-<number>/showcase/`.
- Closing a pull request removes its preview folder from `gh-pages`.

Workflows:

- `.github/workflows/deploy-showcase-pages.yml`
- `.github/workflows/cleanup-showcase-preview.yml`

## Local Symlink Workflow (No Publish Step)

Use npm link to symlink this theme into local consuming apps so style changes appear immediately.

From this repo:

```bash
npm run link:local -- <consumer-path> [consumer-path-2 ...]
```

Workspace example:

```bash
npm run link:local -- ../sub-killer ../cv
```

When done testing, revert consumers back to normal package resolution:

```bash
npm run unlink:local -- ../sub-killer ../cv
```

Scripts:

- `scripts/link-local.sh`
- `scripts/unlink-local.sh`
## Publishing

- Merges to main trigger auto-release, which bumps the minor version in package.json, creates a matching vX.Y.Z tag, and creates a GitHub release.
- Tag pushes matching v* trigger the publish workflow, which publishes to npmjs using npm provenance.
- Set the NPM_TOKEN repository secret with an npm automation token before running the workflow.

## Notes

- The package intentionally avoids application-specific layout opinions.
- Projects should keep product-specific selectors and layout rules in their own repositories.
- Publishing is handled through GitHub Actions to npmjs.

## Optional React components

The CSS/root entry points are unchanged and do not load or install React. Install React
and ReactDOM 18.3+ (or 19) only for the React API. Add react-select 5.8+ only when using
the separate select adapter:

```powershell
npm install @wintermuted/ui-theme react react-dom
npm install react-select
```

```tsx
import "@wintermuted/ui-theme/index.css";
import { createRoot } from "react-dom/client";
import {
  Button, Card, CardHeader, CardTitle, CardBody, CardText, FieldGroup,
  Input, ThemeProvider, ThemeSelect,
} from "@wintermuted/ui-theme/react";
import { initTheme } from "@wintermuted/ui-theme/theme";

initTheme({ storageKey: "my-app:theme" });
createRoot(document.getElementById("root")!).render(
  <ThemeProvider storageKey="my-app:theme">
    <ThemeSelect />
    <Card>
      <CardHeader><CardTitle>Departures</CardTitle></CardHeader>
      <CardBody>
        <CardText>Select stops to see arrivals.</CardText>
        <FieldGroup label="Stop name" hint="Enter part of a name."><Input /></FieldGroup>
        <Button onClick={refresh}>Refresh arrivals</Button>
      </CardBody>
    </Card>
  </ThemeProvider>
);
```

These are distributable ES modules, not TSX source, with separate declaration files.
No application compiler needs to transpile JSX inside this package. React is never bundled.
The `typesVersions` entries support TypeScript 4.9's legacy `moduleResolution: node`;
conditional exports support newer resolvers. CI checks packed-package React 18,
TypeScript 7/bundler, Vite 8 and Webpack 5 consumers, plus CSS-only installation without peers.
For CRA 5/Jest consumers, allow this ESM package through Babel's dependency transform:

```json
{
  "jest": {
    "transformIgnorePatterns": ["node_modules/(?!@wintermuted/ui-theme/)"]
  }
}
```

### Component contracts

All components come from `@wintermuted/ui-theme/react` except `MultiSelect`.
Primitives preserve native attributes, `className`, `style`, children and refs.

| Export | Contract |
| --- | --- |
| `Button` | Native button; defaults to `type="button"`. `variant`: primary, secondary, ghost, danger, success, warning, link. Optional `size="sm"` and decorative `icon`. Supply an accessible name for icon-only buttons. |
| `Badge`, `Alert` | `tone`: neutral, info, success, warning, danger. Alert defaults to `role="status"`; opt into `role="alert"` for urgent messages. |
| `Card`, `CardHeader`, `CardBody`, `CardTitle`, `CardText`, `CardFooter` | Semantic section/header/div/h3/p/footer slots; `as` selects an element or custom component. |
| `ListGroup`, `ListItem`, `Nav` | Semantic ul/li/nav; `as` supports other elements or router links without a router dependency. Label navigation regions and use `aria-current="page"` on active links. Compose grid/flex layout in your application. |
| `Input`, `Select` | Native input/select attributes and refs, including controlled or default values. Select takes native option children. |
| `FieldGroup` | Required `label` and one control element; optional `htmlFor`, `hint`, `error`. Generates IDs and merges `aria-describedby`; errors set `aria-invalid`. Custom controls must forward the supplied ID/ARIA props to their input. |
| `Table` | Native table attributes/ref, optional `responsive` overflow region. Provide a caption or `aria-label`, and native thead/tbody/th scope markup. |
| `Spinner` | `label` defaults to Loading; status text stays available with reduced motion. |
| `ProgressBar` | Native progress element, numeric `value`/`max` (defaults 0/100), accessible `label` or native label/ARIA association. Values clamp to range; nonfinite inputs or nonpositive max throw. |
| `Accordion` | Native details attributes with `title` as summary; supports `open`, `onToggle` and normal keyboard behavior. |
| `Tabs` | Required `label` and `items: {id,label,content,disabled?}[]`; optional controlled `value`, uncontrolled `defaultValue`, `onValueChange(id)`. Unique stable IDs required. Arrow Left/Right, Home/End skip disabled tabs. Inactive panels stay mounted and hidden. |
| `Menu` | `label` trigger; `items: {id,label,onSelect?,href?,disabled?}[]`. Arrow Up/Down, Home/End, Escape and Tab; closes on selection, outside click or focus leaving. For router navigation use `onSelect` or compose ordinary links in Nav. |
| `Tooltip` | `text` and one focusable element child that forwards ARIA props. Visible on focus/hover, Escape dismisses, descriptions are merged. Do not put interactive content in tooltips or use a tooltip as the only accessible name. |
| `Dialog` | Required controlled `open`, `onClose()` and `title`. Uses native `dialog.showModal()` for top-layer modality and Escape, plus explicit Tab/Shift+Tab wrapping. Focus returns to the opener on close/unmount. Caller must set open=false in onClose. Native dialog-capable browsers required; no silent non-modal fallback. |
| `ThemeProvider`, `useTheme`, `ThemeSelect` | See theme preferences below. |

### Searchable select

```tsx
import { MultiSelect } from "@wintermuted/ui-theme/react/select";

const options = [{ value: 1, label: "North at Main", stop: { id: 1 } }];
<MultiSelect
  options={options}
  defaultValue={[options[0]]}
  onChange={values => values.map(option => option.stop.id)}
/>;
```

The adapter preserves react-select `Props<Option, IsMulti, Group>` inference, option objects,
`defaultValue`, `value`, `onChange`, formatted labels, menu portals and callbacks. `isMulti`
defaults to true; set `isMulti={false}` for a single value. `styles` overrides merge over
token-based defaults; application-specific behavior remains in the application. Provide
an accessible name with `aria-label`, `inputId` plus a label, or `FieldGroup`.
Portals inherit document-level theme tokens; nested scoped themes need a portal target
inside that scope.

### Theme preferences

`useTheme()` returns `{ preference, setPreference, resolvedTheme }`. Preference is
`"system" | "light" | "dark"` and defaults to System. Overrides persist under
`wintermuted:theme` by default; pass a namespaced `storageKey` to both initialization
and provider to isolate applications. Returning to System follows OS changes immediately.
Cross-tab storage changes synchronize. Storage failures warn explicitly while the current
selection still works in memory.

For client rendering, call `initTheme({ storageKey })` from the React-free
`@wintermuted/ui-theme/theme` entry **before mounting React**. For SSR or first paint of
server HTML, emit `getThemeScript(storageKey)` in a synchronous inline `<head>` script
before styles, with the appropriate CSP nonce. Never interpolate an unsanitized key into
your own script. The helper safely escapes `<` in serialized keys. Hydration markup should
not branch on the client preference on the server; theme-dependent UI should render after
mount. Importing the React-free helper on the server is safe.

Only `document.documentElement.dataset.theme` and `style.colorScheme` are updated.
Map styles, tile sources, transit data and application state are not changed.
Use one document-level ThemeProvider per app. `ThemeSelect` defaults to label Appearance
with System, Light and Dark options and must be inside a provider.

### Development and release

Development uses React/ReactDOM 19 and matching React 19 types; the optional peer ranges
and packed-consumer checks retain React 18.3 compatibility.
TypeScript 7, Vite 8, and JSDOM 31 are the development baseline. Volta pins Node 22.23.5;
JSDOM and Stylelint 18 require Node 22.22.2+, 24.15+, or 26+. Older TypeScript/Vite
versions are no longer included in the consumer checks.

Run `npm test` for DOM behavior/package contracts and `npm run test:browser` for native
Chromium keyboard/focus/theme checks (`npx playwright install chromium` once if needed).
Open `/showcase/react.html` with `npm run showcase:serve` for live examples.
CI alone runs builds/type checks via `npm run test:consumers` and bundles the React
showcase for Pages. Existing CSS pages are copied unchanged alongside it.
Publication is still the automated release process; an unpublished source tarball with
unchanged version metadata is an integration artifact, not proof that the registry version
has these APIs. Do not commit machine-local tarball dependencies to consumers.
