import {
  Children, cloneElement, createContext, createElement as h, forwardRef,
  useContext, useEffect, useId, useLayoutEffect, useRef, useState,
} from "react";
import {
  DEFAULT_THEME_KEY, applyTheme, isThemePreference, readThemePreference, resolveTheme,
} from "./theme.js";

const cx = (...values) => values.filter(Boolean).join(" ");
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function primitive(tag, baseClass) {
  return forwardRef(function Primitive({ as = tag, className, ...props }, ref) {
    return h(as, { ...props, ref, className: cx(baseClass, className) });
  });
}

export const Card = primitive("section", "wm-card");
export const CardHeader = primitive("header", "wm-card-header");
export const CardBody = primitive("div", "wm-card-body");
export const CardTitle = primitive("h3", "wm-card-title");
export const CardText = primitive("p", "wm-card-text");
export const CardFooter = primitive("footer", "wm-card-footer");
export const ListGroup = primitive("ul", "wm-list-group");
export const ListItem = primitive("li", "wm-list-item");
export const Nav = primitive("nav", "wm-nav");
export const Input = primitive("input", "wm-input");
export const Select = primitive("select", "wm-select");

export const Button = forwardRef(function Button({
  variant = "primary", size, icon, className, children, type = "button", ...props
}, ref) {
  return h("button", {
    ...props, ref, type,
    className: cx("wm-btn", `wm-btn-${variant}`, size && `wm-btn-${size}`, className),
  }, icon && h("span", { "aria-hidden": true, className: "wm-btn-icon" }, icon), children);
});

export const Badge = forwardRef(function Badge({ tone = "neutral", className, ...props }, ref) {
  return h("span", { ...props, ref, className: cx("wm-badge", `wm-badge-${tone}`, className) });
});

export const Alert = forwardRef(function Alert({ tone = "info", className, role = "status", ...props }, ref) {
  return h("div", { ...props, ref, role, className: cx("wm-alert", `wm-alert-${tone}`, className) });
});

export function Spinner({ label = "Loading", className, ...props }) {
  return h("span", { ...props, role: "status", className: cx("wm-spinner", className) },
    h("span", { "aria-hidden": true, className: "wm-spinner-indicator" }),
    h("span", { className: "wm-sr-only" }, label));
}

export function ProgressBar({ value = 0, max = 100, label, className, ...props }) {
  if (!Number.isFinite(max) || max <= 0 || !Number.isFinite(value)) {
    throw new RangeError("ProgressBar requires a finite value and a positive finite max.");
  }
  return h("progress", { ...props, className: cx("wm-progress", className),
    value: Math.min(max, Math.max(0, value)), max, "aria-label": label ?? props["aria-label"] });
}

export const Table = forwardRef(function Table({ responsive = false, className, ...props }, ref) {
  const table = h("table", { ...props, ref, className: cx("wm-table", className) });
  return responsive ? h("div", { className: "wm-table-responsive", tabIndex: 0,
    role: "region", "aria-label": props["aria-label"] || "Scrollable table" }, table) : table;
});

export function FieldGroup({ label, htmlFor, hint, error, className, children, ...props }) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const child = Children.only(children);
  const controlId = htmlFor || child.props.id || `${id}-control`;
  const describedBy = cx(child.props["aria-describedby"], (hint || error) && descriptionId) || undefined;
  return h("div", { ...props, className: cx("wm-field", className) },
    h("label", { htmlFor: controlId }, label),
    cloneElement(child, {
      id: controlId, "aria-describedby": describedBy,
      "aria-invalid": error ? true : child.props["aria-invalid"],
    }),
    (hint || error) && h("div", { id: descriptionId, className: error ? "wm-field-error" : "wm-field-hint" }, error || hint));
}

export function Accordion({ title, children, className, ...props }) {
  return h("details", { ...props, className: cx("wm-accordion", className) },
    h("summary", null, title), h("div", { className: "wm-accordion-body" }, children));
}

