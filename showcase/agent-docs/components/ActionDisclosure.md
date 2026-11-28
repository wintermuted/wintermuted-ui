# ActionDisclosure

Import `ActionDisclosure` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Required `title` and children; optional `headingLevel` 2-6 (default 3), `headingId`, `defaultExpanded` (default true), `onCollapse()`, decorative `indicator`, `className`, `classNames: {header?,heading?,action?}`. Stable unique panel IDs; keyboard heading button toggles mounted hidden children. Optional `action: {label,icon?,buttonRef?,onClick}` is a sibling Button, never nested in the trigger. Collapse callback runs before scheduling hiding; the action schedules expansion then calls its callback. Post-render focus and domain cleanup belong to the host.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/ActionDisclosure.tsx)
