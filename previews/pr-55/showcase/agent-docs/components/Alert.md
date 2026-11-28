# Alert

Import `Alert` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

`tone`: neutral, info, success, warning, danger. Alert defaults to `role="status"`; opt into `role="alert"` for urgent messages.

Related exports in this contract: [Badge](./Badge.md).

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/Alert.tsx)
