# Migrating to 1.0

`@wintermuted/ui-theme` 1.0.0 is a CSS-only package with no React dependencies or peers. React components, select integration, and theme runtime helpers move exclusively to `@wintermuted/ui-react` 1.0.0. This is a breaking change for applications importing the old theme JavaScript entry points.

For the package boundaries behind this change, see [Architecture](architecture.md). Maintainers should follow the [release runbook](releases.md) before announcing availability.

**Release ordering:** wait until both 1.0.0 packages are published before upgrading a React application. Do not upgrade only the theme while retaining its old React imports. Until then, keep the existing 0.x theme version.

## CSS-only applications

Update the dependency:

```sh
npm install @wintermuted/ui-theme@^1.0.0
```

Keep existing CSS imports, class names, and `--wm-*` tokens unchanged:

```js
import "@wintermuted/ui-theme";
// Or:
import "@wintermuted/ui-theme/index.css";
import "@wintermuted/ui-theme/styles/tokens.css";
```

The root remains a CSS-loading JavaScript entry for bundlers. All stylesheet subpaths remain available. Plain HTML can continue loading the CSS directly. React is not required or installed by the theme.

Remove React dependencies only if nothing else in your application uses them.

## React applications

Install both packages in the same dependency update, retaining your existing compatible React versions:

```sh
npm install @wintermuted/ui-theme@^1.0.0 @wintermuted/ui-react@^1.0.0
```

The React package depends on theme 1.x. Keep the theme as a direct dependency when your application imports its styles. React and React DOM 18.3 or 19 are peers of `ui-react`; install them if absent. The `react-select` 5.8+ peer is optional and needed only for `MultiSelect`:

```sh
npm install react@^19 react-dom@^19
npm install react-select@^5.8.0
```

Replace module paths everywhere, including tests, mocks, dynamic imports, declaration imports, SSR scripts, and build/test configuration:

| Removed theme import | Replacement |
| --- | --- |
| `@wintermuted/ui-theme/react` | `@wintermuted/ui-react` |
| `@wintermuted/ui-theme/react/select` | `@wintermuted/ui-react/select` |
| `@wintermuted/ui-theme/theme` | `@wintermuted/ui-react/theme` |

CSS imports stay on `ui-theme`. Do not replace every occurrence of the package name indiscriminately. The removed paths have no forwarding shims or legacy TypeScript mappings; they fail package export resolution in 1.0.

### Before

```js
import "@wintermuted/ui-theme/index.css";
import { Button, ThemeProvider, ThemeSelect } from "@wintermuted/ui-theme/react";
import { MultiSelect } from "@wintermuted/ui-theme/react/select";
import { initTheme, getThemeScript } from "@wintermuted/ui-theme/theme";
```

### After

```js
import "@wintermuted/ui-theme/index.css";
import { Button, ThemeProvider, ThemeSelect } from "@wintermuted/ui-react";
import { MultiSelect } from "@wintermuted/ui-react/select";
import { initTheme, getThemeScript } from "@wintermuted/ui-react/theme";
```

Component APIs, native props/refs, select option inference, CSS styling, and theme behavior are unchanged. Continue calling `initTheme` before client rendering and passing the same storage key to `ThemeProvider`. For SSR, retain `getThemeScript`, its CSP nonce, and its position before styles. The `/theme` helper itself remains React-free, but now belongs to the React integration package.

### Build and test tooling

Both packages use ESM; React declarations are provided by `ui-react`. Update any aliases or transform allowlists referencing the removed theme paths. For Jest/Babel setups that transform ESM dependencies:

```json
{
  "transformIgnorePatterns": [
    "node_modules/(?!@wintermuted/ui-(?:theme|react)/)"
  ]
}
```

Existing Vite and Webpack CSS loading remains unchanged. Do not alias the removed paths back into the theme package.

### Monorepos and local linking

Declare `ui-react` in each workspace that imports its JavaScript. Shared React libraries should declare appropriate peers or dependencies on `ui-react`, rather than relying on another workspace's installation.

The repository's `link:local` helper links only the CSS theme. To test React changes in an external consumer, also link the React workspace from the monorepo root:

```sh
npm link --workspace=@wintermuted/ui-react
```

Then, from the consumer:

```sh
npm link @wintermuted/ui-theme @wintermuted/ui-react
```

Keep React itself shared with the consumer to avoid duplicate React instances. Restore published dependencies with `npm unlink --no-save @wintermuted/ui-theme @wintermuted/ui-react` followed by `npm install`.

## Overworld migration scope

The account-wide default-branch search identified `wintermuted/overworld` as the external user of the removed entry points. It found React/select imports in 82 application/component files and six tests, plus theme helpers in app bootstrap and a theme bootstrap test. These counts are a migration snapshot, not a permanent inventory.

Update `packages/applications/go-by-transit` and `packages/presentation/ui`, their manifests, and `docs/design-system.md`. In particular:

- Move `ThemeProvider` in the application shell to `ui-react`.
- Move `MultiSelect` imports to `ui-react/select`.
- Move `initTheme` and the test's `getThemeScript` import to `ui-react/theme`.
- Keep stylesheet imports on `ui-theme`.
- Update the root lockfile and any ESM transform configuration.

No changes to Overworld are included in this package release.

## Verification and rollback

Search for remaining imports:

```sh
rg '@wintermuted/ui-theme/(react|theme)' .
```

Historical documentation may retain before examples, but executable code must not use these paths. Run the consumer's existing component, select, theme-bootstrap, and SSR tests; verify light/dark/system preferences and run its build/type checks in CI.

If migration fails, revert the import/configuration changes and restore the previous theme version and lockfile together. Do not downgrade only the theme while keeping a 1.x React package, which requires theme 1.x.

## Maintainer release notes

Nx Release owns the versions: this split sets both manifests to 1.0.0 using Nx's version command, without publishing locally. The merge commit must preserve `feat!` or a `BREAKING CHANGE:` footer so automated release preparation selects the major theme bump and first stable React release.

Both packages are selected for independent release. The workflow stages React after version preparation, publishes the packages before pushing their tags, and dispatches theme bumps only when the theme changed. Configure npm trusted publishing for the new `@wintermuted/ui-react` package or authorize the workflow's token fallback for both packages. An npm publication cannot be rolled back atomically; if one package publishes and the other fails, recover publication before asking consumers to migrate.
