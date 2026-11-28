# PreviewImage

Import `PreviewImage` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Required nullable `src`, `alt`, `fallbackLabel` and fallback node. Missing/empty URLs or load failure render a labeled image-role fallback; a changed source retries, an unchanged failed source stays failed. Optional `className`, `fallbackClassName`, `loading` (lazy default/eager). Gallery defaults size image and fallback consistently; applications own image URLs and sizing overrides.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/PreviewImage.tsx)