export function Tabs({ items, value, defaultValue, onValueChange, label, className, ...props }) {
  const prefix = useId();
  const [internal, setInternal] = useState(defaultValue);
  const requested = value === undefined ? internal : value;
  const active = items.find(item => item.id === requested && !item.disabled)?.id
    ?? items.find(item => !item.disabled)?.id;
  const refs = useRef([]);
  function activate(item) {
    if (value === undefined) setInternal(item.id);
    onValueChange?.(item.id);
  }
  function navigate(event, index) {
    const enabled = items.map((item, i) => item.disabled ? -1 : i).filter(i => i !== -1);
    const position = enabled.indexOf(index);
    let target;
    if (event.key === "ArrowRight") target = enabled[(position + 1) % enabled.length];
    if (event.key === "ArrowLeft") target = enabled[(position - 1 + enabled.length) % enabled.length];
    if (event.key === "Home") target = enabled[0];
    if (event.key === "End") target = enabled[enabled.length - 1];
    if (target === undefined) return;
    event.preventDefault();
    refs.current[target]?.focus();
    activate(items[target]);
  }
  return h("div", { ...props, className: cx("wm-tabs", className) },
    h("div", { role: "tablist", "aria-label": label, className: "wm-tab-bar" },
      items.map((item, index) => h("button", {
        key: item.id, id: `${prefix}-tab-${item.id}`, type: "button", role: "tab",
        "aria-selected": active === item.id, "aria-controls": `${prefix}-panel-${item.id}`,
        tabIndex: active === item.id ? 0 : -1, disabled: item.disabled,
        className: cx("wm-tab-btn", active === item.id && "wm-tab-btn-active"),
        ref: node => { refs.current[index] = node; },
        onKeyDown: event => navigate(event, index), onClick: () => activate(item),
      }, item.label))),
    items.map(item => h("div", { key: item.id, id: `${prefix}-panel-${item.id}`,
      role: "tabpanel", "aria-labelledby": `${prefix}-tab-${item.id}`,
      hidden: active !== item.id, tabIndex: 0, className: "wm-tab-panel" }, item.content)));
}

export function Menu({ label, items, className, ...props }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const root = useRef(null);
  const refs = useRef([]);
  const focusLast = useRef(false);
  useClientLayoutEffect(() => {
    if (!open) return;
    const enabled = refs.current.filter(node => node && node.getAttribute("aria-disabled") !== "true");
    (focusLast.current ? enabled.at(-1) : enabled[0])?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function close(restore = false) {
    setOpen(false);
    if (restore) trigger.current?.focus();
  }
  function navigate(event) {
    if (event.key === "Escape") { event.preventDefault(); close(true); return; }
    if (event.key === "Tab") { close(true); return; }
    const enabled = refs.current.filter(node => node && node.getAttribute("aria-disabled") !== "true");
    const index = enabled.indexOf(document.activeElement);
    let next;
    if (event.key === "ArrowDown") next = enabled[(index + 1) % enabled.length];
    if (event.key === "ArrowUp") next = enabled[(index - 1 + enabled.length) % enabled.length];
    if (event.key === "Home") next = enabled[0];
    if (event.key === "End") next = enabled.at(-1);
    if (next) { event.preventDefault(); next.focus(); }
  }
  return h("div", { ...props, ref: root, className: cx("wm-menu", className),
    onBlur: event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); } },
    h(Button, { ref: trigger, variant: "secondary", "aria-haspopup": "menu",
      "aria-expanded": open, "aria-controls": open ? id : undefined,
      onClick: () => { focusLast.current = false; setOpen(!open); },
      onKeyDown: event => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault(); focusLast.current = event.key === "ArrowUp"; setOpen(true);
        }
      } }, label),
    open && h("ul", { id, role: "menu", "aria-label": typeof label === "string" ? label : "Actions",
      className: "wm-menu-items", onKeyDown: navigate },
    items.map((item, index) => h("li", { key: item.id, role: "none" },
      h(item.href && !item.disabled ? "a" : "button", {
        href: item.disabled ? undefined : item.href,
        type: item.href && !item.disabled ? undefined : "button",
        role: "menuitem", tabIndex: -1, "aria-disabled": item.disabled || undefined,
        ref: node => { refs.current[index] = node; },
        onClick: event => {
          if (item.disabled) { event.preventDefault(); return; }
          close(true); item.onSelect?.(event);
        },
      }, item.label)))));
}

export function Tooltip({ text, children }) {
  const id = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const visible = (hovered || focused) && !dismissed;
  const child = Children.only(children);
  useEffect(() => {
    if (!visible) return;
    const dismiss = event => { if (event.key === "Escape") setDismissed(true); };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [visible]);
  return h("span", { className: "wm-tooltip-anchor",
    onMouseEnter: () => { setHovered(true); setDismissed(false); },
    onMouseLeave: () => setHovered(false),
    onFocus: () => { setFocused(true); setDismissed(false); },
    onBlur: event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); } },
    cloneElement(child, { "aria-describedby": cx(child.props["aria-describedby"], visible && id) || undefined }),
    visible && h("span", { id, role: "tooltip", className: "wm-tooltip" }, text));
}

