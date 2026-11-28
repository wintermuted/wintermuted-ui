# Breadcrumbs

Import `Breadcrumbs` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Required navigation `label` and readonly `items: {id,label,href?}[]` with stable unique IDs. Native anchors by default; `renderLink(item)` receives a guaranteed href for router adaptation. The final non-link has `aria-current="page"`; custom link renderers own current-link ARIA. Optional additive `className`.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/Breadcrumbs.tsx)
