# FieldGroup

Import `FieldGroup` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Required `label` and one control element; optional `htmlFor`, `hint`, `error`, `hintId`, `errorId`. Hint and error render independently and simultaneously; both rendered IDs merge with the control's existing `aria-describedby`. Omitted IDs are generated. Errors set `aria-invalid`; otherwise the control's value is preserved. Custom controls must forward the supplied ID/ARIA props to their input. Error content can supply its own alert semantics; no live region is imposed.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/FieldGroup.tsx)
