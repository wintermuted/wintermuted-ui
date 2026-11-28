# NumberStepper

Import `NumberStepper` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Finite `value` within finite `min`/`max`, positive finite `step`, `onChange(value)`, `disabled`, supplied group/button/value labels and decrease/increase icons. Integer and representable fractional steps retain numeric precision; decimal rounding removes ordinary arithmetic noise before clamping to both bounds. Invalid numeric contracts throw. Uses Button and Tooltip; optional `tooltipPlacement` above/right.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/NumberStepper.tsx)
