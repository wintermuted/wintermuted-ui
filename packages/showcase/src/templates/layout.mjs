const profiles = {
  docs: { fonts: true, prism: true, icons: true, favicon: true, runtime: true },
  icons: { fonts: true, prism: false, prismStyle: true, icons: true, favicon: true, runtime: true },
  react: { runtime: true },
  standalone: { favicon: true },
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function fail(message) {
  throw new Error(`Showcase site: ${message}`);
}

function profileName(page) {
  return page.profile ?? page.layout ?? "docs";
}

export function validateSite(site, sourceFiles) {
  if (!site || !Array.isArray(site.pages) || !Array.isArray(site.navigation)) fail("Site requires pages and navigation arrays");
  for (const field of ["title", "brand", "repository", "themeStorageKey"]) {
    if (typeof site[field] !== "string" || !site[field].trim()) fail(`Site requires a nonempty ${field}`);
  }
  if (!Array.isArray(site.fallbackTags) || !site.fallbackTags.length || site.fallbackTags.some((tag) => typeof tag !== "string" || !tag)) {
    fail("Site requires nonempty fallback release tags");
  }
  const pages = new Map();
  const sources = new Set();
  for (const page of site.pages) {
    if (!page || typeof page !== "object") fail("Each page registration must be an object");
    if (!/^[a-z0-9-]+\.html$/.test(page.file)) fail(`Invalid page filename: ${page.file}`);
    if (pages.has(page.file)) fail(`Duplicate page registration: ${page.file}`);
    if (typeof page.source !== "string" || !/^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html$/.test(page.source)) fail(`Invalid page source for ${page.file}: ${page.source}`);
    if (sources.has(page.source)) fail(`Duplicate page source: ${page.source}`);
    sources.add(page.source);
    if (!page.label) fail(`Missing label for ${page.file}`);
    if (!["docs", "standalone"].includes(page.layout ?? "docs")) fail(`Unknown layout for ${page.file}: ${page.layout}`);
    if (!Object.hasOwn(profiles, profileName(page))) fail(`Unknown asset profile for ${page.file}: ${page.profile}`);
    if (Boolean(profiles[profileName(page)].runtime) !== ((page.layout ?? "docs") === "docs")) {
      fail(`Asset profile does not match layout for ${page.file}: ${profileName(page)}`);
    }
    if (!["classic", "react"].includes(page.themeOwner ?? "classic")) fail(`Unknown theme owner for ${page.file}: ${page.themeOwner}`);
    pages.set(page.file, page);
  }
  const navigationPages = new Set();
  function checkItems(items, nested = false) {
    for (const item of items) {
      if (!item || (typeof item !== "string" && typeof item !== "object")) fail("Navigation items must be filenames, page links, or disclosures");
      if (typeof item === "object" && item.items) {
        if (nested || !item.label || !Array.isArray(item.items) || !item.items.length) fail("Navigation disclosures require a label and one level of links");
        checkItems(item.items, true);
        continue;
      }
      const file = typeof item === "string" ? item : item.page;
      if (!pages.has(file)) fail(`Unknown navigation page: ${file}`);
      if ((pages.get(file).layout ?? "docs") !== "docs") fail(`Standalone page cannot appear in docs navigation: ${file}`);
      if (navigationPages.has(file)) fail(`Duplicate navigation page: ${file}`);
      navigationPages.add(file);
    }
  }
  for (const section of site.navigation) {
    if (!section || !section.label || !Array.isArray(section.items)) fail("Navigation sections require a label and items");
    checkItems(section.items);
  }
  if (sourceFiles) {
    for (const file of sourceFiles) {
      if (!sources.has(file)) fail(`Missing page registration for source: ${file}`);
    }
    for (const page of pages.values()) {
      if (!sourceFiles.includes(page.source)) fail(`Registered page has no source file: ${page.source}`);
    }
  }
  return pages;
}

function renderHead(site, page, profile) {
  return [
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `<title>${escapeHtml(page.title ?? `${page.label} | ${site.title}`)}</title>`,
    profile.fonts ? [
      '<link rel="preconnect" href="https://fonts.googleapis.com" />',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />',
    ].join("\n") : "",
    '<link rel="stylesheet" href="/styles/theme.css" />',
    profile.prism || profile.prismStyle
      ? '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" crossorigin />' : "",
    '<link rel="stylesheet" href="/styles/showcase.css?v=8" />',
    profile.favicon ? [
      '<link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />',
      '<link rel="apple-touch-icon" href="/logo.png" />',
    ].join("\n") : "",
  ].filter(Boolean).join("\n    ");
}

function renderNavigation(site, page, pages) {
  function link(item, nested) {
    const file = typeof item === "string" ? item : item.page;
    const label = typeof item === "string" ? pages.get(file).label : item.label ?? pages.get(file).label;
    const active = file === page.file;
    return `<a class="${nested ? "docs-nav-sub-link" : "docs-nav-link"}${active ? " is-active" : ""}" data-page="${escapeHtml(file)}" href="./${escapeHtml(file)}"${active ? ' aria-current="page"' : ""}>${escapeHtml(label)}</a>`;
  }
  return `<nav class="docs-nav-group" aria-label="Showcase pages">${site.navigation.map((section) =>
    `<p class="docs-nav-label">${escapeHtml(section.label)}</p>${section.items.map((item) => {
      if (typeof item !== "object" || !item.items) return link(item, false);
      const active = item.items.some((child) => (typeof child === "string" ? child : child.page) === page.file);
      return `<details class="docs-nav-disclosure${active ? " has-active" : ""}"${active ? " open" : ""}><summary>${escapeHtml(item.label)}<svg class="docs-nav-disclosure-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></summary><div class="docs-nav-disclosure-body">${item.items.map((child) => link(child, true)).join("")}</div></details>`;
    }).join("")}`
  ).join("")}</nav>`;
}

function renderDocsOpen(site, page, pages) {
  const repositoryUrl = `https://github.com/${site.repository}`;
  const reactTheme = page.themeOwner === "react";
  const options = site.fallbackTags.map((tag, index) =>
    `<option value="${escapeHtml(`${repositoryUrl}/releases/tag/${tag}`)}"${index === 0 ? " selected" : ""}>${escapeHtml(tag)}</option>`
  ).join("");
  const currentItem = site.navigation.flatMap((section) => section.items.flatMap((item) =>
    typeof item === "object" && item.items ? item.items : [item]
  )).find((item) => (typeof item === "string" ? item : item.page) === page.file);
  const currentLabel = currentItem ? (typeof currentItem === "string" ? page.label : currentItem.label ?? page.label) : "";
  return `<header class="docs-topbar docs-topbar-global" data-site-repository="${escapeHtml(site.repository)}" data-site-theme-key="${escapeHtml(site.themeStorageKey)}" data-site-theme-owner="${reactTheme ? "react" : "classic"}">
      <div class="docs-topbar-inner">
        <button class="docs-topbar-menu" type="button" data-docs-sidebar-toggle aria-label="Toggle page navigation" aria-expanded="false" aria-controls="docs-sidebar"><i data-lucide="panel-left" aria-hidden="true"></i><span>Menu</span></button>
        <a class="docs-topbar-brand" href="./index.html"><img class="docs-topbar-brand-icon" src="/logo.png" alt="" width="20" height="20" aria-hidden="true" /><span>${escapeHtml(site.brand)}</span></a>
        <span class="docs-topbar-page-title">${escapeHtml(currentLabel)}</span>
        <div class="docs-topbar-actions">
          <select class="docs-topbar-version" aria-label="Select version">${options}</select>
          <a class="docs-topbar-github" href="${escapeHtml(repositoryUrl)}" target="_blank" rel="noopener noreferrer" aria-label="View on GitHub">${reactTheme ? "GitHub" : '<i data-lucide="github" aria-hidden="true"></i>'}</a>
          ${reactTheme ? "" : '<button class="docs-topbar-toggle" type="button" data-theme-toggle aria-label="Toggle theme">Toggle Dark</button>'}
        </div>
      </div>
    </header>
    <div class="docs-shell">
      <aside id="docs-sidebar" class="docs-sidebar wm-card card">${renderNavigation(site, page, pages)}</aside>`;
}

export function renderPage(html, file, site) {
  const pages = validateSite(site);
  const page = pages.get(file);
  if (!page) fail(`Missing page registration: ${file}`);
  const profile = profiles[profileName(page)];
  const docs = (page.layout ?? "docs") === "docs";
  const slots = {
    head: renderHead(site, page, profile),
    vendors: profile.prism ? [
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js" crossorigin></script>',
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js" crossorigin></script>',
    ].join("\n    ") : "",
    scripts: [
      profile.icons ? '<script src="https://unpkg.com/lucide@0.475.0/dist/umd/lucide.min.js" crossorigin></script>' : "",
      profile.runtime ? '<script src="/showcase.js?v=10"></script>' : "",
    ].filter(Boolean).join("\n    "),
    ...(docs ? { "docs-open": renderDocsOpen(site, page, pages), "docs-close": "</div>" } : {}),
  };
  for (const [slot, markup] of Object.entries(slots)) {
    const marker = `<!-- site:${slot} -->`;
    const count = html.split(marker).length - 1;
    if (count !== 1) fail(`${file} requires exactly one ${marker}; found ${count}`);
    html = html.replace(marker, () => markup);
  }
  if (/<!--\s*site:/.test(html)) fail(`Unknown or unsupported template slot in ${file}`);
  return html;
}
