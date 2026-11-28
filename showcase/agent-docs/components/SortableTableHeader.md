# SortableTableHeader

Import `SortableTableHeader` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Renders a `th` with `scope="col"` and `aria-sort`; do not nest it in another header. Supply `column`, `label`, `active`, `direction`, independent `onSort(column)`/`onDirection(column)`, `directionLabel` and decorative `directionIcon`. Callers sort the rows.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/SortableTableHeader.tsx)
