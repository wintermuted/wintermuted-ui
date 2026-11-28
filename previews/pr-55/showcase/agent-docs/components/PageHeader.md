# PageHeader

Import `PageHeader` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Required string `title` rendered as h1; optional `eyebrow`, `description`, decorative `icon`, `action`, and additive `classNames` slots (root, eyebrow, title, action). Uses canonical view-header styling; applications own heading hierarchy.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/PageHeader.tsx)
