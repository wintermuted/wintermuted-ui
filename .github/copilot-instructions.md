# Copilot Instructions for Wintermuted UI

## Repository structure

This is an Nx monorepo with npm workspaces and one root lockfile.

- `packages/ui-theme`: published `@wintermuted/ui-theme`, with `index.css`, `index.js`, and `styles/`.
- `packages/ui-react/src`: canonical React JavaScript and hand-authored declarations, including select integration and theme utilities.
- `packages/showcase`: private, versioned static HTML documentation using Vite. Categorized page sources live in `src/pages`, shared layouts/plugin in `src/templates`, styles in `src/styles`, and React examples in `src/examples`. `src/site.config.mjs` maps nested sources to stable public filenames. Shared classic JavaScript remains in `public/showcase.js`.
- `scripts`: consumer linking, release migration, packaging, and checks.

## Conventions

- Styles are plain CSS. Use `--wm-*` tokens from `packages/ui-theme/styles/tokens.css`.
- Keep component styles scoped. Register new styles in `packages/ui-theme/styles/components.css` and the theme package's `exports`.
- Update showcase pages and navigation alongside components. Navigation tiles use `.component-index` and `.component-card`.
- React components remain plain JavaScript with `.d.ts` declarations; do not distribute TSX or bundle React.
- Keep react-select isolated to `ui-react/select`; it is an optional peer of the React package.
- Keep React components and theme runtime helpers exclusively in `ui-react/src`; do not copy them into `ui-theme`.
- Keep the CSS-only root export free of React imports and global runtime effects.
- Declare workspace dependencies in manifests. `ui-react` depends on `ui-theme`, never the reverse; the theme has no React peers.
- Use conventional commits. Nx Release versions packages independently from changed-file history; do not manually bump the theme version.
- `ui-theme`, `ui-react`, and private `showcase` are released automatically with independent versions. Showcase releases include static archives and never publish to npm; dependency updates also trigger showcase releases.

## Development and CI

- Run `npm ci` at the root. Do not create nested lockfiles.
- `npm run showcase:serve` starts Vite on port 4174 at `/showcase/`.
- Link local theme consumers with `npm run link:local -- <consumer-path>`; use `unlink:local` to restore dependencies.
- `npm test`, `npm run test:pack`, and `npm run test:browser` cover behavior, packed consumers, and native browser interactions.
- Leave lint, typecheck, and builds to CI. Consumer compatibility covers TypeScript 7, Vite 8, Webpack 5, React 18, CSS-only installation, and standalone React exports.
- All HTML pages must remain Vite build inputs. Preserve production and nested preview URLs, shared classic scripts, images, and existing visual design.
- Nx Release owns versions, changelogs, and publishing. Legacy `v*` tags remain unchanged; theme releases now use `ui-theme@X.Y.Z`.

## Pull requests

- Preserve existing CSS exports and React package behavior; legacy theme React exports were intentionally removed in 1.0.
- If a branch or PR has already merged, start a new session from current `main`, unless explicitly asked otherwise.
