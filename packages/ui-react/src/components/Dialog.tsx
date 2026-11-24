import { useId, useRef } from "react";
import type * as React from "react";
import type { DialogProps } from "../interfaces.js";
import { cx, useClientLayoutEffect } from "../utils.js";
import { Button } from "./Button.js";

export function Dialog({ open, onClose, title, children, className, ...props }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const restoreTarget = useRef<HTMLElement | SVGElement | null>(null);
  const internalCloses = useRef(0);
  const titleId = useId();
  useClientLayoutEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    if (!restoreTarget.current || !dialog.contains(document.activeElement)) {
      const active = document.activeElement;
      restoreTarget.current = active instanceof HTMLElement || active instanceof SVGElement ? active : null;
    }
    const previous = restoreTarget.current;
    dialog.showModal();
    return () => {
      if (dialog.open) { internalCloses.current += 1; dialog.close(); }
      // Restore after React's commit-time focus restoration, including unmount.
      queueMicrotask(() => {
        if (dialog.open) return;
        if (previous?.isConnected) previous.focus();
        restoreTarget.current = null;
      });
    };
  }, [open]);
  function trapFocus(event: React.KeyboardEvent<HTMLDialogElement>) {
    props.onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== "Tab") return;
    const dialog = event.currentTarget;
    const candidates = Array.from(dialog.querySelectorAll<HTMLElement>(
      "a[href], area[href], button, input, select, textarea, summary, iframe, object, embed, audio[controls], video[controls], [tabindex], [contenteditable='true']",
    )).filter(node => (node.tabIndex >= 0 || (node.isContentEditable && !node.hasAttribute("tabindex")))
      && !node.matches(":disabled")
      && !node.closest("[inert]") && node.getClientRects().length > 0
      && window.getComputedStyle(node).visibility === "visible");
    const tabbable = candidates.filter(node => {
      if (!(node instanceof HTMLInputElement) || node.type !== "radio" || !node.name) return true;
      const group = candidates.filter((other): other is HTMLInputElement => other instanceof HTMLInputElement
        && other.type === "radio" && other.name === node.name && other.form === node.form);
      return node === (group.find(other => other.checked) || group[0]);
    }).sort((a, b) => (a.tabIndex > 0 ? a.tabIndex : Infinity) - (b.tabIndex > 0 ? b.tabIndex : Infinity));
    const first = tabbable[0];
    const last = tabbable[tabbable.length - 1];
    if (!first) { event.preventDefault(); dialog.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
      event.preventDefault(); first.focus();
    }
  }
  return <dialog {...props} ref={ref} aria-labelledby={titleId}
    tabIndex={props.tabIndex ?? -1} onKeyDown={trapFocus}
    className={cx("wm-dialog", className)}
    onCancel={event => {
      props.onCancel?.(event);
      const cancelled = event.defaultPrevented;
      event.preventDefault();
      if (!cancelled) onClose();
    }}
    onClose={() => {
      if (internalCloses.current > 0) internalCloses.current -= 1;
      else if (open) onClose();
    }}>
    <header className="wm-dialog-header"><h3 id={titleId}>{title}</h3>
      <Button variant="ghost" onClick={onClose} aria-label="Close dialog">Close</Button>
    </header>
    <div className="wm-dialog-body">{children}</div>
  </dialog>;
}
