# Wintermuted showcase

`@wintermuted/showcase` is a private, independently versioned Nx package containing the static documentation and runnable React examples for Wintermuted UI. It is not published to npm.

Run `npm ci` from the repository root, then `npm run showcase:serve`. The site remains at `http://localhost:4174/showcase/`. Nx infers the serve, build, and preview targets from `vite.config.mjs`; every top-level HTML page is a build input.

CI builds the site into `dist/packages/showcase/showcase`. Relative asset URLs allow the same output to run under production `/showcase/` and nested PR previews without rebuilding.

## Releases

The first release is `0.1.0`. Nx manages subsequent independent versions, `CHANGELOG.md`, and `showcase@X.Y.Z` Git tags. Direct releasable changes and version updates to the declared theme/React dependencies trigger showcase releases.

Each GitHub release includes `showcase-X.Y.Z.tar.gz`. Extract it into a static web root; the archive contains `.nojekyll` and the `showcase/` directory, including all built pages, assets, classic scripts, and runtime images. Serve `/showcase/` using any static HTTP server.

This phase preserves the current site. A reusable documentation framework, templates, content APIs, and npm distribution are deferred.
