import { forwardRef } from "react";
import type { AlertProps } from "../interfaces.js";
import { cx } from "../utils.js";

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert({ tone = "info", className, role = "status", ...props }, ref) {
  return <div {...props} ref={ref} role={role} className={cx("wm-alert", `wm-alert-${tone}`, className)} />;
});
