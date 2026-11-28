(function () {
  function tabs(root) {
    const buttons = [...root.querySelectorAll('[role="tab"]')];
    function activate(button) {
      buttons.forEach(tab => {
        const active = tab === button;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        tab.classList.toggle("wm-tab-btn-active", active);
        root.querySelector(`#${tab.getAttribute("aria-controls")}`).hidden = !active;
      });
    }
    buttons.forEach(button => {
      button.addEventListener("click", () => activate(button));
      button.addEventListener("keydown", event => {
        const enabled = buttons.filter(tab => !tab.disabled);
        const index = enabled.indexOf(button);
        const target = {
          ArrowRight: enabled[(index + 1) % enabled.length],
          ArrowLeft: enabled[(index - 1 + enabled.length) % enabled.length],
          Home: enabled[0], End: enabled.at(-1),
        }[event.key];
        if (!target) return;
        event.preventDefault();
        activate(target);
        target.focus();
      });
    });
  }

  function menu(root) {
    const trigger = root.querySelector('[aria-haspopup="menu"]');
    const panel = root.querySelector('[role="menu"]');
    const items = [...panel.querySelectorAll('[role="menuitem"]')];
    const enabled = () => items.filter(item => item.getAttribute("aria-disabled") !== "true");
    function close(restore = false) {
      panel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      if (restore) trigger.focus();
    }
    function open(last = false) {
      panel.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      (last ? enabled().at(-1) : enabled()[0])?.focus();
    }
    trigger.addEventListener("click", () => panel.hidden ? open() : close());
    trigger.addEventListener("keydown", event => {
      if (!["ArrowDown", "ArrowUp", "Escape"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Escape") close(true);
      else open(event.key === "ArrowUp");
    });
    panel.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); close(true); return; }
      if (event.key === "Tab") { close(true); return; }
      const choices = enabled();
      const index = choices.indexOf(document.activeElement);
      const target = {
        ArrowDown: choices[(index + 1) % choices.length],
        ArrowUp: choices[(index - 1 + choices.length) % choices.length],
        Home: choices[0], End: choices.at(-1),
      }[event.key];
      if (target) { event.preventDefault(); target.focus(); }
    });
    items.forEach(item => item.addEventListener("click", event => {
      if (item.getAttribute("aria-disabled") === "true") { event.preventDefault(); return; }
      root.querySelector("output").textContent = `${item.textContent.trim()} selected`;
      close(true);
    }));
    root.addEventListener("focusout", event => {
      if (!root.contains(event.relatedTarget)) close();
    });
    document.addEventListener("pointerdown", event => {
      if (!root.contains(event.target)) close();
    });
  }

  function tooltip(root) {
    root.querySelectorAll(".wm-tooltip-anchor").forEach(anchor => {
      const trigger = anchor.querySelector("button");
      const tip = anchor.querySelector('[role="tooltip"]');
      const original = trigger.getAttribute("aria-describedby") ?? "";
      let hovered = false, focused = false, dismissed = false;
      function update() {
        tip.hidden = !(hovered || focused) || dismissed;
        const description = [original, tip.hidden ? "" : tip.id].filter(Boolean).join(" ");
        if (description) trigger.setAttribute("aria-describedby", description);
        else trigger.removeAttribute("aria-describedby");
      }
      anchor.addEventListener("mouseenter", () => { hovered = true; dismissed = false; update(); });
      anchor.addEventListener("mouseleave", () => { hovered = false; update(); });
      anchor.addEventListener("focusin", () => { focused = true; dismissed = false; update(); });
      anchor.addEventListener("focusout", event => {
        if (!anchor.contains(event.relatedTarget)) { focused = false; update(); }
      });
      document.addEventListener("keydown", event => {
        if (event.key === "Escape") { dismissed = true; update(); }
      });
    });
  }

  function language(root) {
    const trigger = root.querySelector('[aria-haspopup="listbox"]');
    const panel = root.querySelector('[role="listbox"]');
    const options = [...panel.querySelectorAll('[role="option"]')];
    const enabled = options.filter(option => !option.disabled);
    function close(restore = false) {
      panel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      if (restore) trigger.focus();
    }
    function open() {
      panel.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      (enabled.find(option => option.getAttribute("aria-selected") === "true") ?? enabled[0])?.focus();
    }
    trigger.disabled = enabled.length === 0;
    trigger.addEventListener("click", () => panel.hidden ? open() : close());
    root.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) { event.preventDefault(); close(true); return; }
      if (event.key === "Tab" && !panel.hidden) { close(true); return; }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (panel.hidden) { open(); return; }
      const index = enabled.indexOf(document.activeElement);
      const target = event.key === "Home" ? enabled[0] : event.key === "End" ? enabled.at(-1)
        : enabled[(index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length];
      target?.focus();
    });
    options.forEach(option => option.addEventListener("click", () => {
      options.forEach(item => {
        item.setAttribute("aria-selected", String(item === option));
        item.classList.toggle("is-active", item === option);
      });
      trigger.querySelector("span").textContent = option.textContent;
      trigger.setAttribute("aria-label", `Language: ${option.textContent}`);
      root.querySelector("output").textContent = `Selected language: ${option.textContent}`;
      close(true);
    }));
    root.addEventListener("focusout", event => { if (!root.contains(event.relatedTarget)) close(); });
    document.addEventListener("mousedown", event => { if (!root.contains(event.target)) close(); });
  }

  function stepper(root) {
    const decrease = root.querySelector("[data-decrease]");
    const increase = root.querySelector("[data-increase]");
    const output = root.querySelector(".wm-stepper-value");
    const min = Number(root.dataset.min), max = Number(root.dataset.max), step = Number(root.dataset.step);
    let value = Number(output.textContent);
    if (![min, max, step, value].every(Number.isFinite) || min > max || step <= 0 || value < min || value > max) {
      throw new RangeError("Stepper requires a finite value within bounds and a positive finite step.");
    }
    function render() {
      output.textContent = String(value);
      decrease.disabled = root.dataset.disabled === "true" || value <= min;
      increase.disabled = root.dataset.disabled === "true" || value >= max;
    }
    function change(direction) {
      const decimals = number => {
        const [coefficient, exponent = "0"] = String(number).split("e");
        return Math.max(0, (coefficient.split(".")[1]?.length ?? 0) - Number(exponent));
      };
      const precision = Math.max(decimals(value), decimals(step));
      const next = value + direction * step;
      value = Math.min(max, Math.max(min, Number.isFinite(next) && precision <= 100
        ? Number(next.toFixed(precision)) : next));
      render();
    }
    decrease.addEventListener("click", () => change(-1));
    increase.addEventListener("click", () => change(1));
    render();
  }

  function color(root) {
    const picker = root.querySelector("details");
    const trigger = picker.querySelector("summary");
    const hex = picker.querySelector('[type="text"]');
    const native = picker.querySelector('[type="color"]');
    const error = picker.querySelector('[role="alert"]');
    const swatches = [...picker.querySelectorAll("[data-color]")];
    function close() { picker.open = false; trigger.focus(); }
    function validate() {
      const input = hex.value.trim();
      const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input);
      error.hidden = Boolean(match);
      hex.setAttribute("aria-invalid", String(!match));
      if (!match) { hex.setAttribute("aria-describedby", error.id); return null; }
      hex.removeAttribute("aria-describedby");
      const digits = match[1].length === 3 ? [...match[1]].map(char => char + char).join("") : match[1];
      return `#${digits.toLowerCase()}`;
    }
    function select(value) {
      hex.value = native.value = value;
      error.hidden = true;
      hex.setAttribute("aria-invalid", "false");
      hex.removeAttribute("aria-describedby");
      picker.querySelector(".wm-color-picker-dot").style.backgroundColor = value;
      swatches.forEach(button => {
        const active = button.dataset.color.toLowerCase() === value;
        button.setAttribute("aria-pressed", String(active));
        button.classList.toggle("wm-color-swatch-active", active);
      });
      root.querySelector("output").textContent = `Selected color: ${value}`;
    }
    swatches.forEach(button => button.addEventListener("click", () => { select(button.dataset.color); close(); }));
    native.addEventListener("input", () => select(native.value));
    hex.addEventListener("input", () => {
      error.hidden = true;
      hex.setAttribute("aria-invalid", "false");
      hex.removeAttribute("aria-describedby");
    });
    hex.addEventListener("blur", () => {
      if (!picker.open) return;
      const value = validate();
      if (value) select(value);
    });
    hex.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const value = validate();
      if (value) { select(value); close(); }
    });
    picker.addEventListener("keydown", event => {
      if (event.key === "Escape" && picker.open) { event.preventDefault(); close(); }
    });
    document.addEventListener("mousedown", event => {
      if (!picker.contains(event.target)) picker.open = false;
    });
  }

  function filters(root) {
    const trigger = root.querySelector(".wm-filter-panel-toggle");
    const panel = root.querySelector(".wm-filter-panel-controls");
    const scrim = root.querySelector(".wm-filter-panel-scrim");
    function close() {
      panel.classList.remove("wm-filter-panel-controls-open");
      trigger.setAttribute("aria-expanded", "false");
      scrim.hidden = true;
      trigger.focus();
    }
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") !== "true";
      trigger.setAttribute("aria-expanded", String(expanded));
      panel.classList.toggle("wm-filter-panel-controls-open", expanded);
      scrim.hidden = !expanded;
    });
    scrim.addEventListener("click", close);
    root.querySelector("[data-close-filters]").addEventListener("click", close);
    const help = root.querySelector("[data-filter-help]");
    help.addEventListener("keydown", event => {
      if (event.key === "Escape" && help.open) {
        event.preventDefault();
        help.open = false;
        help.querySelector("summary").focus();
      }
    });
    // A nested popup gets the first opportunity to consume Escape.
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !event.defaultPrevented && root.contains(document.activeElement)
        && trigger.getAttribute("aria-expanded") === "true") { event.preventDefault(); close(); }
    });
    root.querySelectorAll("[data-facet]").forEach(facet => {
      const reset = facet.querySelector("[data-reset]");
      const options = [...facet.querySelectorAll("[data-value]")];
      const more = facet.querySelector("[data-more]");
      const summary = facet.querySelector("output");
      function update() {
        const selected = options.filter(option => option.checked);
        reset.checked = selected.length === 0;
        summary.textContent = selected.length ? `Selected: ${selected.map(option => option.dataset.value).join(", ")}` : "All categories";
      }
      reset.addEventListener("change", () => {
        if (reset.checked) options.forEach(option => { option.checked = false; });
        update();
      });
      options.forEach(option => option.addEventListener("change", update));
      more.addEventListener("click", () => {
        const expanded = more.getAttribute("aria-expanded") !== "true";
        more.setAttribute("aria-expanded", String(expanded));
        more.textContent = expanded ? "Show fewer" : "Show more";
        facet.querySelectorAll("[data-extra]").forEach(option => { option.hidden = !expanded; });
      });
      update();
    });
  }

  function dialog(root) {
    const trigger = root.querySelector("[data-open-dialog]");
    const modal = root.querySelector("dialog");
    let previous;
    trigger.addEventListener("click", () => {
      previous = document.activeElement;
      modal.showModal();
    });
    root.querySelector("[data-close-dialog]").addEventListener("click", () => modal.close());
    modal.addEventListener("close", () => previous?.focus());
    modal.addEventListener("keydown", event => {
      if (event.key !== "Tab" || event.defaultPrevented) return;
      const controls = [...modal.querySelectorAll("button, input, select, textarea, a[href], [tabindex]")]
        .filter(node => node.tabIndex >= 0 && !node.matches(":disabled") && !node.closest("[inert]")
          && node.getClientRects().length && getComputedStyle(node).visibility !== "hidden");
      const first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); modal.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === modal)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === modal)) {
        event.preventDefault(); first.focus();
      }
    });
  }

  function sorting(root) {
    const body = root.querySelector("tbody");
    const headers = [...root.querySelectorAll("[data-column]")];
    let column = "merchant", direction = "asc";
    function render() {
      const rows = [...body.rows];
      rows.sort((left, right) => {
        const a = left.dataset[column], b = right.dataset[column];
        const result = column === "amount" ? Number(a) - Number(b) : a.localeCompare(b);
        return direction === "asc" ? result : -result;
      });
      rows.forEach(row => body.append(row));
      headers.forEach(header => {
        const active = header.dataset.column === column;
        header.setAttribute("aria-sort", active ? direction === "asc" ? "ascending" : "descending" : "none");
        header.querySelectorAll("button").forEach(button => button.classList.toggle("is-active", active));
        header.querySelector("[data-direction]").setAttribute("aria-label",
          `Sort ${header.dataset.column} ${direction === "asc" ? "descending" : "ascending"}`);
      });
    }
    headers.forEach(header => {
      header.querySelector("[data-sort]").addEventListener("click", () => { column = header.dataset.column; render(); });
      header.querySelector("[data-direction]").addEventListener("click", () => {
        column = header.dataset.column;
        direction = direction === "asc" ? "desc" : "asc";
        render();
      });
    });
    render();
  }

  function preview(root) {
    const image = root.querySelector("img");
    const fallback = root.querySelector('[role="img"]');
    function load(src) {
      image.hidden = false;
      fallback.hidden = true;
      image.src = src;
    }
    image.addEventListener("error", () => { image.hidden = true; fallback.hidden = false; });
    root.querySelector("[data-missing-image]").addEventListener("click", () => load("missing-preview-image.png"));
    root.querySelector("[data-restore-image]").addEventListener("click", () => load(root.dataset.source));
    if (image.complete && image.naturalWidth === 0) { image.hidden = true; fallback.hidden = false; }
  }

  function loading(root) {
    const refresh = root.querySelector("[data-refresh]");
    const status = root.querySelector(".wm-load-status");
    const message = status.querySelector("[data-message]");
    const retry = status.querySelector("[data-retry]");
    const loadingMessage = status.querySelector("[data-loading]");
    const count = root.querySelector("output");
    let state = "idle", retries = 0;
    function render() {
      const busy = state === "loading";
      const error = state === "error";
      refresh.disabled = retry.disabled = busy;
      refresh.setAttribute("aria-busy", String(busy));
      refresh.textContent = busy ? "Refreshing" : error ? "Retry refresh" : "Refresh";
      status.hidden = state === "idle";
      status.classList.toggle("wm-load-status-warning", !error);
      message.hidden = !["error", "warning"].includes(state);
      message.setAttribute("role", error ? "alert" : "status");
      message.textContent = error ? "Catalog unavailable. Image service unavailable."
        : state === "warning" ? "Cached results may be outdated." : "";
      retry.hidden = !error;
      loadingMessage.hidden = !busy;
    }
    root.querySelectorAll("[data-state]").forEach(button => button.addEventListener("click", () => {
      state = button.dataset.state;
      render();
    }));
    refresh.addEventListener("click", () => { state = "loading"; render(); });
    // Each supplied recovery action runs once per retry; no timer or fetch belongs to this demo.
    const recoveryActions = [() => { retries += 1; }, () => { retries += 1; }];
    retry.addEventListener("click", () => {
      recoveryActions.forEach(recover => recover());
      count.textContent = `Recovery callbacks: ${retries}`;
      state = "loading";
      render();
    });
    render();
  }

  function disclosure(root) {
    const trigger = root.querySelector(".wm-action-disclosure-trigger");
    const content = root.querySelector("[data-disclosure-content]");
    const action = root.querySelector(".wm-action-disclosure-action");
    function expand(value) {
      if (!value) root.querySelector("output").textContent = "Collapse cleanup completed before hiding";
      trigger.setAttribute("aria-expanded", String(value));
      content.hidden = !value;
    }
    trigger.addEventListener("click", () => expand(content.hidden));
    action.addEventListener("click", () => {
      expand(true);
      content.querySelector("input").focus();
    });
  }

  function ranked(root) {
    const maximum = Number(root.dataset.maximum);
    const minimum = Number(root.dataset.minimum ?? 0);
    const items = [...root.querySelectorAll("[data-value]")];
    if (!Number.isFinite(maximum) || maximum < 0 || !Number.isFinite(minimum) || minimum < 0 || minimum > 100
      || items.some(item => !Number.isFinite(Number(item.dataset.value)) || Number(item.dataset.value) < 0)) {
      throw new RangeError("Ranked bars require nonnegative finite values and a minimum width between 0 and 100.");
    }
    items.forEach(item => {
      const percent = maximum > 0 ? Math.min(100, Math.max(minimum, Number(item.dataset.value) / maximum * 100)) : 0;
      item.querySelector(".wm-ranked-fill").style.width = `${percent}%`;
    });
  }

  function appearance(root) {
    const select = root.querySelector("select");
    const media = matchMedia("(prefers-color-scheme: dark)");
    const key = root.dataset.storageKey;
    let preference = localStorage.getItem(key) ?? "system";
    if (!["light", "dark", "system"].includes(preference)) preference = "system";
    function apply() {
      const dark = preference === "dark" || (preference === "system" && media.matches);
      document.documentElement.toggleAttribute("data-theme", dark);
      if (dark) document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
      select.value = preference;
    }
    select.addEventListener("change", () => {
      preference = select.value;
      localStorage.setItem(key, preference);
      apply();
    });
    media.addEventListener("change", () => { if (preference === "system") apply(); });
    apply();
  }

  const controllers = { tabs, menu, tooltip, language, stepper, color, filters, dialog, sorting, preview, loading, disclosure, ranked, appearance };
  document.querySelectorAll("[data-demo]").forEach(root => {
    const name = root.dataset.demo;
    const controller = controllers[name];
    if (name !== "static" && !controller) throw new Error(`Unknown showcase demo: ${name}`);
    const markup = document.querySelector(`[data-demo-markup="${root.id}"]`);
    if (markup) markup.textContent = '<style>[data-demo] [hidden] { display: none !important; }</style>\n' + root.outerHTML;
    const source = document.querySelector(`[data-demo-script="${root.id}"]`);
    if (source && controller) source.textContent = `${controller.toString()}\n\n${name}(document.getElementById("${root.id}"));`;
    controller?.(root);
  });
  if (window.Prism) window.Prism.highlightAllUnder(document.querySelector(".docs-main"));
})();
