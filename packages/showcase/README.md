# Wintermuted showcase

`@wintermuted/showcase` is a private, independently versioned Nx package containing the static documentation and runnable React examples for Wintermuted UI. It is not published to npm.

Run `npm ci` from the repository root, then `npm run showcase:serve`. The site remains at `http://localhost:4174/showcase/`. Nx infers the serve, build, and preview targets from `vite.config.mjs`; every registered HTML page under `src/pages` is a build input.

CI builds the site into `dist/packages/showcase/showcase`. Relative asset URLs allow the same output to run under production `/showcase/` and nested PR previews without rebuilding.

## Agent-readable documentation

`/showcase/llms.txt` links to plain Markdown installation, CSS, React, MultiSelect, migration, theming, and component guides under `agent-docs/`. `src/templates/agent-docs.mjs` generates these assets from the existing guides and React README contracts, checking that every core component export has a contract. The Vite plugin serves the same content during development and emits it into static builds and release archives. Relative index links preserve PR preview isolation; no client-side JavaScript or additional service is required.

Update the canonical Markdown guides and component contract table, not generated files. Supporting relative links in copied guides point back to their original repository locations. Documentation follows the deployed source revision, so agents must check installed exports/declarations rather than assume every documented API has been published.

## Releases

The first release is `0.1.0`. Nx manages subsequent independent versions, `CHANGELOG.md`, and `showcase@X.Y.Z` Git tags. Direct releasable changes and version updates to the declared theme/React dependencies trigger showcase releases.

The patch release accompanying the typed React source migration rebuilds the static archive against the newly released theme and React packages; showcase remains private and is not published to npm.

Each GitHub release includes `showcase-X.Y.Z.tar.gz`. Extract it into a static web root; the archive contains `.nojekyll` and the `showcase/` directory, including all built pages, assets, classic scripts, and runtime images. Serve `/showcase/` using any static HTTP server.

## Shared site layouts

The showcase uses lightweight build-time layouts within this package; it is not a published site framework. Page content stays plain HTML, and Vite expands explicit comment slots before processing assets in both development and production. The generated site already contains its header, sidebar links, active-page state, and expanded active navigation group without JavaScript. Mobile navigation also remains visible when JavaScript is disabled.

`src/site.config.mjs` owns branding, repository/release settings, page titles, asset profiles, and the sidebar tree. Every HTML source under `src/pages` must have exactly one page registration. A page's `source` is relative to `src/pages`; its `file` is the stable public filename. Navigation references public filenames; registration alone does not add a sidebar link. `components.html` and the standalone layout mocks remain unlisted.

`src/templates/layout.mjs` renders shared markup and validates the contract. `src/templates/vite-plugin.mjs` connects it to Vite. Keep page-specific styles, module entries, demo markup, and inline scripts in their HTML files. `public/showcase.js` enhances the rendered controls and provides the existing theme, outline, code-copy, and demo behavior; it does not construct site navigation.

The shared sidebar links to the interactive Storybook catalog under Resources;
the React page also introduces its docs, controls, and examples. These links use
`../storybook/` so production and PR previews open the sibling catalog from the
same deployment. Standalone showcase archives do not include Storybook. During
local development, run `npm run storybook:serve` and open its separate port 6006.
The showcase output checker permits this exact sibling navigation link without
requiring Storybook inside the showcase archive; Pages staging independently
validates the Storybook artifact before publishing both sites together.

```text
src/
  site.config.mjs
  pages/
    foundations/
    inputs/
    navigation/
    layouts/docs/
    layouts/examples/
    data/
    feedback/
    utilities/
  templates/
  styles/
  examples/
public/
vite.config.mjs
```

Vite uses `src` as its source root and the package's existing `public` folder for copied assets. Development requests such as `/showcase/cards.html` map to their registered nested source, and requests to the source URL redirect to the canonical public URL. Production HTML is emitted with the same flat public filenames and relative asset URLs as before; moving a source folder does not change navigation or release URLs.

### Adding a page

The public project gallery is `projects.html`, authored in `src/pages/foundations/projects.html`.
Keep it separate from `gallery.html`, which documents the gallery component. To add or
refresh a listing, verify the repository is public and contains a theme dependency or
import, check the live site, and include a description, site link, source link, and
dependency/import evidence link. Update the last-checked date when reviewing the list.
Do not publish private repository details. The gallery is static and needs no runtime
GitHub API access; additional consumers can be suggested through the linked issue form.