export function Dialog({ open, onClose, title, children, className, ...props }) {
  const ref = useRef(null);
  const restoreTarget = useRef(null);
  const internalCloses = useRef(0);
  const titleId = useId();
  useClientLayoutEffect(() => {
    const dialog = ref.current;
    if (!open) return;
    if (!restoreTarget.current || !dialog.contains(document.activeElement)) {
      restoreTarget.current = document.activeElement;
    }
    const previous = restoreTarget.current;
    dialog.showModal();
    return () => {
      if (dialog.open) { internalCloses.current += 1; dialog.close(); }
      // Restore after React's commit-time focus restoration, including unmount.
      queueMicrotask(() => {
        if (dialog.open) return;
        if (previous?.isConnected) previous.focus();
        restoreTarget.current = null;
      });
    };
  }, [open]);
  function trapFocus(event) {
    props.onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== "Tab") return;
    const dialog = ref.current;
    const candidates = Array.from(dialog.querySelectorAll(
      "a[href], area[href], button, input, select, textarea, summary, iframe, object, embed, audio[controls], video[controls], [tabindex], [contenteditable='true']",
    )).filter(node => (node.tabIndex >= 0 || (node.isContentEditable && !node.hasAttribute("tabindex")))
      && !node.matches(":disabled")
      && !node.closest("[inert]") && node.getClientRects().length > 0);
    const tabbable = candidates.filter(node => {
      if (node.tagName !== "INPUT" || node.type !== "radio" || !node.name) return true;
      const group = candidates.filter(other => other.tagName === "INPUT" && other.type === "radio"
        && other.name === node.name && other.form === node.form);
      return node === (group.find(other => other.checked) || group[0]);
    }).sort((a, b) => (a.tabIndex > 0 ? a.tabIndex : Infinity) - (b.tabIndex > 0 ? b.tabIndex : Infinity));
    const first = tabbable[0];
    const last = tabbable[tabbable.length - 1];
    if (!first) { event.preventDefault(); dialog.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
      event.preventDefault(); first.focus();
    }
  }
  return h("dialog", { ...props, ref, "aria-labelledby": titleId,
    tabIndex: props.tabIndex ?? -1, onKeyDown: trapFocus,
    className: cx("wm-dialog", className),
    onCancel: event => { event.preventDefault(); onClose(); },
    onClose: () => {
      if (internalCloses.current > 0) internalCloses.current -= 1;
      else if (open) onClose();
    } },
    h("header", { className: "wm-dialog-header" }, h("h3", { id: titleId }, title),
      h(Button, { variant: "ghost", onClick: onClose, "aria-label": "Close dialog" }, "Close")),
    h("div", { className: "wm-dialog-body" }, children));
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children, storageKey = DEFAULT_THEME_KEY }) {
  const [preference, setPreferenceState] = useState(() => readThemePreference(storageKey));
  const currentPreference = useRef(preference);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(preference));
  useClientLayoutEffect(() => {
    const sync = () => {
      const current = readThemePreference(storageKey);
      currentPreference.current = current;
      setPreferenceState(current);
      setResolvedTheme(applyTheme(current));
    };
    sync();
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    const systemChange = () => setResolvedTheme(applyTheme(currentPreference.current));
    const storage = event => { if (event.key === storageKey || event.key === null) sync(); };
    query?.addEventListener("change", systemChange);
    window.addEventListener("storage", storage);
    return () => {
      query?.removeEventListener("change", systemChange);
      window.removeEventListener("storage", storage);
    };
  }, [storageKey]);
  function setPreference(next) {
    if (!isThemePreference(next)) throw new TypeError("Theme preference must be system, light, or dark.");
    try { window.localStorage.setItem(storageKey, next); }
    catch (error) { console.warn("Wintermuted theme preference could not be saved.", error); }
    currentPreference.current = next;
    setPreferenceState(next);
    setResolvedTheme(applyTheme(next));
  }
  return h(ThemeContext.Provider, { value: { preference, setPreference, resolvedTheme } }, children);
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used inside ThemeProvider.");
  return theme;
}

export function ThemeSelect({ label = "Appearance", id, ...props }) {
  const generated = useId();
  const { preference, setPreference } = useTheme();
  const controlId = id || generated;
  return h(FieldGroup, { label, htmlFor: controlId },
    h(Select, { ...props, id: controlId, value: preference, onChange: event => setPreference(event.target.value) },
      h("option", { value: "system" }, "System"),
      h("option", { value: "light" }, "Light"),
      h("option", { value: "dark" }, "Dark")));
}
