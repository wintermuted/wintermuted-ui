import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FilterPanelProps } from "../interfaces.js";
import { Button } from "./Button.js";
import { cx } from "../utils.js";

export function FilterPanel({ children, search, summary, labels, toggleIcon, closeIcon, classNames = {} }: FilterPanelProps) {
  const controlsId = useId();
  const [expanded, setExpanded] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closePanel = useCallback(() => {
    setExpanded(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && toolbarRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        closePanel();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [closePanel, expanded]);

  return <div ref={toolbarRef} className={cx("wm-filter-bar", "wm-filter-panel", classNames.toolbar)}>
    <div className={cx("wm-filter-panel-search", classNames.search)}>{search}</div>
    <Button ref={toggleRef} variant="secondary" aria-label={labels.toggle} aria-controls={controlsId}
      aria-expanded={expanded} className={cx("wm-filter-panel-toggle", classNames.toggle)}
      onClick={() => setExpanded(current => !current)}>
      {toggleIcon}<span className={classNames.toggleLabel}>{labels.toggle}</span>
    </Button>
    {expanded ? <button type="button" aria-label={labels.dismiss}
      className={cx("wm-filter-panel-scrim", classNames.scrim)} onClick={closePanel} /> : null}
    <aside id={controlsId} aria-label={labels.panel}
      className={cx("wm-filter-panel-controls", classNames.controls,
        expanded && "wm-filter-panel-controls-open", expanded && classNames.controlsOpen)}>
      <div className={cx("wm-filter-panel-header", classNames.panelHeader)}>
        <strong>{labels.title}</strong>
        <Button variant="ghost" aria-label={labels.close} className={classNames.close} onClick={closePanel}>
          {closeIcon ?? labels.close}
        </Button>
      </div>
      {children}
    </aside>
    {summary != null ? <div className={cx("wm-filter-panel-summary", classNames.summary)}>{summary}</div> : null}
  </div>;
}
