import type { ReactElement } from "react";

import type { ToggleGroupProps } from "../interfaces.js";

export function ToggleGroup<Value extends string>({
  options,
  value,
  onChange,
  label,
  disabled = false,
  orientation = "horizontal",
  appearance = "segmented",
  fullWidth = false,
  className = "",
}: ToggleGroupProps<Value>): ReactElement {
  const groupClass = `wm-toggle-group${orientation === "vertical" ? " wm-toggle-group-vertical" : ""}${fullWidth ? " wm-toggle-group-full" : ""}${appearance === "outline" ? " wm-toggle-group-outline" : ""}`;
  return (
    <div
      className={`${groupClass} ${className}`}
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`wm-toggle-group-btn${value === option.value ? " wm-toggle-group-btn-active" : ""}`}
          aria-pressed={value === option.value}
          disabled={disabled || option.disabled}
          title={option.title}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.swatchColor && (
            <span
              className="wm-toggle-group-swatch"
              style={{ background: option.swatchColor }}
              aria-hidden="true"
            />
          )}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
