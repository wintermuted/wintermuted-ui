# Wintermuted UI

Nx-powered design-system monorepo using npm workspaces and one root lockfile.

| Workspace | Nx project | Purpose |
| --- | --- | --- |
| `packages/ui-theme` | `ui-theme` | Published `@wintermuted/ui-theme` CSS/JS package |
| `packages/ui-react` | `ui-react` | Existing React components and declarations, extracted into a separate package |
| `packages/showcase` | `showcase` | Private, versioned static documentation and React examples powered by Vite |
| `packages/storybook` | `storybook` | Private React component playground and interactive documentation; not released |

## Documentation

Start with the [documentation index](docs/README.md) for package selection and upgrade paths. The [architecture guide](docs/architecture.md) explains source ownership, dependency direction, styling, React boundaries, SSR, and showcase deployment. The [release runbook](docs/releases.md) covers version selection, publication prerequisites, the 1.0 launch, and recovery.

## Setup

Use Node.js 22.23.5 or newer and npm 10 or newer. Volta pins the development runtime.

```sh
npm ci
npm run showcase:serve
```

Open `http://localhost:4174/showcase/`. The HTML pages, React examples, and light/dark behavior are preserved. `npm run showcase:open` starts Vite and opens the site; the `:sample-data` and `:forms` variants open those pages.

Accept `.github/github-app.yml` when prompted in the Copilot app to enable automatic dependency installation and the manual showcase script. Automatic browser opening remains disabled. Stop an existing server before starting another: port 4174 is fixed.

For isolated React component development, run:

```sh
npm run storybook:serve
```

Open `http://127.0.0.1:6006`. [Storybook](packages/storybook/README.md) covers all exported React components with controls, generated docs, accessibility inspection, and light/dark switching. Compound Card and ListGroup primitives are documented together with dedicated slot examples. It complements the showcase without replacing its pages. The Pages workflow publishes Storybook alongside the showcase, and CI retains a downloadable `storybook-static` artifact. Storybook remains private and is not independently released or published to npm.

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

Starting with 1.0.0, `ui-theme` is CSS-only: it has no React dependencies, React exports, or compatibility copies. React consumers install `@wintermuted/ui-react`, which depends on `ui-theme` and declares the React peers. See the [1.0 migration guide](docs/migration-to-v1.md), [documentation index](docs/README.md), and [React package guidance](packages/ui-react/README.md).

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

The theme needs no CSS compilation. React's build compiles TypeScript/TSX to ESM and generates declarations in `dist/packages/ui-react`, without bundling peers. Vite builds every showcase HTML page into `dist/packages/showcase/showcase`, using relative URLs compatible with nested previews. Workspace dependencies and shared configuration participate in Nx cache invalidation.

CI owns lint, typecheck, and build validation. Behavioral and package checks are available locally:

```sh
npm test
npm run test:pack
npm run test:browser
```

`test:pack` requires compiled React output from CI; it never builds locally. `test:consumers` additionally runs TypeScript 7 bundler/NodeNext, Vite 8, and Webpack 5 consumer checks in CI, including React usage without the optional react-select peer. Node behavior tests transform TSX source directly, and Vite resolves workspace source during showcase development.

## Local consumer linking

```sh
npm run link:local -- ../sub-killer ../cv
npm run unlink:local -- ../sub-killer ../cv
```

These Bash helpers resolve relative paths from the invoking directory and link the CSS-only theme workspace, not the private root. Internal npm workspaces are linked automatically during installation. For React consumer linking, see the migration guide.

## Pages deployments

Production documentation remains at [Showcase](https://wintermuted.github.io/wintermuted-ui/showcase/), with [Storybook](https://wintermuted.github.io/wintermuted-ui/storybook/) alongside it. Pushes to `main` publish both sites together. Pull requests publish `/previews/pr-<number>/showcase/` and `/previews/pr-<number>/storybook/`; the preview comment links to both after a successful Pages deployment. Closing a PR removes both preview directories and republishes the remaining site.

Deployments consume built output, not copied source. Production replacements preserve all PR previews, and a PR deployment replaces only its own preview. The shared `pages` concurrency group serializes deployment and cleanup workflows with `queue: max` so pending cleanup runs are not replaced by newer runs (up to GitHub's 100-pending-run limit). Cleanup republishes an existing Pages tree even if the PR directory is already absent, allowing a retry to reconcile a previous publication failure. The workflow can also be dispatched manually; dispatch from `main` to refresh production.

## Nx Release

See the [release runbook](docs/releases.md) for the full workflow, authentication boundaries, first-publication checklist, and failure-stage recovery.

Nx Release manages independent versions, conventional-commit version selection, project changelogs, and GitHub releases for `ui-theme`, `ui-react`, and `showcase`. Only the public theme and React packages are published to npm.

The private showcase starts at `0.1.0` and uses `showcase@X.Y.Z` tags. Its own releasable changes and updates to declared theme/React dependencies produce new showcase versions. Each showcase GitHub release includes `showcase-X.Y.Z.tar.gz`, containing `.nojekyll` and the built `showcase/` site directory. Nested page sources and shared templates live under its `src` directory, with stable public page URLs. See the [showcase package guide](packages/showcase/README.md). External documentation-framework distribution is deferred.

```sh
npm run release -- --dry-run
```

`fix:` yields patch releases, `feat:` minor releases, and breaking changes major releases, including before version 1.0. A merge without releasable changes does not force a bump. Nx determines affected projects from changed files.

For migration, the wrapper temporarily maps the latest reachable legacy `vX.Y.Z` tag to `ui-theme@X.Y.Z`, preserving the existing version baseline and avoiding replay of historical commits. Before the first standalone React release, it also establishes a temporary React baseline from the commit that introduced its package manifest and that manifest's initial version. Temporary tags are removed even if Nx fails. New releases use `ui-theme@X.Y.Z` and `ui-react@X.Y.Z`; legacy tags are untouched.

The main workflow validates compatibility, prepares Nx version/changelog changes, stages React when public packages release, and builds/checks any released showcase before archiving it. It publishes only changed public projects with provenance using trusted publishing or the `NPM_TOKEN` fallback, then pushes the release commit/package tags, creates GitHub releases, and attaches the static-site archive. Showcase-only releases skip npm publication entirely. Each project's release notes use its own saved pre-release baseline. Theme releases call downstream dispatch explicitly, since releases created with `GITHUB_TOKEN` do not trigger another release-event workflow. React-only and showcase-only releases do not republish the unchanged theme or dispatch a theme bump.

The manual publish workflow is recovery-only and defaults to a dry run. It never bumps versions.

The 1.0 split is a breaking release for both packages. Preserve the breaking-change marker in the merge commit (`feat!: separate CSS theme from React integration`) so automatic version selection resolves 1.0.0 from the existing baselines. Configure trusted publishing for `@wintermuted/ui-react` on the Auto Release workflow, or ensure the `NPM_TOKEN` fallback can publish both packages. Do not migrate external React consumers until both 1.0.0 packages are available on npm.
