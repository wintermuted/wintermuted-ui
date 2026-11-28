# StatCard

Import `StatCard` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

`label`, optional `value` (including zero), children, `tone` and `className`. Default uses the existing centered value-first stat card. `variant="compact"` is a label-first, left-aligned metric with value-only tone.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/StatCard.tsx)
