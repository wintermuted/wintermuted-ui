# @wintermuted/ui-react-select

Theme-aware react-select components, published independently from the core
`@wintermuted/ui-react` components. Native `Select` remains in ui-react.

```sh
npm install @wintermuted/ui-react-select react react-dom react-select
```

```tsx
import "@wintermuted/ui-theme/index.css";
import { MultiSelect } from "@wintermuted/ui-react-select";
import type { MultiSelectProps } from "@wintermuted/ui-react-select";

const options = [{ value: "main", label: "Main Street" }];
const props: MultiSelectProps<(typeof options)[number]> = { options };
export const stops = <MultiSelect {...props} aria-label="Stops" />;
```

React 18/19, React DOM, and react-select 5 are required peers. The package depends
on ui-theme but never injects CSS or bundles peers. No ui-react installation is
required to use MultiSelect.

## MultiSelect

MultiSelect forwards react-select props and preserves typed options, groups,
callbacks, custom components, and refs exposed through those props. It defaults
to multi-value selection; pass `isMulti={false}` for single selection. Supply an
accessible label through `aria-label`, `aria-labelledby`, or an associated label
and `inputId`. `inputId` takes precedence over the fallback `id`.

The adapter provides a stable generated instance ID, the `wm-search-select` class,
and CSS-variable styles that follow Wintermuted theme changes, including open
menus. Consumer `styles` overrides are merged over the theme styles. Explicit
`instanceId`, `className`, and other react-select props remain supported.

## Migration and packaging

Replace imports from the removed `@wintermuted/ui-react/select` entry point with
`@wintermuted/ui-react-select`, and install the new package and its required peers.
Core ui-react no longer declares any react-select dependency or peer.

Canonical source lives in `src/components/MultiSelect.tsx`; the package root is a
re-export-only barrel. Nx compiles JavaScript and generated declarations into
`dist/packages/ui-react-select`. Source workspace packing is blocked; use the
compiled package. Nx Release publishes independent `ui-react-select@X.Y.Z`
releases, starting at 0.1.0. Configure npm trusted publishing for this package on
the Auto Release workflow, or authorize the existing `NPM_TOKEN` fallback.
