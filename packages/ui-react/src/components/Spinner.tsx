import type { SpinnerProps } from "../interfaces.js";
import { cx } from "../utils.js";

export function Spinner({ label = "Loading", className, ...props }: SpinnerProps) {
  return <span {...props} role="status" className={cx("wm-spinner", className)}>
    <span aria-hidden className="wm-spinner-indicator" />
    <span className="wm-sr-only">{label}</span>
  </span>;
}
