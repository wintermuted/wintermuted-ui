import { forwardRef } from "react";
import type { TableProps } from "../interfaces.js";
import { cx } from "../utils.js";

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table({ responsive = false, className, ...props }, ref) {
  const table = <table {...props} ref={ref} className={cx("wm-table", className)} />;
  return responsive ? <div className="wm-table-responsive" tabIndex={0}
    role="region" aria-label={props["aria-label"] || "Scrollable table"}>{table}</div> : table;
});
