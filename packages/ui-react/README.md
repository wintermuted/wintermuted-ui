# `@wintermuted/ui-react`

React components for Wintermuted UI: native primitives, accessible interactions, theme helpers, and an optional react-select integration. Components are authored in typed TSX; the published package contains compiled JavaScript and generated TypeScript declarations.

The patch release following the typed TSX migration delivers the migrated source as compiled ESM and generated declarations, without changing the public entry points or bundling React.

See the [React architecture guide](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/docs/architecture.md) for entry-point isolation, interaction ownership, theme synchronization, declarations, and packaging.

```js
import "@wintermuted/ui-theme";
import { Button, ThemeProvider } from "@wintermuted/ui-react";
import { MultiSelect } from "@wintermuted/ui-react/select";
import { initTheme } from "@wintermuted/ui-react/theme";
```

Consumers load the theme explicitly; React components do not inject global styles. React/React DOM 18.3 or 19 are peers. Install react-select only when using the `select` entry point.

Starting with 1.0.0, this is the standalone home for all Wintermuted React components and theme runtime helpers. It depends on `@wintermuted/ui-theme` 1.x; the CSS-only theme has no dependency on this package or React. Nx Release publishes both packages with independent versions.

The `build` target compiles TypeScript/TSX to ESM and generates declarations in `dist/packages/ui-react`, alongside the manifest, README, and license. It does not bundle React or other peers. `npx nx pack ui-react` packs that output. A source-only `prepack` guard rejects direct packing or publishing of the TSX workspace; staging removes the guard from the compiled npm package. CI checks source types and packed consumers with bundler/NodeNext resolution and with/without the optional react-select peer.

The old theme package's `react`, `react/select`, and `theme` exports were removed in 1.0.0. See the [migration guide](https://github.com/wintermuted/wintermuted-ui/blob/main/docs/migration-to-v1.md).

```sh
npm install @wintermuted/ui-react@^1.0.0 @wintermuted/ui-theme@^1.0.0 react react-dom
# Only for MultiSelect:
npm install react-select
```

## Usage

```tsx
import "@wintermuted/ui-theme/index.css";
import { createRoot } from "react-dom/client";
import {
  Button, Card, CardHeader, CardTitle, CardBody, CardText, FieldGroup,
  Input, ThemeProvider, ThemeSelect,
} from "@wintermuted/ui-react";
import { initTheme } from "@wintermuted/ui-react/theme";

initTheme({ storageKey: "my-app:theme" });
createRoot(document.getElementById("root")!).render(
  <ThemeProvider storageKey="my-app:theme">
    <ThemeSelect />
    <Card>
      <CardHeader><CardTitle>Departures</CardTitle></CardHeader>
      <CardBody>
        <CardText>Select stops to see arrivals.</CardText>
        <FieldGroup label="Stop name" hint="Enter part of a name."><Input /></FieldGroup>
        <Button onClick={() => console.log("Refresh")}>Refresh arrivals</Button>
      </CardBody>
    </Card>
  </ThemeProvider>
);
```

Published entry points are distributable ES modules, not TSX source. Conditional exports and legacy `typesVersions` mappings point to generated declarations. Workspace entry points resolve directly to TypeScript/TSX for Vite development. CI checks React 18 packed consumers with TypeScript 7/bundler, Vite 8, and Webpack 5. CRA/Jest consumers should allow the ESM packages through Babel's dependency transform:

```json
{
  "jest": {
    "transformIgnorePatterns": ["node_modules/(?!@wintermuted/ui-(?:theme|react)/)"]
  }
}
```

## Component contracts

All components come from `@wintermuted/ui-react` except `MultiSelect`. Primitives preserve native attributes, `className`, `style`, children, and refs.

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

## Searchable select

```tsx
import { MultiSelect } from "@wintermuted/ui-react/select";

const options = [{ value: 1, label: "North at Main", stop: { id: 1 } }];
<MultiSelect
  options={options}
  defaultValue={[options[0]]}
  onChange={values => values.map(option => option.stop.id)}
/>;
```

The adapter preserves react-select `Props<Option, IsMulti, Group>` inference, option objects, `defaultValue`, `value`, `onChange`, formatted labels, menu portals, and callbacks. `isMulti` defaults to true; set `isMulti={false}` for a single value. `styles` overrides merge over token-based defaults. Provide an accessible name with `aria-label`, `inputId` plus a label, or `FieldGroup`. Portals inherit document-level theme tokens; nested scoped themes need a portal target inside that scope.

## Theme preferences and SSR

`useTheme()` returns `{ preference, setPreference, resolvedTheme }`. Preference is `"system" | "light" | "dark"` and defaults to System. Overrides persist under `wintermuted:theme` by default; pass a namespaced `storageKey` to both initialization and provider to isolate applications. Returning to System follows OS changes immediately. Cross-tab storage changes synchronize. Storage failures warn explicitly while the current selection still works in memory.

For client rendering, call `initTheme({ storageKey })` from the React-free `@wintermuted/ui-react/theme` entry before mounting React. For SSR or first paint of server HTML, emit `getThemeScript(storageKey)` in a synchronous inline head script before styles, with the appropriate CSP nonce. The helper safely escapes `<` in serialized keys; never interpolate an unsanitized key into your own script.

Hydration markup should not branch on the client preference on the server; theme-dependent UI should render after mount. Importing the React-free helper on the server is safe. Only `document.documentElement.dataset.theme` and `style.colorScheme` are updated; map styles, tile sources, and application state are unchanged. Use one document-level provider per app. `ThemeSelect` defaults to label Appearance with System, Light, and Dark options and must be inside a provider.
