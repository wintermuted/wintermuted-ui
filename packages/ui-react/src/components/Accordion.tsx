import type { AccordionProps } from "../interfaces.js";
import { cx } from "../utils.js";

export function Accordion({ title, children, className, ...props }: AccordionProps) {
  return <details {...props} className={cx("wm-accordion", className)}>
    <summary>{title}</summary><div className="wm-accordion-body">{children}</div>
  </details>;
}
