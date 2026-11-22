# Copilot Instructions for ui-theme

## Project overview

`@wintermuted/ui-theme` is a shared CSS/JS design-system package that publishes design tokens, base resets, and component styles. It is distributed via npmjs.

## Repository structure

```
styles/
  tokens.css          # Design tokens (colours, spacing, typography, etc.)
  base.css            # CSS reset and base element styles
  components.css      # Barrel file that imports all component stylesheets
  components/         # One CSS file per component (card, button, badge, …)
index.css             # Public CSS entry point
index.js              # Public JS entry point (re-exports styles as ES module)
react/                # Optional distributable React JS, declarations, select adapter, theme bootstrap
showcase/             # Static HTML/CSS documentation site for the component library
scripts/              # Helper shell scripts (link-local, unlink-local)
```

## Coding conventions

- All styling is plain CSS — no preprocessors (Sass, Less, PostCSS) are used.
- Design tokens are defined as CSS custom properties in `styles/tokens.css` and must be used throughout component stylesheets instead of hard-coded values.
- Each component lives in its own file under `styles/components/` and must also be registered in `styles/components.css` (barrel import) and in the `exports` map in `package.json`.
- The showcase site uses `.component-index` + `.component-card` for card-style navigation tiles on documentation pages.
- Versioning is fully automated: merging to `main` triggers `auto-release.yml`, which bumps the patch version, creates a tag, and publishes a GitHub Release. Do **not** manually edit the version in `package.json`.

## Development workflow

- Serve the showcase locally with `npm run showcase:serve` (starts Vite on port 4174, including the React page).
- Link the package locally for integration testing with `npm run link:local` / `npm run unlink:local`.
- Run `npm test`, `npm run test:pack`, and `npm run test:browser` for behavioral, package, and native browser checks.
- Leave lint, type checks, and builds to CI. `test:consumers` checks TS 7/bundler, Vite 8 and Webpack 5 consumers in CI.
- Preserve the CSS-only root export. React entry points are plain JavaScript with `.d.ts` files and `typesVersions` for legacy TypeScript resolution; do not export TSX. Keep react-select isolated to `react/select` and all React-related peers optional.

## Pull request guidelines

- Keep component stylesheets focused and scoped; avoid cross-component style leakage.
- When adding a new component, update `styles/components.css`, `package.json` exports, the showcase `components.html` page, and `showcase/index.html` navigation as needed.
- Commit messages should follow conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).
- If a branch or PR has already been merged, start from the latest `main`, create a new branch, and open a new PR. Do not continue work on merged PR branches unless explicitly requested.
