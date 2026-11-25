import { Children, cloneElement, useEffect, useId, useState } from "react";
import type * as React from "react";
import type { TooltipProps } from "../interfaces.js";
import { cx } from "../utils.js";

export function Tooltip({ text, children, placement = "above" }: TooltipProps) {
  const id = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const visible = (hovered || focused) && !dismissed;
  const child = Children.only(children) as React.ReactElement<React.AriaAttributes>;
  useEffect(() => {
    if (!visible) return;
    const dismiss = (event: KeyboardEvent) => { if (event.key === "Escape") setDismissed(true); };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [visible]);
  return <span className="wm-tooltip-anchor"
    onKeyDown={event => { if (event.key === "Escape") setDismissed(true); }}
    onMouseEnter={() => { setHovered(true); setDismissed(false); }}
    onMouseLeave={() => setHovered(false)}
    onFocus={() => { setFocused(true); setDismissed(false); }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    {cloneElement(child, { "aria-describedby": cx(child.props["aria-describedby"], visible && id) || undefined })}
    {visible && <span id={id} role="tooltip" className={cx("wm-tooltip", placement === "right" && "wm-tooltip-right")}>{text}</span>}
  </span>;
}
