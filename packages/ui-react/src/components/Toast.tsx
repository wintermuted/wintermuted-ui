import type { ReactElement } from "react";

import type { ToastProps } from "../interfaces.js";

export function Toast({
  open,
  message,
  action,
  tone = "success",
  onDismiss,
  dismissLabel,
}: ToastProps): ReactElement {
  return (
    <div
      className={`wm-toast wm-toast-${tone}${open ? " wm-toast-visible" : ""}`}
      role="status"
      aria-live="polite"
      aria-hidden={!open}
      hidden={!open}
      ref={(element) => { element?.toggleAttribute("inert", !open); }}
    >
      <span>{message}</span>
      {action}
      <button
        className="wm-toast-dismiss"
        type="button"
        aria-label={dismissLabel}
        onClick={onDismiss}
      >
        &#x2715;
      </button>
    </div>
  );
}
