# Storybook

Private React component development and interactive documentation alongside the [showcase](../showcase/README.md). Stories consume the canonical workspace exports and theme CSS; they do not copy components or change published package contents.

## Development

Install dependencies from the repository root with `npm ci`, then run:

```sh
npm run storybook:serve
```

Open `http://127.0.0.1:6006`. The port is fixed and Storybook does not open a browser automatically. Stop the server before starting a second instance. The existing showcase continues independently on port 4174.

Use the theme toolbar to select light or dark. This applies the existing theme runtime to the preview document, including native dialogs and select menus, without reading or changing saved consumer theme preferences. It does not theme the Storybook manager. ThemeProvider and ThemeSelect examples use a story-specific `wintermuted:storybook:` storage key and mirror their selected appearance in the toolbar.

## Component coverage

All 35 public React components are represented across 29 component groups. Card's six primitives share one Docs page and named slot examples; ListGroup and ListItem are documented together. The ThemeProvider example also demonstrates the `useTheme` hook.

The sidebar organizes component pages into Actions, Forms, Layout, Navigation, Data display, Feedback, Overlays, and Theming. Components are alphabetical within each section. Explicit component IDs preserve existing story and Docs links when sidebar titles change.

| Component | Examples and interactions |
| --- | --- |
| Button | Variants, small size, disabled state, and click actions |
| Accordion | Native disclosure and initially expanded content |
| Alert, Badge | Semantic tones, status, warning, and error content |
| Card, CardHeader, CardBody, CardTitle, CardText, CardFooter | Complete composition and individual slot examples |
| ListGroup, ListItem | Native and ordered lists, plus an item with status |
| Nav | Active-section links without leaving Storybook |
| Input | Labeled native input with synchronized value controls |
| Select | Controlled native selection, disabled control, and unavailable option |
| FieldGroup | Associated label, hint, validation error, and disabled input |
| Spinner, ProgressBar | Accessible loading announcement, empty and completed progress |
| Table, SortableTableHeader | Semantic table, empty state, and working row sorting |
| Tabs | Controlled selection, keyboard navigation, and a disabled item |
| Menu, Tooltip | Keyboard navigation, dismissal, focus, and placement |
| Dialog | Native modal with an opening trigger, close/Escape handling, and focus restoration |
| MultiSelect | Labeled typed options, selection, and disabled state via the optional select entry point |
| ToggleGroup | Segmented, outline, vertical, swatch, and disabled states |
| FacetFilter | Selection, reset, hidden/disabled options, and unavailable state |
| StatCard, RankedBarList | Compact metrics, zero values, ranked sample data, and empty state |
| Toast | Dismissal, reopening, hidden state, and optional action |
| ColorPicker | Presets, custom hex validation, placement, and disabled editing |
| NumberStepper | Fractional stepping, disabled state, and range boundaries |
| LanguageSelector | Native/dropup selection, empty options, and unavailable state |
| ThemeProvider, ThemeSelect | Real context, appearance selection, and isolated persistence |

Use Canvas for isolated development, Docs for generated component documentation, Controls to edit props, and Actions to inspect callbacks. Dialog, Toast, and theme-context examples use iframes in Docs to isolate modal/fixed content and document-wide theme effects.

The Accessibility panel provides manual inspection, not an automated accessibility gate. Existing unit, native browser, and packed-consumer tests remain the regression suite. Automated story interaction tests, visual regression services, and CSS-only examples are deferred.

## Adding stories

Add a typed `*.stories.tsx` file under `src/stories` with a `Components/<section>/<Component>` title and stable `components-<component>` ID. Reuse an existing sidebar section when it fits. Import components from `@wintermuted/ui-react`, MultiSelect from `@wintermuted/ui-react/select`, and theme helpers from `@wintermuted/ui-react/theme`.

Use typed CSF metadata (`satisfies Meta<...>`) and `StoryObj`, supply accessible labels, and add explicit controls for props that docgen cannot infer from primitive wrappers or generic components. Use `useArgs` from `storybook/preview-api` in rendered examples when interaction must update Controls, and `fn` from `storybook/test` for observable callbacks. Theme CSS and preview spacing are shared centrally; keep production styling in the theme package.

Use the shared `withThemeProvider` decorator only for context-dependent theme examples and keep those examples iframe-isolated in Docs. Other components remain provider-free and follow the toolbar directly.

Storybook tooling is pinned to 10.6.7; keep core, framework, and addons aligned. Do not initialize with an unpinned `latest` command, which may select a prerelease.

## CI and static output

The existing React package compatibility workflow builds and typechecks Storybook in its React 18/19 matrix through Nx. Only the React 19 lane uploads the `storybook-static` artifact. Download and extract that artifact, then serve the extracted directory with a static HTTP server; opening its HTML directly from disk is not supported.

Story/configuration source is checked in strict mode with TypeScript 7. Only this private tooling project's declaration-file checking is skipped: Storybook 10's transitive docgen declarations require the removed TypeScript compiler API, and its React/Vitest declarations also fail independent library checks. Docgen uses `react-docgen`, not the TypeScript compiler plugin. The published React library retains its existing full declaration checks.

CI uses the root convenience command or the equivalent Nx target:

```sh
npm run storybook:build
```

Output is written to `dist/packages/storybook`. Leave builds, lint, and typechecks to CI. Storybook is private, excluded from Nx Release, and is not published to npm or attached to package releases.

## GitHub Pages publishing

The documentation Pages workflow builds Storybook and the showcase together on relevant pushes to `main` and pull requests. Production Storybook is served at `https://wintermuted.github.io/wintermuted-ui/storybook/`; each PR receives `/wintermuted-ui/previews/pr-<number>/storybook/`. Existing showcase paths are unchanged. Public hosting does not change the workspace's private npm/release boundary.

Storybook's Vite assets use a relative base so the same output works at either depth. Use query-based Storybook links, such as `?path=/docs/components-button--docs` or `?path=/story/components-button--playground`; direct canvas links use `iframe.html?id=components-button--playground&viewMode=story`. No SPA rewrite or custom Pages 404 is needed.

`scripts/stage-pages.mjs` verifies the manager, iframe assets, and story index before copying both sites into one Pages tree. Production publishing preserves `previews/`; PR publishing replaces only that PR's tree. Preview comments are created or updated only after Pages succeeds and include links to both sites. Closing the PR removes its whole preview tree and redeploys the cleaned Pages artifact, leaving production and other PRs intact. Cleanup retries also republish when the PR directory is already absent, so a failed upload or deployment can be retried after the branch deletion succeeded. Both workflows use `queue: max` in the shared concurrency group to retain pending cleanup runs, subject to GitHub's 100-pending-run limit.

The Pages settings must use GitHub Actions as the publishing source. To refresh production manually, dispatch `.github/workflows/deploy-showcase-pages.yml` from `main`. A downloaded `storybook-static` artifact remains useful for offline review via a local HTTP server; its creation alone does not confirm that Pages was deployed.
