import type { ReactElement } from "react";

import type { StatCardProps } from "../interfaces.js";

export function StatCard({
  label,
  value,
  children,
  tone = "neutral",
  variant = "default",
  className = "",
}: StatCardProps): ReactElement {
  return (
    <article className={`wm-stat-card${tone !== "neutral" ? ` wm-stat-card-${tone}` : ""}${variant === "compact" ? " wm-stat-card-compact" : ""} ${className}`}>
      {variant === "compact" && <p className="wm-stat-label">{label}</p>}
      {value !== undefined && (
        <p className="wm-stat-value">{value}</p>
      )}
      {variant === "default" && <p className="wm-stat-label">{label}</p>}
      {children}
    </article>
  );
}
