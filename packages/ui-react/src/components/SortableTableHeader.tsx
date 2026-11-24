import type { ReactElement } from "react";

import type { SortableTableHeaderProps } from "../interfaces.js";

export function SortableTableHeader<Key extends string>({
  column,
  label,
  active,
  direction,
  onSort,
  onDirection,
  directionLabel,
  directionIcon,
}: SortableTableHeaderProps<Key>): ReactElement {
  return (
    <th
      scope="col"
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <div className="wm-sort-head">
        <button
          type="button"
          className={`wm-sort-btn${active ? " is-active" : ""}`}
          onClick={() => onSort(column)}
        >
          {label}
        </button>
        <button
          type="button"
          className={`wm-sort-dir-btn${active ? " is-active" : ""}`}
          aria-label={directionLabel}
          onClick={() => onDirection(column)}
        >
          {directionIcon}
        </button>
      </div>
    </th>
  );
}
