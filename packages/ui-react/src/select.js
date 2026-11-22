import { createElement, useId } from "react";
import ReactSelect, { mergeStyles } from "react-select";

// Inline values are CSS variables so open menus follow a theme change immediately.
const styles = {
  control: (base, state) => ({ ...base,
    backgroundColor: "var(--wm-color-bg)", color: "var(--wm-color-text)",
    borderColor: state.isFocused ? "var(--wm-color-accent)" : "var(--wm-color-border-strong)",
    borderRadius: "var(--wm-radius-xs)",
    boxShadow: state.isFocused ? "0 0 0 2px var(--wm-color-accent-border)" : "none",
    ":hover": { borderColor: "var(--wm-color-accent)" },
  }),
  menu: base => ({ ...base, backgroundColor: "var(--wm-color-surface-solid)",
    color: "var(--wm-color-text)", border: "1px solid var(--wm-color-border)" }),
  menuPortal: base => ({ ...base, color: "var(--wm-color-text)" }),
  option: (base, state) => ({ ...base,
    backgroundColor: state.isSelected ? "var(--wm-color-accent-soft)"
      : state.isFocused ? "var(--wm-color-surface-strong)" : "transparent",
    color: state.isDisabled ? "var(--wm-color-text-muted)" : "var(--wm-color-text)",
    ":active": { backgroundColor: "var(--wm-color-accent-soft)" },
  }),
  singleValue: base => ({ ...base, color: "var(--wm-color-text)" }),
  input: base => ({ ...base, color: "var(--wm-color-text)" }),
  placeholder: base => ({ ...base, color: "var(--wm-color-text-muted)" }),
  multiValue: base => ({ ...base, backgroundColor: "var(--wm-color-surface-strong)" }),
  multiValueLabel: base => ({ ...base, color: "var(--wm-color-text)" }),
  multiValueRemove: base => ({ ...base, color: "var(--wm-color-text-secondary)",
    ":hover": { backgroundColor: "var(--wm-color-danger-soft)", color: "var(--wm-color-danger)" } }),
};

export function MultiSelect({ styles: overrides, isMulti = true, id, className, ...props }) {
  const generated = useId();
  return createElement(ReactSelect, {
    instanceId: generated, ...props, inputId: props.inputId ?? id,
    className: ["wm-search-select", className].filter(Boolean).join(" "),
    isMulti, styles: mergeStyles(styles, overrides),
  });
}
