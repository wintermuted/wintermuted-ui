# Toast

Import `Toast` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Controlled `open`, supplied `message`, optional action node, `tone` (success default), `onDismiss()` and `dismissLabel`. Hidden notices are hidden and inert; applications own dismissal timers and navigation.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/Toast.tsx)
