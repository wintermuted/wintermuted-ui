import { useId } from "react";
import ReactSelect, { mergeStyles } from "react-select";
import type { GroupBase, Props, StylesConfig } from "react-select";

export type MultiSelectProps<Option = unknown, IsMulti extends boolean = true,
  Group extends GroupBase<Option> = GroupBase<Option>> = Props<Option, IsMulti, Group>;

// Inline values are CSS variables so open menus follow a theme change immediately.
function themeStyles<Option, IsMulti extends boolean, Group extends GroupBase<Option>>(): StylesConfig<Option, IsMulti, Group> {
  return {
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
}

export function MultiSelect<Option = unknown, IsMulti extends boolean = true,
  Group extends GroupBase<Option> = GroupBase<Option>>({
  styles: overrides, isMulti, id, className, ...props
}: MultiSelectProps<Option, IsMulti, Group>) {
  const generated = useId();
  return <ReactSelect<Option, IsMulti, Group>
    instanceId={generated} {...props} inputId={props.inputId ?? id}
    className={["wm-search-select", className].filter(Boolean).join(" ")}
    isMulti={isMulti === undefined ? (true as IsMulti) : isMulti}
    styles={mergeStyles(themeStyles<Option, IsMulti, Group>(), overrides)}
  />;
}
