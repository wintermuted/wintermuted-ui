(function () {
  const topbar = document.querySelector(".docs-topbar-global");
  const key = topbar.dataset.siteThemeKey;
  const repo = topbar.dataset.siteRepository;
  const versionSelect = topbar.querySelector(".docs-topbar-version");
  const releaseApiUrl = `https://api.github.com/repos/${repo}/releases?per_page=20`;
  const fallbackTags = Array.from(versionSelect.options, (option) => option.textContent);
  const root = document.documentElement;
  const fontStatusNodes = document.querySelectorAll("[data-font-status]");

  function releaseTagUrl(tag) {
    return `https://github.com/${repo}/releases/tag/${tag}`;
  }

  function setVersionOptions(selectNode, tags) {
    selectNode.innerHTML = "";

    tags.forEach((tag, index) => {
      const opt = document.createElement("option");
      opt.value = releaseTagUrl(tag);
      opt.textContent = tag;
      if (index === 0) {
        opt.selected = true;
      }
      selectNode.appendChild(opt);
    });
  }

  async function loadReleaseTags() {
    try {
      const response = await fetch(releaseApiUrl, {
        headers: { Accept: "application/vnd.github+json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch releases (${response.status})`);
      }

      const releases = await response.json();
      const tags = releases
        .map((release) => release && release.tag_name)
        .filter((tag) => typeof tag === "string" && /^(?:v|ui-theme@)\d+\.\d+\.\d+$/.test(tag));

      return tags.length ? tags : fallbackTags;
    } catch (_err) {
      return fallbackTags;
    }
  }

  function wireVersionSelect() {
    versionSelect.addEventListener("change", () => {
      window.open(versionSelect.value, "_blank", "noopener");
      versionSelect.selectedIndex = 0;
    });

    loadReleaseTags().then((tags) => {
      setVersionOptions(versionSelect, tags);
    });
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function buildPageOutline() {
    const docsShell = document.querySelector(".docs-shell");
    const main = document.querySelector(".docs-main");

    if (!docsShell || !main || docsShell.querySelector(".docs-outline-rail")) {
      return;
    }

    const headings = Array.from(
      main.querySelectorAll(".page-header .page-title, .docs-main > h3, .docs-main > .docs-section > .section-title")
    );

    if (!headings.length) {
      return;
    }

    const usedIds = new Set();
    headings.forEach((heading) => {
      if (heading.id) {
        usedIds.add(heading.id);
      }
    });

    headings.forEach((heading, index) => {
      if (heading.id) {
        return;
      }

      const base = slugify(heading.textContent || "section") || `section-${index + 1}`;
      let id = base;
      let counter = 2;

      while (usedIds.has(id) || document.getElementById(id)) {
        id = `${base}-${counter}`;
        counter += 1;
      }

      heading.id = id;
      usedIds.add(id);
    });

    const outline = document.createElement("nav");
    outline.className = "docs-outline-group";
    outline.setAttribute("aria-label", "Page outline");

    const outlineRail = document.createElement("aside");
    outlineRail.className = "docs-outline-rail";

    const label = document.createElement("p");
    label.className = "docs-outline-label";
    label.textContent = "On This Page";

    const links = document.createElement("div");
    links.className = "docs-outline-links";

    headings.forEach((heading) => {
      const link = document.createElement("a");
      link.className = "docs-outline-link";
      link.href = `#${heading.id}`;
      link.textContent = (heading.textContent || "").trim();
      link.setAttribute("data-outline-target", heading.id);
      links.appendChild(link);
    });

    outline.append(label, links);
    outlineRail.appendChild(outline);
    docsShell.appendChild(outlineRail);

    const outlineLinks = Array.from(links.querySelectorAll(".docs-outline-link"));
    const updateActive = () => {
      let activeId = headings[0].id;
      const offset = 120;

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top - offset <= 0) {
          activeId = heading.id;
        }
      });

      outlineLinks.forEach((link) => {
        const isActive = link.getAttribute("data-outline-target") === activeId;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("hashchange", updateActive);
    updateActive();
  }

  function wireSidebarToggle() {
    const sidebar = document.querySelector(".docs-sidebar");
    const toggleButtons = Array.from(document.querySelectorAll("[data-docs-sidebar-toggle]"));

    if (!sidebar || !toggleButtons.length) {
      return;
    }

    const sidebarId = sidebar.id || "docs-sidebar";
    sidebar.id = sidebarId;

    const backdrop = document.createElement("div");
    backdrop.className = "docs-sidebar-backdrop";
    document.body.appendChild(backdrop);

    const mobile = window.matchMedia("(max-width: 1000px)");
    const setOpen = (open) => {
      document.body.classList.toggle("docs-sidebar-open", open);
      toggleButtons.forEach((button) => {
        button.setAttribute("aria-expanded", open ? "true" : "false");
      });
    };

    toggleButtons.forEach((button) => {
      button.setAttribute("aria-controls", sidebarId);
      button.addEventListener("click", () => {
        setOpen(!document.body.classList.contains("docs-sidebar-open"));
      });
    });

    backdrop.addEventListener("click", () => setOpen(false));

    sidebar.querySelectorAll("a[href]").forEach((link) => {
      link.addEventListener("click", () => {
        if (mobile.matches) {
          setOpen(false);
        }
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    });

    const closeOnDesktop = () => {
      if (!mobile.matches) {
        setOpen(false);
      }
    };

    if (typeof mobile.addEventListener === "function") {
      mobile.addEventListener("change", closeOnDesktop);
    } else if (typeof mobile.addListener === "function") {
      mobile.addListener(closeOnDesktop);
    }
    document.body.classList.add("docs-sidebar-enhanced");
  }

  function getToggleButtons() {
    return document.querySelectorAll("[data-theme-toggle]");
  }

  function applyTheme(theme) {
    const dark = theme === "dark";

    if (dark) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }

    const iconName = dark ? "sun" : "moon";
    const label = dark ? "Light" : "Dark";

    getToggleButtons().forEach((button) => {
      button.innerHTML = `<i data-lucide="${iconName}" aria-hidden="true"></i><span>${label}</span>`;
      button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    });

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  function wireThemeToggle() {
    if (topbar.dataset.siteThemeOwner === "react") return;
    const saved = localStorage.getItem(key);
    const initial = saved === "dark" ? "dark" : "light";
    applyTheme(initial);

    getToggleButtons().forEach((button) => {
      button.addEventListener("click", function () {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        localStorage.setItem(key, next);
        applyTheme(next);
      });
    });
  }

  function updateFontStatus() {
    if (!fontStatusNodes.length || !document.fonts) {
      return;
    }

    document.fonts.ready.then(function () {
      const interLoaded = document.fonts.check('16px "Inter"');

      fontStatusNodes.forEach((node) => {
        if (interLoaded) {
          node.textContent = "Font status: Inter loaded";
          node.classList.add("font-status-ok");
          node.classList.remove("font-status-warn");
        } else {
          node.textContent = "Font status: Inter not loaded (using fallback stack)";
          node.classList.add("font-status-warn");
          node.classList.remove("font-status-ok");
        }
      });
    });
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function renderSampleDataShowcase() {
    const mount = document.querySelector("[data-sample-data-showcase]");
    if (!mount) {
      return;
    }

    const data = {
      range: "Jan 2026 - Jun 2026",
      merchants: [
        { name: "Figma", amount: 180, frequency: "Monthly", status: "Confirmed" },
        { name: "Notion", amount: 96, frequency: "Annual", status: "Detected" },
        { name: "Sentry", amount: 264, frequency: "Monthly", status: "Confirmed" },
        { name: "Linear", amount: 144, frequency: "Monthly", status: "Pending Cancel" },
      ],
      monthly: [
        { month: "Jan", spend: 628, savings: 26 },
        { month: "Feb", spend: 612, savings: 44 },
        { month: "Mar", spend: 604, savings: 51 },
        { month: "Apr", spend: 587, savings: 73 },
        { month: "May", spend: 571, savings: 86 },
        { month: "Jun", spend: 552, savings: 102 },
      ],
    };

    const totalSpend = data.monthly.reduce((sum, row) => sum + row.spend, 0);
    const totalSavings = data.monthly.reduce((sum, row) => sum + row.savings, 0);
    const activeSubscriptions = data.merchants.filter((row) => row.status !== "Pending Cancel").length;

    const statMount = mount.querySelector("[data-sample-stats]");
    const tableMount = mount.querySelector("[data-sample-table]");
    const chartMount = mount.querySelector("[data-sample-chart]");
    const rangeMount = mount.querySelector("[data-sample-range]");

    if (rangeMount) {
      rangeMount.textContent = data.range;
    }

    if (statMount) {
      const cards = [
        { value: formatCurrency(totalSpend), label: "Total spend" },
        { value: formatCurrency(totalSavings), label: "Savings identified", tone: "success" },
        { value: String(activeSubscriptions), label: "Active subscriptions" },
      ];

      statMount.innerHTML = cards
        .map((card) => {
          const toneClass = card.tone === "success" ? " stat-card-success" : "";
          return `<div class="stat-card${toneClass}"><div class="stat-value">${card.value}</div><div class="stat-label">${card.label}</div></div>`;
        })
        .join("");
    }

    if (tableMount) {
      tableMount.innerHTML = data.merchants
        .map((row) => {
          return `<tr><td>${row.name}</td><td>${formatCurrency(row.amount)}</td><td>${row.frequency}</td><td>${row.status}</td></tr>`;
        })
        .join("");
    }

    if (chartMount) {
      const maxSpend = Math.max(...data.monthly.map((row) => row.spend));
        chartMount.innerHTML = data.monthly
        .map((row) => {
          const spendHeight = Math.max(10, Math.round((row.spend / maxSpend) * 140));
          const savingsHeight = Math.max(8, Math.round((row.savings / maxSpend) * 140));
          return `<div class="sample-data-bar-group"><div class="sample-data-bars"><span class="sample-data-bar sample-data-bar-spend" style="height:${spendHeight}px" title="${row.month} spend ${formatCurrency(row.spend)}" aria-label="${row.month} spend ${formatCurrency(row.spend)}" role="img" tabindex="0"></span><span class="sample-data-bar sample-data-bar-savings" style="height:${savingsHeight}px" title="${row.month} savings ${formatCurrency(row.savings)}" aria-label="${row.month} savings ${formatCurrency(row.savings)}" role="img" tabindex="0"></span></div><span class="sample-data-bar-label">${row.month}</span></div>`;
        })
        .join("");
    }
  }

  wireVersionSelect();
  buildPageOutline();
  wireSidebarToggle();
  wireThemeToggle();
  updateFontStatus();
  renderSampleDataShowcase();
  wireCopyButtons();

  // Prism syntax highlighting
  if (typeof Prism !== 'undefined') {
    Prism.plugins.autoloader.languages_path =
      'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/';
    Prism.highlightAll();
  }

  function wireCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pre = btn.closest('.code-sample').querySelector('.code-block');
        if (!pre || !navigator.clipboard) return;
        navigator.clipboard.writeText(pre.textContent.trim()).then(function () {
          var prev = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(function () { btn.textContent = prev; }, 1500);
        });
      });
    });
  }
})();
