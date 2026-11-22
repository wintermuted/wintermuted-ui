# Wintermuted UI

Nx-powered design-system monorepo using npm workspaces and one root lockfile.

| Workspace | Nx project | Purpose |
| --- | --- | --- |
| `packages/ui-theme` | `ui-theme` | Published `@wintermuted/ui-theme` CSS/JS package |
| `packages/ui-react` | `ui-react` | Existing React components and declarations, extracted into a separate package |
| `apps/showcase` | `showcase` | Multipage HTML documentation and React examples powered by Vite |

## Setup

Use Node.js 22.23.5 or newer and npm 10 or newer. Volta pins the development runtime.

```sh
npm ci
npm run showcase:serve
```

Open `http://localhost:4174/showcase/`. The HTML pages, React examples, and light/dark behavior are preserved. `npm run showcase:open` starts Vite and opens the site; the `:sample-data` and `:forms` variants open those pages.

Accept `.github/github-app.yml` when prompted in the Copilot app to enable automatic dependency installation and the manual showcase script. Automatic browser opening remains disabled. Stop an existing server before starting another: port 4174 is fixed.

## Package usage

```sh
npm install @wintermuted/ui-theme
```

```js
import "@wintermuted/ui-theme";
```

All existing modular CSS exports remain available. See [theme usage](packages/ui-theme/README.md).

The canonical React implementation now lives in `packages/ui-react`. Within the workspace:

```js
import "@wintermuted/ui-theme/index.css";
import { Button, ThemeProvider } from "@wintermuted/ui-react";
import { MultiSelect } from "@wintermuted/ui-react/select";
import { initTheme } from "@wintermuted/ui-react/theme";
```

Standalone React publication is deferred. Existing external consumers can continue using `@wintermuted/ui-theme/react`, `@wintermuted/ui-theme/react/select`, and `@wintermuted/ui-theme/theme`: theme packaging copies the canonical React sources for compatibility. Its React-related peers remain optional, so CSS-only consumers do not install React. See [React package guidance](packages/ui-react/README.md).

The root is now private. New monorepo tags are not a drop-in GitHub-source npm install of the theme; use npm releases or a packed theme tarball.

## Nx tasks

```sh
npm run graph
npx nx show projects
npx nx build showcase
npx nx build ui-react
npx nx pack ui-theme
npx nx pack ui-react
```

The theme needs no CSS compilation. React's build stages its existing ESM and declarations into `dist/packages/ui-react`, without bundling peers. Vite builds every showcase HTML page into `dist/apps/showcase/showcase`, using relative URLs compatible with nested previews. Workspace dependencies and shared configuration participate in Nx cache invalidation.

CI owns lint, typecheck, and build validation. Behavioral and package checks are available locally:

```sh
npm test
npm run test:pack
npm run test:browser
```

`test:consumers` additionally runs TypeScript 7, Vite 8, and Webpack 5 consumer checks in CI.

## Local consumer linking

```sh
npm run link:local -- ../sub-killer ../cv
npm run unlink:local -- ../sub-killer ../cv
```

These Bash helpers resolve relative paths from the invoking directory and link the theme workspace, not the private root. Internal npm workspaces are linked automatically during installation.

## Pages deployments

Production documentation remains under `/showcase/`. Pull requests deploy to `/previews/pr-<number>/showcase/`; closing a PR removes its preview. Deployments consume Vite's output for all pages, not a mixture of copied source and built React HTML.

## Nx Release

Nx Release manages independent versions, conventional-commit version selection, project changelogs, npm publication, and GitHub releases. Only `ui-theme` is explicitly selected; the showcase and initial standalone React release are excluded.

```sh
npm run release -- --dry-run
```

`fix:` yields patch releases, `feat:` minor releases, and breaking changes major releases, including before version 1.0. A merge without releasable changes does not force a bump. Nx determines affected projects from changed files.

For migration, the wrapper temporarily maps the latest reachable legacy `vX.Y.Z` tag to `ui-theme@X.Y.Z`, preserving the existing version baseline and avoiding replay of historical commits. It removes the temporary tag even if Nx fails. New theme releases use `ui-theme@X.Y.Z`; legacy tags are untouched.

The main workflow validates compatibility, prepares Nx version/changelog changes, publishes with provenance using trusted publishing or the `NPM_TOKEN` fallback, and only then pushes the release commit/tag and creates the GitHub release. It calls downstream dispatch explicitly, since releases created with `GITHUB_TOKEN` do not trigger another release-event workflow.

The manual publish workflow is recovery-only and defaults to a dry run. It never bumps versions.

When standalone React publication is ready, add `ui-react` to `release.projects` and establish its independent baseline. Its publish target already points to the staged output. Until then, React-only commits do not independently publish a new package.
