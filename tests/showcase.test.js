import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
import { site } from "../packages/showcase/src/site.config.mjs";
import { renderPage, validateSite } from "../packages/showcase/src/templates/layout.mjs";
import { discoverPages, showcaseSite } from "../packages/showcase/src/templates/vite-plugin.mjs";
import viteConfig from "../packages/showcase/vite.config.mjs";

const packageRoot = new URL("../packages/showcase/", import.meta.url);
const root = new URL("src/pages/", packageRoot);
const readPage = (file) => readFileSync(new URL(site.pages.find((page) => page.file === file).source, root), "utf8");
const render = (file, config = site) => new JSDOM(renderPage(readPage(file), file, config));

test("every registered source page expands its slots and retains its content", () => {
  const files = discoverPages(fileURLToPath(root));
  validateSite(site, files);
  for (const page of site.pages) {
    const source = new JSDOM(readPage(page.file));
    const output = render(page.file);
    const docs = (page.layout ?? "docs") === "docs";
    const selector = docs ? ".docs-main" : "body > main, body > .app-shell";
    assert.equal(output.window.document.querySelector(selector).innerHTML, source.window.document.querySelector(selector).innerHTML, page.file);
    assert.equal(output.window.document.querySelectorAll(".docs-topbar-global").length, docs ? 1 : 0, page.file);
    assert.ok(!/<!--\s*site:/.test(output.serialize()), page.file);
    assert.ok(output.window.document.title.length > 0, page.file);
    source.window.close();
    output.window.close();
  }
});

test("navigation renders active links, disclosure state and unlisted pages without JavaScript", () => {
  for (const file of ["cards.html", "layout-topnav.html", "components.html"]) {
    const dom = render(file);
    const document = dom.window.document;
    const active = document.querySelectorAll(".docs-sidebar [aria-current=page]");
    assert.equal(active.length, file === "components.html" ? 0 : 1);
    if (active.length) assert.equal(active[0].getAttribute("href"), `./${file}`);
    const disclosure = document.querySelector(".docs-nav-disclosure");
    assert.equal(disclosure.open, file === "layout-topnav.html");
    assert.equal(disclosure.classList.contains("has-active"), disclosure.open);
    assert.equal(document.querySelectorAll('[data-page="components.html"]').length, 0);
    assert.equal(document.querySelectorAll('[data-page^="layout-example-"]').length, 0);
    dom.window.close();
  }
});

test("React and standalone profiles preserve their assets and theme ownership", () => {
  const react = render("react.html");
  const document = react.window.document;
  assert.equal(document.querySelector(".docs-topbar-global").dataset.siteThemeOwner, "react");
  assert.equal(document.querySelectorAll("[data-theme-toggle]").length, 0);
  assert.ok(document.querySelector('link[href="/styles/react.css"]'));
  assert.ok(document.querySelector('script[type="module"][src="/examples/react.js"]'));
  assert.equal(document.querySelectorAll("script[src*=prism], script[src*=lucide]").length, 0);
  react.window.close();
  const mock = render("layout-example-sidebar.html");
  assert.equal(mock.window.document.querySelectorAll(".docs-shell, script").length, 0);
  assert.ok(mock.window.document.querySelector(".layout-mock-banner"));
  mock.window.close();
  const config = structuredClone(site);
  delete config.pages.find((page) => page.file === "layout-example-sidebar.html").profile;
  const defaultMock = render("layout-example-sidebar.html", config);
  assert.equal(defaultMock.window.document.scripts.length, 0);
  defaultMock.window.close();
});

test("project gallery exposes consumer sites and evidence without client-side rendering", () => {
  const dom = render("projects.html");
  const document = dom.window.document;
  const projects = document.querySelectorAll(".docs-main article.component-card");
  assert.equal(projects.length, 5);
  for (const project of projects) {
    const icon = project.querySelector("img.project-card-icon");
    assert.ok(icon);
    assert.equal(icon.alt, "");
    assert.equal(icon.getAttribute("width"), "64");
    assert.equal(icon.getAttribute("height"), "64");
    assert.match(icon.getAttribute("src"), /^\/projects\/[a-z-]+\.(svg|png)$/);
    assert.ok(readFileSync(new URL(`public${icon.getAttribute("src")}`, packageRoot)).length > 0);
    const links = Array.from(project.querySelectorAll("a"));
    assert.ok(project.querySelector("h3 a").textContent.trim());
    assert.ok(links.every((link) => link.getAttribute("href").startsWith("https://")));
    assert.ok(links.some((link) => link.textContent === "Source"));
    assert.ok(links.some((link) => /Theme (dependency|import)/.test(link.textContent)));
  }
  assert.equal(document.querySelector(".docs-sidebar [aria-current=page]").getAttribute("href"), "./projects.html");
  assert.ok(document.querySelector('a[href="https://github.com/wintermuted/wintermuted-ui/issues/new"]'));
  const introduction = render("index.html");
  assert.ok(introduction.window.document.querySelector('.docs-main a[href="./projects.html"]'));
  assert.equal(site.pages.find((page) => page.file === "gallery.html").source, "data/gallery.html");
  introduction.window.close();
  dom.window.close();
});

