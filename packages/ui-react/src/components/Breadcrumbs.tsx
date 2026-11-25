import type { BreadcrumbsProps } from "../interfaces.js";
import { Nav } from "./Nav.js";
import { cx } from "../utils.js";

export function Breadcrumbs({ items, label, className, renderLink }: BreadcrumbsProps) {
  return <Nav aria-label={label} className={cx("wm-breadcrumbs", className)}>
    <ol>
      {items.map((item, index) => <li key={item.id}>
        {item.href !== undefined
          ? renderLink ? renderLink({ ...item, href: item.href }) : <a href={item.href}>{item.label}</a>
          : <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.label}</span>}
      </li>)}
    </ol>
  </Nav>;
}
