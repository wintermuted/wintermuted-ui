import { createElement, forwardRef } from "react";
import type * as React from "react";
import type { Primitive } from "./interfaces.js";
import { cx } from "./utils.js";

export function primitive<Default extends React.ElementType>(tag: Default, baseClass: string): Primitive<Default> {
  // forwardRef erases the relationship between `as`, native props, and the ref.
  return forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }>(
    function Primitive({ as = tag, className, ...props }, ref) {
      return createElement(as, { ...props, ref, className: cx(baseClass, className) });
    },
  ) as Primitive<Default>;
}
