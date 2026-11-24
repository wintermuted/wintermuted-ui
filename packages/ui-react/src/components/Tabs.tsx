import { useId, useRef, useState } from "react";
import type * as React from "react";
import type { TabItem, TabsProps } from "../interfaces.js";
import { cx } from "../utils.js";

export function Tabs({ items, value, defaultValue, onValueChange, label, className, ...props }: TabsProps) {
  const prefix = useId();
  const [internal, setInternal] = useState(defaultValue);
  const requested = value === undefined ? internal : value;
  const active = items.find(item => item.id === requested && !item.disabled)?.id
    ?? items.find(item => !item.disabled)?.id;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function activate(item: TabItem) {
    if (value === undefined) setInternal(item.id);
    onValueChange?.(item.id);
  }
  function navigate(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const enabled = items.map((item, i) => item.disabled ? -1 : i).filter(i => i !== -1);
    const position = enabled.indexOf(index);
    let target: number | undefined;
    if (event.key === "ArrowRight") target = enabled[(position + 1) % enabled.length];
    if (event.key === "ArrowLeft") target = enabled[(position - 1 + enabled.length) % enabled.length];
    if (event.key === "Home") target = enabled[0];
    if (event.key === "End") target = enabled[enabled.length - 1];
    if (target === undefined) return;
    event.preventDefault();
    refs.current[target]?.focus();
    activate(items[target]);
  }
  return <div {...props} className={cx("wm-tabs", className)}>
    <div role="tablist" aria-label={label} className="wm-tab-bar">
      {items.map((item, index) => <button
        key={item.id} id={`${prefix}-tab-${item.id}`} type="button" role="tab"
        aria-selected={active === item.id} aria-controls={`${prefix}-panel-${item.id}`}
        tabIndex={active === item.id ? 0 : -1} disabled={item.disabled}
        className={cx("wm-tab-btn", active === item.id && "wm-tab-btn-active")}
        ref={node => { refs.current[index] = node; }}
        onKeyDown={event => navigate(event, index)} onClick={() => activate(item)}>
        {item.label}
      </button>)}
    </div>
    {items.map(item => <div key={item.id} id={`${prefix}-panel-${item.id}`}
      role="tabpanel" aria-labelledby={`${prefix}-tab-${item.id}`}
      hidden={active !== item.id} tabIndex={0} className="wm-tab-panel">{item.content}</div>)}
  </div>;
}
