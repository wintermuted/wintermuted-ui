# LanguageSelector

Import `LanguageSelector` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Supplied `options: {value,label,disabled?}[]`, controlled `value`/`onChange`, `label`, optional `className`, `variant` native (default) or dropup. The popup trigger's accessible name includes the selected label. Popup Arrow Up/Down, Home/End skip disabled options; enabled-option focus survives parent rerenders; Escape, Tab, outside click and selection dismiss. Callers own locale normalization and translation updates.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/LanguageSelector.tsx)
