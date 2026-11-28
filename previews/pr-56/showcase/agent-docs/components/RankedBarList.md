# RankedBarList

Import `RankedBarList` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Supplied ordered `items: {id,label,value,valueLabel,color?}[]`, accessible `label`, optional `heading`, `empty`, `maximum`, and `minimumWidthPercent` (default 0). Stable unique IDs required. Widths clamp to 100%; zero maximum gives zero widths. Nonfinite/negative scales or values and minimum widths outside 0-100 throw. Callers rank and format data.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/RankedBarList.tsx)
