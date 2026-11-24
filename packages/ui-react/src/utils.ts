import { useEffect, useLayoutEffect } from "react";

export const cx = (...values: (string | false | null | undefined)[]) => values.filter(Boolean).join(" ");
export const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
