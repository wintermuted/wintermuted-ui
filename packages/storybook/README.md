# Storybook pilot

Private React component development and interactive documentation alongside the [showcase](../showcase/README.md). Stories consume the canonical workspace exports and theme CSS; they do not copy components or change published package contents.

## Development

Install dependencies from the repository root with `npm ci`, then run:

```sh
npm run storybook:serve
```

Open `http://127.0.0.1:6006`. The port is fixed and Storybook does not open a browser automatically. Stop the server before starting a second instance. The existing showcase continues independently on port 4174.

Use the theme toolbar to select light or dark. This applies the existing theme runtime to the preview document, including native dialogs and select menus, without reading or changing saved theme preferences. It does not theme the Storybook manager.

## Pilot coverage

| Component | Examples and interactions |
| --- | --- |
| Button | Variants, small size, disabled state, and click actions |
| Input | Labeled native input with synchronized value controls |
| Tabs | Controlled selection, keyboard navigation, and a disabled item |
| Dialog | Native modal with an opening trigger, close/Escape handling, and focus restoration |
| MultiSelect | Labeled typed options, selection, and disabled state via the optional select entry point |

Use Canvas for isolated development, Docs for generated component documentation, Controls to edit props, and Actions to inspect callbacks. Dialog examples use an iframe in Docs so native modals cannot cover the full documentation page.

The Accessibility panel provides manual inspection, not an automated accessibility gate. Existing unit, native browser, and packed-consumer tests remain the regression suite. Automated story interaction tests, visual regression services, CSS-only examples, and full component coverage are deferred.

## Adding stories

Add a typed `*.stories.tsx` file under `src/stories`. Import components from `@wintermuted/ui-react`, MultiSelect from `@wintermuted/ui-react/select`, and theme helpers from `@wintermuted/ui-react/theme`.

Use typed CSF metadata (`satisfies Meta<...>`) and `StoryObj`, supply accessible labels, and add explicit controls for props that docgen cannot infer from primitive wrappers or generic components. Use `useArgs` from `storybook/preview-api` in rendered examples when interaction must update Controls, and `fn` from `storybook/test` for observable callbacks. Theme CSS and preview spacing are shared centrally; keep production styling in the theme package.

Storybook tooling is pinned to 10.6.7; keep core, framework, and addons aligned. Do not initialize with an unpinned `latest` command, which may select a prerelease.

## CI and static output

The existing React package compatibility workflow builds and typechecks Storybook in its React 18/19 matrix through Nx. Only the React 19 lane uploads the `storybook-static` artifact. Download and extract that artifact, then serve the extracted directory with a static HTTP server; opening its HTML directly from disk is not supported.

CI uses the root convenience command or the equivalent Nx target:

```sh
npm run storybook:build
```

Output is written to `dist/packages/storybook`. Leave builds, lint, and typechecks to CI. Storybook is private, excluded from Nx Release, and is not published to npm, attached to package releases, or deployed to GitHub Pages. Showcase hosting and preview URLs are unchanged.
