# Documentation

Wintermuted UI separates visual styling from optional React behavior. Use the CSS theme in any application; add the React package when you need components, accessible interactions, or theme preference helpers.

## Start here

| Your goal | Read |
| --- | --- |
| Integrate components through agent chat | [Agent usage and documentation](agent-usage.md) |
| Upgrade an existing 0.x consumer | [Migrating to 1.0](migration-to-v1.md) |
| Understand package ownership and dependency direction | [Architecture](architecture.md) |
| Evaluate shared-component migrations across consumer projects | [Component consolidation plan](component-consolidation-plan.md) |
| Extend tokens, CSS layers, or component styles | [Theme architecture](../packages/ui-theme/docs/architecture.md) |
| Extend React behavior, declarations, or theme synchronization | [React architecture](../packages/ui-react/docs/architecture.md) |
| Prepare, publish, or recover a package release | [Release runbook](releases.md) |
| Import CSS, tokens, or individual stylesheets | [Theme package](../packages/ui-theme/README.md) |
| Use React components, searchable selects, or SSR theme helpers | [React package](../packages/ui-react/README.md) |
| Set up the monorepo and run the showcase | [Repository guide](../README.md) |
| Explore the visual components | [Interactive showcase](https://wintermuted.github.io/wintermuted-ui/showcase/) |

## Package selection

| Consumer | Packages | Responsibility |
| --- | --- | --- |
| Plain HTML, server-rendered pages, or a non-React framework | `@wintermuted/ui-theme` | Load CSS and use theme tokens/classes. |
| React application | `@wintermuted/ui-react`, `@wintermuted/ui-theme`, React and React DOM | Load CSS explicitly; import behavior from `ui-react`. |
| React searchable-select consumer | `@wintermuted/ui-react-select`, `@wintermuted/ui-theme`, React, React DOM, and `react-select` | Import `MultiSelect` from `ui-react-select`; core ui-react is not required. |

The React package depends on the theme, never the reverse. Theme 1.0 removes the old React subpaths rather than retaining forwarding shims; existing consumers must follow the migration guide.

## Documentation boundaries

The package READMEs describe public APIs. The central architecture guide explains workspace relationships; nested package architecture guides explain implementation and contribution boundaries. The release runbook describes the checked-in automation and its failure modes. The migration guide describes the intentional 1.0 break and consumer upgrade sequence.

The `docs` directory is rendered on GitHub, not built into the HTML showcase. The showcase links to the migration guide; production and PR preview deployments remain separate from npm publication. Documentation describes the changes in this branch, not proof that those versions have already been published.
