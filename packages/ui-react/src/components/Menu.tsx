import { useEffect, useId, useRef, useState } from "react";
import type * as React from "react";
import type { MenuProps } from "../interfaces.js";
import { cx, useClientLayoutEffect } from "../utils.js";
import { Button } from "./Button.js";

export function Menu({ label, items, className, ...props }: MenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>([]);
  const focusLast = useRef(false);
  const enabledItems = () => refs.current.filter(
    (node): node is HTMLButtonElement | HTMLAnchorElement => node !== null && node.getAttribute("aria-disabled") !== "true",
  );
  useClientLayoutEffect(() => {
    if (!open) return;
    const enabled = enabledItems();
    (focusLast.current ? enabled.at(-1) : enabled[0])?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function close(restore = false) {
    setOpen(false);
    if (restore) trigger.current?.focus();
  }
  function navigate(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.key === "Escape") { event.preventDefault(); close(true); return; }
    if (event.key === "Tab") { close(true); return; }
    const enabled = enabledItems();
    const index = enabled.findIndex(node => node === document.activeElement);
    let next: HTMLButtonElement | HTMLAnchorElement | undefined;
    if (event.key === "ArrowDown") next = enabled[(index + 1) % enabled.length];
    if (event.key === "ArrowUp") next = enabled[(index - 1 + enabled.length) % enabled.length];
    if (event.key === "Home") next = enabled[0];
    if (event.key === "End") next = enabled.at(-1);
    if (next) { event.preventDefault(); next.focus(); }
  }
  return <div {...props} ref={root} className={cx("wm-menu", className)}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
    <Button ref={trigger} variant="secondary" aria-haspopup="menu"
      aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => { focusLast.current = false; setOpen(!open); }}
      onKeyDown={event => {
        if (open && event.key === "Escape") { event.preventDefault(); close(true); return; }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault(); focusLast.current = event.key === "ArrowUp"; setOpen(true);
        }
      }}>{label}</Button>
    {open && <ul id={id} role="menu" aria-label={typeof label === "string" ? label : "Actions"}
      className="wm-menu-items" onKeyDown={navigate}>
      {items.map((item, index) => {
        const itemProps = {
          role: "menuitem" as const, tabIndex: -1, "aria-disabled": item.disabled || undefined,
          ref: (node: HTMLButtonElement | HTMLAnchorElement | null) => { refs.current[index] = node; },
          onClick: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
            if (item.disabled) { event.preventDefault(); return; }
            close(true); item.onSelect?.(event);
          },
        };
        return <li key={item.id} role="none">
          {item.href && !item.disabled
            ? <a {...itemProps} href={item.href}>{item.label}</a>
            : <button {...itemProps} type="button">{item.label}</button>}
        </li>;
      })}
    </ul>}
  </div>;
}
