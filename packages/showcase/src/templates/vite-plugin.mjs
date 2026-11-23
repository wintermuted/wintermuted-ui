import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderPage, validateSite } from "./layout.mjs";

export function discoverPages(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return discoverPages(join(root, entry.name)).map((file) => `${entry.name}/${file}`);
    return entry.isFile() && entry.name.endsWith(".html") ? [entry.name] : [];
  }).sort();
}

export function showcaseSite(site, pagesRoot) {
  const sourceFiles = discoverPages(pagesRoot);
  validateSite(site, sourceFiles);
  const pagesByFile = new Map(site.pages.map((page) => [page.file, page]));
  const pagesBySource = new Map(site.pages.map((page) => [resolve(pagesRoot, ...page.source.split("/")), page]));
  const sourceRoutes = new Map(site.pages.map((page) => [`pages/${page.source}`, page]));
  return {
    name: "showcase-site-layouts",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url) return next();
        const url = new URL(request.url, "http://localhost");
        if (url.searchParams.has("html-proxy")) return next();
        const { pathname, search } = url;
        const base = server.config.base;
        if (!pathname.startsWith(base)) return next();
        const route = pathname.slice(base.length) || "index.html";
        const page = pagesByFile.get(route);
        if (page) {
          request.url = `${base}pages/${page.source}${search}`;
        } else {
          const sourcePage = sourceRoutes.get(route);
          if (sourcePage) {
            response.statusCode = 302;
            response.setHeader("Location", `${base}${sourcePage.file}${search}`);
            response.end();
            return;
          }
        }
        next();
      });
    },
    hotUpdate({ file }) {
      const page = pagesBySource.get(resolve(file));
      if (page && this.environment.name === "client") {
        this.environment.hot.send({ type: "full-reload", path: `/${page.file}` });
        return [];
      }
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, context) {
        const page = pagesBySource.get(resolve(context.filename));
        if (!page) throw new Error(`Showcase site: Unregistered source page: ${context.filename}`);
        return renderPage(html, page.file, site);
      },
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        for (const page of site.pages) {
          const sourceName = `pages/${page.source}`;
          const asset = bundle[sourceName];
          if (!asset || asset.type !== "asset") this.error(`Showcase site: Missing generated page: ${sourceName}`);
          if (bundle[page.file]) this.error(`Showcase site: Output filename collision: ${page.file}`);
          this.emitFile({ type: "asset", fileName: page.file, source: asset.source });
          delete bundle[sourceName];
        }
      },
    },
  };
}
