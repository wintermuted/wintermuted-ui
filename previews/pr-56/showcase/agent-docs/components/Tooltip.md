# Tooltip

Import `Tooltip` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

`text` and one focusable element child that forwards ARIA props. Visible on focus/hover, Escape dismisses, descriptions are merged. Do not put interactive content in tooltips or use a tooltip as the only accessible name.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/Tooltip.tsx)
