import { forwardRef } from "react";
import type { BadgeProps } from "../interfaces.js";
import { cx } from "../utils.js";

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ tone = "neutral", className, ...props }, ref) {
  return <span {...props} ref={ref} className={cx("wm-badge", `wm-badge-${tone}`, className)} />;
});
