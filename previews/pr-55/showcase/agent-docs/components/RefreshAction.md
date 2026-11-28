# RefreshAction

Import `RefreshAction` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Required `loading`, `error`, `onRefresh(event)` and `labels: {idle,loading,retry}` accepting React nodes. Loading takes precedence and disables interaction; caller `disabled` is preserved. Composes Button with native props, styling, icons and forwarded ref; always `type="button"` and `aria-busy` reflects loading.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/RefreshAction.tsx)