Project icons are local snapshots in `public/projects`, displayed without cropping or
recoloring. Prefer the app's published icon; otherwise use an existing project mark.
Keep their source attribution below when refreshing assets. The JSON Resume mark
comes from its public project listing; Overworld currently publishes the React
favicon as its app icon (converted from ICO to PNG here).

| Asset | Original source |
| --- | --- |
| `game-of-life.svg` | [Game of Life app icon](https://github.com/wintermuted/game-of-life/blob/HEAD/packages/app/public/gol-mark.svg) |
| `icon-builder.svg` | [Icon Builder's preview favicon](https://github.com/wintermuted/icon-builder/blob/HEAD/assets/svg/wintermuted-brand/wm-wintermuted-mark.svg) |
| `blog.png` | [Blog logo](https://github.com/wintermuted/blog/blob/HEAD/logo.png) |
| `jsonresume.svg` | [JSON Resume project mark](https://github.com/wintermuted/blog/blob/HEAD/assets/img/projects/jsonresume-theme-wintermuted/jsonresume-theme-wintermuted-mark.svg) |
| `overworld.png` | [Overworld app favicon](https://github.com/wintermuted/overworld/blob/HEAD/public/favicon.ico) |

Create an HTML file in the appropriate category, such as `src/pages/foundations/example.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <!-- site:head -->
    <!-- Optional page-specific styles go here. -->
  </head>
  <body>
    <!-- site:docs-open -->
    <main class="docs-main">
      <header class="page-header wm-card card">
        <h2 class="page-title">Example</h2>
        <p class="page-lead">Describe the documented feature.</p>
      </header>
      <h3>Usage</h3>
      <p>Write content and runnable examples as ordinary HTML.</p>
    </main>
    <!-- site:docs-close -->
    <!-- site:vendors -->
    <!-- Optional vendor scripts go here, before the shared runtime. -->
    <!-- site:scripts -->
    <!-- Optional page-specific scripts go here. -->
  </body>
</html>
```

Add `{ file: "example.html", source: "foundations/example.html", label: "Example" }` to `site.pages`, then add `"example.html"` to the appropriate `site.navigation` section if it should appear in the sidebar. Titles default to `label | site.title`; use `title` to override. Navigation disclosures use `{ label: "Group", items: ["example.html"] }`; a link can override its label with `{ page: "example.html", label: "Overview" }`. Vite creates build inputs from the registry and recursively checks that every page source is registered. Restart the server after adding, moving, or removing page files.

### Layouts, assets, and slots

| Setting | Behavior |
| --- | --- |
| `layout: "docs"` (default) | Shared header/sidebar/shell; keep `<main class="docs-main">` and its attributes in the page. |
| `layout: "standalone"` | No docs chrome; omit `docs-open`/`docs-close` slots and author the full body. |
| `profile: "docs"` (docs-layout default) | Inter, theme/showcase CSS, favicons, Prism, Lucide, and shared runtime. |
| `profile: "icons"` | Same document styling, Lucide and runtime, without Prism JavaScript. |
| `profile: "react"` | Theme/showcase CSS and shared runtime; reference `/styles/react.css` and `/examples/react.js` in the page. |
| `profile: "standalone"` (standalone-layout default) | Theme/showcase CSS and favicons; no shared runtime or vendor scripts. |
| `themeOwner: "react"` | Leave theme state to the React examples; omit the classic theme toggle. |

Each page requires exactly one `site:head`, `site:vendors`, and `site:scripts` slot. Docs pages additionally require one `site:docs-open` and `site:docs-close`, surrounding the main element. Empty asset slots are valid for profiles that do not use them. Unknown, missing, or duplicate slots fail with a filename-specific error instead of emitting a partial site.

Page links use relative public filenames, such as `./cards.html`, not source-folder paths. Source asset references use Vite-root URLs such as `/styles/theme.css` and `/examples/react.js`, so they resolve independently of page-source depth. Vite renders built HTML asset URLs relative to the published site root while the plugin flattens HTML filenames; CSS and JavaScript asset URLs retain Vite's normal handling. The output works under production and nested preview paths.

Markdown authoring, search, external starters, content APIs, and npm distribution remain deferred. This internal layout contract preserves the current design, component examples, and package boundaries.
