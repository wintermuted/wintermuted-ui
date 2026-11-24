import { useState, type ReactElement } from "react";

import type { FacetFilterProps } from "../interfaces.js";

export function FacetFilter<Value extends string>({
  label,
  options,
  selected,
  onChange,
  available,
  emptyLabel,
  reset,
  moreLabel,
  fewerLabel,
}: FacetFilterProps<Value>): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = options.filter((option) => option.hidden).length;
  return (
    <details className="wm-facet-filter" open>
      <summary className="wm-facet-filter-summary">{label}</summary>
      <div className="wm-checkbox-filter-group" role="group" aria-label={label}>
        {!available ? (
          <p className="wm-facet-empty">{emptyLabel}</p>
        ) : (
          <>
            <label className="wm-checkbox-filter-label">
                <input
                  type="checkbox"
                  checked={reset.selected}
                  onChange={(event) => {
                    if (event.target.checked) reset.onSelect();
                  }}
                />
                <span className="wm-checkbox-filter-name">{reset.label}</span>
              <span className="wm-checkbox-filter-count">{reset.count}</span>
            </label>
            {options
              .filter((option) => expanded || !option.hidden)
              .map((option) => (
                <label
                  key={option.value}
                  className="wm-checkbox-filter-label"
                >
                    <input
                      type="checkbox"
                      checked={selected.includes(option.value)}
                      disabled={option.disabled}
                      onChange={(event) =>
                        onChange(
                          event.target.checked
                            ? [...selected, option.value]
                            : selected.filter((value) => value !== option.value),
                        )
                      }
                    />
                    <span className="wm-checkbox-filter-name">{option.label}</span>
                  <span className="wm-checkbox-filter-count">
                    {option.count}
                  </span>
                </label>
              ))}
            {hiddenCount > 0 && (
              <button
                className="wm-facet-more"
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? fewerLabel : moreLabel}
              </button>
            )}
          </>
        )}
      </div>
    </details>
  );
}
