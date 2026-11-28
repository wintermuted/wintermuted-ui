# FilterPanel

Import `FilterPanel` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Required search node, children and `labels: {toggle,panel,title,dismiss,close}`; optional summary, decorative toggle/close icons and additive class slots. Responsive non-modal disclosure: inline above 48rem; collapsed controls are CSS-hidden below. Inputs stay mounted; close, scrim and Escape within focused disclosure content restore toggle focus. Handled Escape is respected and consumed when dismissing, so a containing Dialog stays open. Instances dismiss independently. Long mobile panels use document scrolling, not an internal clipping scroller, so child popups can extend outside the panel. No focus trap, initial focus move or scroll lock; use Dialog for modality.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/FilterPanel.tsx)
