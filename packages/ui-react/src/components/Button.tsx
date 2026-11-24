import { forwardRef } from "react";
import type { ButtonProps } from "../interfaces.js";
import { cx } from "../utils.js";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "primary", size, icon, className, children, type = "button", ...props
}, ref) {
  return <button {...props} ref={ref} type={type}
    className={cx("wm-btn", `wm-btn-${variant}`, size && `wm-btn-${size}`, className)}>
    {icon && <span aria-hidden className="wm-btn-icon">{icon}</span>}{children}
  </button>;
});
