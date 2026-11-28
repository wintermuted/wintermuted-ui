# ProgressBar

Import `ProgressBar` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Native progress element, numeric `value`/`max` (defaults 0/100), accessible `label` or native label/ARIA association. Values clamp to range; nonfinite inputs or nonpositive max throw.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/ProgressBar.tsx)