test("shared vendors stay before page dependencies and runtime, and local head content survives", () => {
  const gallery = render("gallery.html");
  const sources = Array.from(gallery.window.document.scripts, (script) => script.getAttribute("src") ?? "inline");
  assert.ok(sources[0].includes("prism-core"));
  assert.ok(sources[1].includes("prism-autoloader"));
  assert.ok(sources[2].includes("mermaid"));
  assert.ok(sources[3].includes("lucide"));
  assert.equal(sources[4], "/showcase.js?v=10");
  assert.equal(sources[5], "inline");
  gallery.window.close();
  const modal = render("modal.html");
  assert.ok(Array.from(modal.window.document.head.querySelectorAll("style")).some((style) => style.textContent.includes(".modal-demo-wrap")));
  modal.window.close();
});

test("registry errors identify invalid filenames, references, profiles and source coverage", () => {
  const cases = [
    [(config) => config.pages.push(config.pages[0]), /Duplicate page registration: index.html/],
    [(config) => config.pages[0].file = "../index.html", /Invalid page filename/],
    [(config) => config.pages[0].source = "../index.html", /Invalid page source/],
    [(config) => config.pages[1].source = config.pages[0].source, /Duplicate page source/],
    [(config) => config.pages[0].layout = "unknown", /Unknown layout/],
    [(config) => config.pages[0].profile = "unknown", /Unknown asset profile/],
    [(config) => config.pages[0].profile = "standalone", /Asset profile does not match layout/],
    [(config) => config.pages[0].themeOwner = "unknown", /Unknown theme owner/],
    [(config) => config.navigation[0].items.push("missing.html"), /Unknown navigation page/],
    [(config) => config.navigation[0].items.push("cards.html"), /Duplicate navigation page/],
    [(config) => config.navigation[0].items.push("layout-example-sidebar.html"), /Standalone page cannot appear/],
  ];
  for (const [change, expected] of cases) {
    const config = structuredClone(site);
    change(config);
    assert.throws(() => validateSite(config), expected);
  }
  const files = site.pages.map((page) => page.source);
  assert.throws(() => validateSite(site, [...files, "new/missing.html"]), /Missing page registration for source: new\/missing.html/);
  assert.throws(() => validateSite(site, files.slice(1)), /Registered page has no source file: foundations\/index.html/);
});

test("templates reject missing, repeated and unsupported slots rather than serving partial layouts", () => {
  const html = readPage("cards.html");
  assert.throws(() => renderPage(html.replace("<!-- site:head -->", ""), "cards.html", site), /requires exactly one.*site:head/);
  assert.throws(() => renderPage(`<!-- site:head -->${html}`, "cards.html", site), /found 2/);
  assert.throws(() => renderPage(`${html}<!-- site:unknown -->`, "cards.html", site), /Unknown or unsupported template slot/);
  assert.throws(() => renderPage(html, "missing.html", site), /Missing page registration: missing.html/);
});

test("site and page metadata cannot inject markup or alter template substitution", () => {
  const config = structuredClone(site);
  config.brand = '<img src=x onerror="alert(1)">$&';
  config.pages.find((page) => page.file === "cards.html").label = '<script>alert("x")</script>';
  config.repository = 'owner/repo" onmouseover="alert(1)';
  const dom = render("cards.html", config);
  const document = dom.window.document;
  assert.equal(document.querySelector(".docs-topbar-brand span").textContent, config.brand);
  assert.equal(document.querySelectorAll(".docs-topbar-brand img").length, 1);
  assert.equal(document.querySelectorAll("[onerror], [onmouseover]").length, 0);
  assert.equal(document.querySelector("[data-page='cards.html']").textContent, config.pages.find((page) => page.file === "cards.html").label);
  dom.window.close();
});

