import type { ProgressBarProps } from "../interfaces.js";
import { cx } from "../utils.js";

export function ProgressBar({ value = 0, max = 100, label, className, ...props }: ProgressBarProps) {
  if (!Number.isFinite(max) || max <= 0 || !Number.isFinite(value)) {
    throw new RangeError("ProgressBar requires a finite value and a positive finite max.");
  }
  return <progress {...props} className={cx("wm-progress", className)}
    value={Math.min(max, Math.max(0, value))} max={max} aria-label={label ?? props["aria-label"]} />;
}
