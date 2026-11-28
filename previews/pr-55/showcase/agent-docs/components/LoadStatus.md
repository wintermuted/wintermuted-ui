# LoadStatus

Import `LoadStatus` from `@wintermuted/ui-react`. Load `@wintermuted/ui-theme/index.css` explicitly; React components do not inject CSS.

## Contract

Readonly `issues: {message,retry?}[]`, optional readonly `warnings`, `loading`, required accessible `labels: {retry,loading}`, optional `retryIcon`, `loadingIcon`, `className`, `renderHelp({message,tone})`. Idle renders nothing; errors use alert, warnings status. Help receives the exact space-joined messages and `"error"`/`"warning"` tone while the same message is announced visually hidden. Each supplied retry runs once per activation; retries disable during loading. Loading without errors gets its own status, even with warnings; loading errors retain their message without a second loading announcement. Clicks/keydown do not activate surrounding disclosures.

## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](https://github.com/wintermuted/wintermuted-ui/blob/main/packages/ui-react/src/components/LoadStatus.tsx)