test("Vite serves expanded layouts for every page and the directory index", async () => {
  const server = await createServer({
    configFile: fileURLToPath(new URL("vite.config.mjs", packageRoot)),
    server: { host: "127.0.0.1", port: 0 },
  });
  try {
    await server.listen();
    const base = `http://127.0.0.1:${server.httpServer.address().port}/showcase/`;
    for (const file of ["", ...site.pages.map((page) => page.file)]) {
      const response = await fetch(`${base}${file}`);
      assert.equal(response.status, 200, file);
      const html = await response.text();
      assert.ok(!/<!--\s*site:/.test(html), file);
      assert.equal(html.includes('class="docs-topbar docs-topbar-global"'), !file.startsWith("layout-example-"), file);
    }
    for (const page of site.pages) {
      const response = await fetch(`${base}pages/${page.source}?preview=1`, { redirect: "manual" });
      assert.equal(response.status, 302, page.source);
      assert.equal(response.headers.get("location"), `/showcase/${page.file}?preview=1`, page.source);
    }
    for (const asset of ["styles/theme.css", "styles/showcase.css", "styles/react.css", "examples/react.js", "logo.png", "showcase.js"]) {
      const response = await fetch(`${base}${asset}`);
      assert.equal(response.status, 200, asset);
      assert.ok(!response.headers.get("content-type").includes("text/html"), asset);
    }
  } finally {
    await server.close();
  }
});

test("nested sources keep flat release filenames and deployment-relative asset URLs", () => {
  const config = viteConfig({ command: "build" });
  const plugin = showcaseSite(site, fileURLToPath(root));
  const sourceName = (page) => `pages/${page.source}`;
  const projectGallery = new JSDOM(readPage("projects.html"));
  const icons = Array.from(projectGallery.window.document.querySelectorAll(".project-card-icon"), (image) =>
    image.getAttribute("src").slice(1));
  projectGallery.window.close();
  const urls = ["assets/shared.css", "assets/react.js", "logo.png", "showcase.js", ...icons];
  const html = urls.map((url) => config.experimental.renderBuiltUrl(url, {
    hostType: "html", hostId: sourceName(site.pages[0]),
  })).join("\n");
  const bundle = Object.fromEntries(site.pages.map((page) => [
    sourceName(page), { type: "asset", fileName: sourceName(page), source: html },
  ]));
  const chunk = { type: "chunk", fileName: "assets/react.js", code: "export {};" };
  bundle[chunk.fileName] = chunk;
  const context = {
    error(message) { throw new Error(message); },
    emitFile(asset) { bundle[asset.fileName] = asset; },
  };
  const readOnlyAssignments = new Proxy(bundle, {
    set() { throw new Error("Rolldown does not support assigning bundle entries"); },
  });
  plugin.generateBundle.handler.call(context, {}, readOnlyAssignments);
  for (const page of site.pages) {
    assert.ok(config.build.rolldownOptions.input[page.file.slice(0, -5)].endsWith(page.source.replaceAll("/", process.platform === "win32" ? "\\" : "/")));
    assert.ok(!Object.hasOwn(bundle, sourceName(page)));
    assert.equal(bundle[page.file].fileName, page.file);
    for (const [index, url] of urls.entries()) {
      const reference = bundle[page.file].source.split("\n")[index];
      for (const base of ["https://wintermuted.github.io/wintermuted-ui/showcase/", "https://wintermuted.github.io/wintermuted-ui/previews/pr-47/showcase/"]) {
        assert.equal(new URL(reference, `${base}${page.file}`).href, `${base}${url}`);
      }
    }
  }
  assert.equal(bundle[chunk.fileName], chunk);
  assert.equal(config.experimental.renderBuiltUrl("images/icon.png", { hostType: "css" }), undefined);
  assert.throws(() => plugin.generateBundle.handler.call(context, {}, {}), /Missing generated page/);
  const collision = {
    [sourceName(site.pages[0])]: { type: "asset" },
    [site.pages[0].file]: { type: "asset" },
  };
  assert.throws(() => plugin.generateBundle.handler.call(context, {}, collision), /Output filename collision/);
});

test("source routing preserves Vite HTML proxies and reloads canonical page URLs", () => {
  const plugin = showcaseSite(site, fileURLToPath(root));
  let middleware;
  plugin.configureServer({
    config: { base: "/showcase/" },
    middlewares: { use(handler) { middleware = handler; } },
  });
  const proxy = "/showcase/pages/navigation/modal.html?html-proxy&direct&index=0.css";
  const request = { url: proxy };
  let nextCalled = false;
  middleware(request, {}, () => { nextCalled = true; });
  assert.ok(nextCalled);
  assert.equal(request.url, proxy);
  const messages = [];
  const context = { environment: { name: "client", hot: { send(message) { messages.push(message); } } } };
  plugin.hotUpdate.call(context, { file: fileURLToPath(new URL("layouts/docs/layout-topnav.html", root)) });
  assert.deepEqual(messages, [{ type: "full-reload", path: "/layout-topnav.html" }]);
  plugin.hotUpdate.call(context, { file: fileURLToPath(new URL("../styles/showcase.css", root)) });
  assert.equal(messages.length, 1);
});
