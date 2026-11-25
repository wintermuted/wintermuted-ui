import type { PageHeaderProps } from "../interfaces.js";
import { cx } from "../utils.js";

export function PageHeader({ title, eyebrow, description, icon, action, classNames = {} }: PageHeaderProps) {
  return <header className={cx("wm-view-header", "wm-page-header", classNames.root)}>
    <div>
      {eyebrow ? <p className={cx("wm-page-header-eyebrow", classNames.eyebrow)}>{eyebrow}</p> : null}
      <div className={cx("wm-page-header-title", classNames.title)}>{icon}<h1>{title}</h1></div>
      {description != null ? <p>{description}</p> : null}
    </div>
    {action != null ? <div className={cx("wm-page-header-action", classNames.action)}>{action}</div> : null}
  </header>;
}
