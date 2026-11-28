# Tabs

Import `Tabs` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Required `label` and `items: {id,label,content,disabled?}[]`; optional controlled `value`, uncontrolled `defaultValue`, `onValueChange(id)`. Unique stable IDs required. Arrow Left/Right, Home/End skip disabled tabs. Inactive panels stay mounted and hidden.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/Tabs.tsx)
