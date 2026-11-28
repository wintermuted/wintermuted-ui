# Dialog

Import `Dialog` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Required controlled `open`, `onClose()` and `title`. Optional `titleId` sets the actual h3 heading ID and dialog `aria-labelledby`; otherwise generated. Optional `closeAction` replaces the default Close button; supply an accessible action wired to the controlled close callback (`null` omits it). Header/body retain theme-owned `.wm-dialog-header`/`.wm-dialog-body` classes for scoped adapter styling. Uses native `dialog.showModal()` for top-layer modality and Escape, plus explicit Tab/Shift+Tab wrapping. Focus returns to the opener on close/unmount. Caller must set open=false in onClose. Native dialog-capable browsers required; no silent non-modal fallback.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/Dialog.tsx)
