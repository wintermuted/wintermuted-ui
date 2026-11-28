# Menu

Import `Menu` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

`label` trigger; `items: {id,label,onSelect?,href?,disabled?}[]`. Arrow Up/Down, Home/End, Escape and Tab; closes on selection, outside click or focus leaving. For router navigation use `onSelect` or compose ordinary links in Nav.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/Menu.tsx)
