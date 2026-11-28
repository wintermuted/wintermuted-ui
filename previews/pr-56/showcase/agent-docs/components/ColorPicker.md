# ColorPicker

Import `ColorPicker` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Controlled six-digit hex `value`, labeled `groups`/choices, `onSelect(value,groupId,index)`, `onChange(value)`, optional Enter-only `onCommit(value)`. Required `label`, `inputLabel`, `hexLabel`, `invalidLabel`; optional unique `inputId`, `disabled`, `placement` (above/right), `className`, `triggerClassName`. Supply `draftValue` and `onDraftChange` together to retain unfinished drafts across unmounts. Invalid drafts stay visible with an associated error; valid blur normalizes without firing `onCommit`. Escape, outside click and swatch selection close the popup.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/ColorPicker.tsx)
