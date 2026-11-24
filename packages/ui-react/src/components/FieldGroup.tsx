import { Children, cloneElement, useId } from "react";
import type * as React from "react";
import type { ControlProps, FieldGroupProps } from "../interfaces.js";
import { cx } from "../utils.js";

export function FieldGroup({ label, htmlFor, hint, error, className, children, ...props }: FieldGroupProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const child = Children.only(children) as React.ReactElement<ControlProps>;
  const controlId = htmlFor || child.props.inputId || child.props.id || `${id}-control`;
  const describedBy = cx(child.props["aria-describedby"], (hint || error) ? descriptionId : undefined) || undefined;
  return <div {...props} className={cx("wm-field", className)}>
    <label htmlFor={controlId}>{label}</label>
    {cloneElement(child, {
      id: controlId, "aria-describedby": describedBy,
      ...(child.props.inputId !== undefined ? { inputId: controlId } : {}),
      "aria-invalid": error ? true : child.props["aria-invalid"],
    })}
    {(hint || error) && <div id={descriptionId} className={error ? "wm-field-error" : "wm-field-hint"}>{error || hint}</div>}
  </div>;
}
