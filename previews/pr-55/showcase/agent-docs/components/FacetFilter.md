# FacetFilter

Import `FacetFilter` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Supplied `options: {value,label,count,disabled?,hidden?}[]`, `selected`, `onChange(values)`, availability and empty/expansion copy. Separate `reset: {label,count,selected,onSelect}`: `all` is an ordinary value. Callers compute counts and keep selected zero-count options enabled/visible if they should remain removable.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/FacetFilter.tsx)
