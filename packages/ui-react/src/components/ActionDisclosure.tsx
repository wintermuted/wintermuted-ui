import { useId, useState } from "react";
import type { ActionDisclosureProps } from "../interfaces.js";
import { cx } from "../utils.js";
import { Button } from "./Button.js";

const headings = { 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

export function ActionDisclosure({
  title, children, headingLevel = 3, headingId, defaultExpanded = true,
  onCollapse, indicator, action, className, classNames,
}: ActionDisclosureProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const Heading = headings[headingLevel];

  return <div className={cx("wm-action-disclosure", className)}>
    <header className={cx("wm-action-disclosure-header", classNames?.header)}>
      <Heading id={headingId} className={cx("wm-action-disclosure-heading", classNames?.heading)}>
        <Button variant="ghost" className="wm-action-disclosure-trigger"
          aria-controls={panelId} aria-expanded={expanded}
          onClick={() => {
            if (expanded) onCollapse?.();
            setExpanded(!expanded);
          }}>
          <span className="wm-action-disclosure-indicator" aria-hidden="true">
            {indicator ?? <svg viewBox="0 0 8 12" width="8" height="12" focusable="false">
              <path d="M0 0 8 6 0 12Z" fill="currentColor" />
            </svg>}
          </span>
          {title}
        </Button>
      </Heading>
      {action && <Button variant="ghost"
        className={cx("wm-action-disclosure-action", classNames?.action)}
        ref={action.buttonRef} aria-label={action.label} title={action.label} icon={action.icon}
        onClick={() => {
          setExpanded(true);
          action.onClick();
        }}>
        {action.icon ? null : action.label}
      </Button>}
    </header>
    <div id={panelId} hidden={!expanded}>{children}</div>
  </div>;
}
