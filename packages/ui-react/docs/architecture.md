# React package architecture

`@wintermuted/ui-react` adds React behavior to the shared CSS theme: native primitives, accessible interactions, an optional select adapter, and theme preference helpers. It depends on `ui-theme`; the theme does not depend on it.

For public props and usage, see the [package README](../README.md). For broader relationships and publication, see the [monorepo architecture](../../../docs/architecture.md) and [release runbook](../../../docs/releases.md).

## Source and entry-point boundaries

```text
ui-react/
  src/
    index.js / index.d.ts     Components and React theme context
    select.js / select.d.ts   Optional react-select integration
    theme.js / theme.d.ts     React-free runtime theme helpers
  package.json               Exports, peers, theme dependency, Nx targets
  tsconfig.json              Strict declaration validation without emission
  docs/architecture.md       Repository-only implementation guide
```

JavaScript and declarations are hand-authored source, not generated TSX output.

```mermaid
flowchart LR
    App["React application"] -->|"components"| Index["ui-react"]
    App -->|"optional adapter"| Select["ui-react/select"]
    App -->|"bootstrap / SSR"| Theme["ui-react/theme"]
    App -->|"explicit CSS import"| CSS["ui-theme"]
    Index --> Theme
    Index --> React["React peer"]
    Select --> React
    Select --> Adapter["react-select optional peer"]
```

The main entry must not import or re-export the select adapter. Ordinary components should remain usable without installing react-select.

`theme.js` imports no React and is safe to import on the server. That describes this entry point's runtime implementation, not the package's dependency metadata: installing the React integration still brings its theme dependency and React peer requirements.

## Rendering and style ownership

The package uses React's `createElement` rather than JSX source requiring consumer compilation. The main module aliases it as `h`.

The internal `primitive` helper uses `forwardRef`, a default semantic tag, an optional `as` override, and shared CSS classes. Card slots, lists, navigation, and native controls preserve native attributes and compose a caller's `className` with the required `.wm-*` class.

Specialized components add behavior or variants while retaining native contracts. For example, Button defaults to `type="button"` to avoid accidental form submission. Consumer routing, data fetching, map state, and layout frameworks stay outside the package.

Components do not inject global CSS or bundle theme styles. The consumer explicitly imports `ui-theme`, keeping stylesheet loading and cascade control in the application.

## Interaction ownership

| Component | Implementation responsibility | Consumer responsibility |
| --- | --- | --- |
| `FieldGroup` | Generate/control IDs, link labels and descriptions, merge existing `aria-describedby`, mark errors | Supply one control that forwards the provided ID/ARIA props and meaningful label/error text |
| `Tabs` | Controlled/uncontrolled selection, enabled-item keyboard navigation, tab/panel ARIA relationships, roving focus | Supply stable unique item IDs, labels, and content |
| `Menu` | Keyboard movement, focus, dismissal, and selection callbacks | Supply actions/links and application effects |
| `Tooltip` | Focus/hover description and dismissal | Supply a focusable child forwarding ARIA and keep content noninteractive |
| `Dialog` | Native modal activation, focus containment, dismissal requests, focus restoration | Own `open`, update it in `onClose`, and provide a title |
| `Accordion` | Compose native details/summary semantics | Own content and any application-controlled state |

Tabs keep inactive panels mounted and hide them rather than destroying their contents. Controlled selection leaves the value update to the caller.

Dialog uses the browser's `showModal()` top layer, not a custom non-modal overlay. Its effect cleanup handles closing and restoration after React's commit-time focus handling, including unmount and StrictMode replay. Focus containment respects visible enabled controls and radio-group tab stops. Preserve these lifecycle details when changing the component.

The package uses a client layout effect with a server-side effect alternative. Import safety does not imply every interactive component can run browser APIs on a server.

## Theme preferences

`theme.js` owns preference validation, persisted reads, system resolution, document updates, client initialization, and the synchronous SSR bootstrap script. `ThemeProvider` owns React state and synchronization.

