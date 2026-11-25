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
| `RefreshAction` | Required `loading`, `error`, `onRefresh(event)` and `labels: {idle,loading,retry}` accepting React nodes. Loading takes precedence and disables interaction; caller `disabled` is preserved. Composes Button with native props, styling, icons and forwarded ref; always `type="button"` and `aria-busy` reflects loading. |
| `LoadStatus` | Readonly `issues: {message,retry?}[]`, optional readonly `warnings`, `loading`, required accessible `labels: {retry,loading}`, optional `retryIcon`, `loadingIcon`, `className`, `renderHelp({message,tone})`. Idle renders nothing; errors use alert, warnings status. Help receives the exact space-joined messages and `"error"`/`"warning"` tone while the same message is announced visually hidden. Each supplied retry runs once per activation; retries disable during loading. Loading without errors gets its own status, even with warnings; loading errors retain their message without a second loading announcement. Clicks/keydown do not activate surrounding disclosures. |
| `ActionDisclosure` | Required `title` and children; optional `headingLevel` 2-6 (default 3), `headingId`, `defaultExpanded` (default true), `onCollapse()`, decorative `indicator`, `className`, `classNames: {header?,heading?,action?}`. Stable unique panel IDs; keyboard heading button toggles mounted hidden children. Optional `action: {label,icon?,buttonRef?,onClick}` is a sibling Button, never nested in the trigger. Collapse callback runs before scheduling hiding; the action schedules expansion then calls its callback. Post-render focus and domain cleanup belong to the host. |
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
| `ToggleGroup<Value>` | Controlled `value`, `onChange(value)` and typed `options` with labels, icons, swatches and disabled flags. `appearance`: segmented (default), outline, swatches (separated buttons with round color chips); `orientation`: horizontal or vertical; optional `fullWidth`. Uses canonical toggle-group CSS. |
| `FacetFilter<Value>` | Supplied `options: {value,label,count,disabled?,hidden?}[]`, `selected`, `onChange(values)`, availability and empty/expansion copy. Separate `reset: {label,count,selected,onSelect}`: `all` is an ordinary value. Callers compute counts and keep selected zero-count options enabled/visible if they should remain removable. |
| `SortableTableHeader<Key>` | Renders a `th` with `scope="col"` and `aria-sort`; do not nest it in another header. Supply `column`, `label`, `active`, `direction`, independent `onSort(column)`/`onDirection(column)`, `directionLabel` and decorative `directionIcon`. Callers sort the rows. |
| `StatCard` | `label`, optional `value` (including zero), children, `tone` and `className`. Default uses the existing centered value-first stat card. `variant="compact"` is a label-first, left-aligned metric with value-only tone. |
| `RankedBarList` | Supplied ordered `items: {id,label,value,valueLabel,color?}[]`, accessible `label`, optional `heading`, `empty`, `maximum`, and `minimumWidthPercent` (default 0). Stable unique IDs required. Widths clamp to 100%; zero maximum gives zero widths. Nonfinite/negative scales or values and minimum widths outside 0-100 throw. Callers rank and format data. |
| `Toast` | Controlled `open`, supplied `message`, optional action node, `tone` (success default), `onDismiss()` and `dismissLabel`. Hidden notices are hidden and inert; applications own dismissal timers and navigation. |
| `ColorPicker` | Controlled six-digit hex `value`, labeled `groups`/choices, `onSelect(value,groupId,index)`, `onChange(value)`, optional Enter-only `onCommit(value)`. Required `label`, `inputLabel`, `hexLabel`, `invalidLabel`; optional unique `inputId`, `disabled`, `placement` (above/right), `className`, `triggerClassName`. Supply `draftValue` and `onDraftChange` together to retain unfinished drafts across unmounts. Invalid drafts stay visible with an associated error; valid blur normalizes without firing `onCommit`. Escape, outside click and swatch selection close the popup. |
| `NumberStepper` | Finite `value` within finite `min`/`max`, positive finite `step`, `onChange(value)`, `disabled`, supplied group/button/value labels and decrease/increase icons. Integer and representable fractional steps retain numeric precision; decimal rounding removes ordinary arithmetic noise before clamping to both bounds. Invalid numeric contracts throw. Uses Button and Tooltip; optional `tooltipPlacement` above/right. |
| `LanguageSelector` | Supplied `options: {value,label,disabled?}[]`, controlled `value`/`onChange`, `label`, optional `className`, `variant` native (default) or dropup. The popup trigger's accessible name includes the selected label. Popup Arrow Up/Down, Home/End skip disabled options; enabled-option focus survives parent rerenders; Escape, Tab, outside click and selection dismiss. Callers own locale normalization and translation updates. |

These context-free controls require no providers, routing, persistence or domain state. All copy,
palette choices, filtering, rankings, formatting and notification timing belong to the application.
They are transferred from the tested staging contracts in
[Game of Life revision eef23c2](https://github.com/wintermuted/game-of-life/commit/eef23c2f3d68a52b3afadb6524c1e8b5aab212b2);
game-specific adapters were not transferred. Existing Tabs, Dialog and Menu APIs are unchanged.
Public option/props interfaces are exported from the main barrel and emitted as declarations by CI.

CI runs source behavior, generated declarations, native browser interactions and packed consumers
against React 18.3 and 19, with TypeScript bundler/NodeNext resolution and no required react-select.
The React showcase includes all nine controls with neutral invoice/department data.

### Loading and action disclosures

`LoadStatus`, `RefreshAction`, and `ActionDisclosure` were transferred from
[Overworld revision 4d9b669](https://github.com/wintermuted/overworld/commit/4d9b669cc0d10a397d0cef3e2968ed5e80066c77).
Fetching, snapshot retention, routing, time persistence, map-aware help, and application
disclosure adapters remain outside the library. Existing Accordion and Button defaults are unchanged.
Use Accordion for native details/summary and ActionDisclosure for an independent header action.
Keep `title` noninteractive; put secondary controls in `action` or the panel.

```tsx
import "@wintermuted/ui-theme/index.css";
import { ActionDisclosure, LoadStatus, RefreshAction } from "@wintermuted/ui-react";
import type { LoadIssue, LoadStatusHelp, ActionDisclosureAction } from "@wintermuted/ui-react";

const reload = () => { /* application-owned request */ };
const issues: readonly LoadIssue[] = [{ message: "Records unavailable.", retry: reload }];
const action: ActionDisclosureAction = { label: "Edit records", onClick: () => {} };
const loading = false;

<ActionDisclosure title="Record options" headingLevel={2} action={action}>
  <input aria-label="Record name" defaultValue="Quarterly report" />
  <LoadStatus issues={issues} loading={loading}
    labels={{ retry: "Retry records", loading: "Loading records" }} />
</ActionDisclosure>;
<RefreshAction loading={loading} error={issues.length > 0} onRefresh={reload}
  labels={{ idle: "Update records", loading: "Updating records", retry: "Retry records" }} />;
```

Optional help can compose the existing Tooltip and Button with a supplied accessible name.
Interactive or map-positioned help remains host-owned. In either case, the help renderer gets
`LoadStatusHelp` with the exact combined message and tone. CSS is explicitly loaded from the theme;
no CSS imports, ambient Vite types, or handwritten CSS declarations enter the React package.
CI generates and checks all public declarations and packed React 18/19 consumers.

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