```mermaid
flowchart TD
    Stored["Persisted preference"] --> Read["readThemePreference"]
    Read --> Resolve["resolveTheme"]
    OS["OS color-scheme preference"] --> Resolve
    Resolve --> Apply["applyTheme: data-theme + color-scheme"]
    Choice["ThemeSelect / setPreference"] --> Provider["ThemeProvider"]
    Storage["Cross-tab storage event"] --> Provider
    System["OS preference change event"] --> Provider
    Provider --> Apply
```

Preferences are `system`, `light`, and `dark`; resolved appearance is `light` or `dark`. The provider initializes from storage, subscribes to OS/storage changes, and cleans up those listeners when unmounted or when its storage key changes.

Invalid values passed to `setPreference` throw. Storage read/write failures warn explicitly; a failed save still allows the current provider to update in memory. `useTheme` throws outside a provider rather than supplying an implicit context.

Use one document-level provider per application. A custom `storageKey` must match client/SSR initialization and provider configuration.

For client startup, call `initTheme({ storageKey })` before mounting. For SSR first paint, emit `getThemeScript(storageKey)` before styles and apply the application's CSP nonce. The script escapes `<` in serialized keys and stays self-contained. Do not replace it with unsanitized interpolation or make hydration markup depend on a client-only preference during server rendering.

## Optional searchable select

`select.js` wraps react-select rather than recreating its option/state model. It forwards remaining props, defaults `isMulti` to true, supplies generated instance IDs, maps a supplied control ID, and composes the shared search-select class.

Style functions refer to `--wm-*` custom properties so an already-open menu reflects theme changes. Consumer style overrides merge through react-select's `mergeStyles`.

Keep option objects, callbacks, formatting, controlled/default values, and portal props intact. The declaration's `Option`, `IsMulti`, and `Group` generics preserve react-select inference; do not collapse them into an untyped wrapper.

Portaled menus inherit variables from their actual DOM location. A nested scoped theme needs a portal target inside that scope if it must retain scoped values. The adapter cannot infer that application layout decision.

## Declaration contract

Every public JavaScript entry has a matching `.d.ts` file. Conditional package exports select those declarations; `typesVersions` provides additional subpath mappings.

The main declarations model native prop/ref forwarding and polymorphic `as` elements. Select declarations reuse upstream react-select types. Theme declarations distinguish preference from resolved appearance.

Runtime and declarations must change together. Adding a JavaScript export without a declaration, or documenting a prop the implementation does not forward, breaks the public contract.

`tsconfig.json` validates declarations strictly with no emitted output. CI also exercises packed consumer resolution and inference, not just declarations inside the workspace.

## Packaging and release

The Nx build target runs `scripts/stage-react.mjs`. It copies `src`, README, and license to `dist/packages/ui-react`, writes the current source manifest there, and removes Nx-only metadata. It does not transpile or bundle React.

Nx packing/publication uses that staged output. Direct workspace packing uses the source manifest and its `files` list. The consumer checks exercise the source-packed package; the release workflow stages again after version preparation so publication uses current version/dependency metadata.

React and React DOM are peers. react-select is an optional peer. The theme is a normal package dependency, but applications importing its CSS should also declare it directly.

Architecture docs are repository-only under the current packaging configuration. The package README links to this guide on GitHub rather than assuming it exists in the npm tarball.

Independent React changes can release without changing the theme. Theme releases may require a dependent React range/version update; see the release runbook. Never restore removed `ui-theme/react` paths as a second implementation.

## Extending safely

1. Choose the main, select, or theme entry according to its dependency boundary.
2. Reuse primitives and existing ID/focus/theme helpers rather than duplicating behavior.
3. Add JavaScript and declarations together, preserving native props, refs, and controlled-state ownership.
4. Keep presentation in the theme and update shared class/variant contracts there when required.
5. Add focused behavior cases to the existing React tests, update the showcase, and document the public contract.

`tests/react.test.js` covers interaction and theme behavior. Packed checks cover CSS isolation, React 18 server imports, separate adapter/helper paths, and CI TypeScript/Vite/Webpack consumers. Browser tests protect native interaction behavior that a DOM emulator cannot fully prove.

Leave lint, typecheck, and builds to CI. Release-breaking API changes need a migration guide and a breaking conventional-commit marker.
