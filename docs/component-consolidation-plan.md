# Component consolidation evaluation and migration roadmap

## Recommendation

Consolidate **implementations and primitive documentation**, not entire product libraries or Storybooks.

1. Finish adopting primitives that already exist in Wintermuted UI, starting with Inventory.
2. Promote six proven presentation/layout primitives from Icon Builder: **EmptyState, ActionGroup, ResponsiveGrid, SplitLayout, PropertyList, and CodeBlock**.
3. Extend the existing **PageHeader** only enough to support the demonstrated header compositions; do not publish another competing header.
4. Retain domain components and useful product adapters in their projects. Defer interaction-heavy candidates without demonstrated independent reuse or a settled compatible contract.

Both central and distributed Storybooks remain. A transferred primitive's implementation, API documentation, and generic stories become centrally owned. The source project consumes the published component and removes its duplicate implementation and generic primitive story. Product-specific composition stories remain locally owned.

This is a source-based evaluation and proposed roadmap, not authorization to execute migrations. This document does not implement component, consumer, or Storybook changes.

## Confirmed scope

- Inventory, Icon Builder, Game of Life, and Overworld only.
- Central and distributed Storybooks both remain.
- Proven repeated patterns qualify; one-off candidates are deferred.
- User-confirmed extraction threshold: at least three distinct production compositions with the same intent qualify, even within one project. Three story variants or three renders of one component do not qualify. Cross-project reuse strengthens the case but is not required. All six recommended new primitives remain in scope.
- Preserve product appearance and behavior; move no routing, data fetching, storage policy, translations, simulation logic, transit models, or asset-controller logic into the generic library.

Sub Killer and static sites were found during discovery but are excluded by the user's subsequent scope choice. Player Character had only a README on its default branch at the reviewed revision and is also excluded.

## Evidence snapshot

The evaluation was conducted on November 26-27, 2026. Package versions, adoption status, publication observations and recommendations below describe the pinned revisions, not a live inventory. Recheck affected contracts before implementation.

Authenticated GitHub default-branch source reads and an account-wide indexed dependency search identified the consumer packages. Recommendations use component implementations and production callsites, not component names alone. Indexed search was supplemented by direct repository trees and source reads.

| Repository | Reviewed commit | Relationship at reviewed revision |
| --- | --- | --- |
| wintermuted-ui | `1c430e0b23efb38cf1a8a4668597d2ad6e3f444e` | Canonical React primitives, CSS tokens/styles, central Storybook and showcase. |
| Inventory | `7ce47279aeb0b60aa5b259653f87240899037083` | Theme `^0.21.5`; private `ui-staging` and product libraries; no root dependency on ui-react. |
| Icon Builder | `46636b3a330268887491d691f6d24274f61b801b` | Theme `^0.21.5`; private React `ui-components`; no ui-react dependency in the inspected UI/app manifests. |
| Game of Life | `3bbd2ce1174e543e34f76f38615b2bcc9f691bea` | Already consumes ui-react, including ToggleGroup, LanguageSelector and NumberStepper; some local primitives remain. |
| Overworld | `0716a9940a676c74910ea5a00b4db602fe8b3d81` | App consumes ui-react `1.2.0` and theme `1.0.3`; presentation package adapts shared primitives around transit-specific content. |

**Inventory source access:** Inventory is a private repository; readers and review integrations need repository access to follow its evidence links. A 404 without that access does not establish that the pinned revision is missing. On November 27, authenticated repository and commit API reads resolved `7ce47279aeb0b60aa5b259653f87240899037083`. Direct reads of its [root manifest](https://github.com/wintermuted/inventory/blob/7ce47279aeb0b60aa5b259653f87240899037083/package.json) confirmed theme `^0.21.5` and no root ui-react dependency; its UI and FilterPanel sources imported `@inventory/ui-staging`. The [catalog README](https://github.com/wintermuted/inventory/blob/7ce47279aeb0b60aa5b259653f87240899037083/apps/inventory-storybook/README.md) and [production Pages workflow](https://github.com/wintermuted/inventory/blob/7ce47279aeb0b60aa5b259653f87240899037083/.github/workflows/deploy-pages.yml) confirmed PR-only catalogs and no stable production Storybook at that snapshot.

GitHub release records showed ui-react `1.2.1` and ui-theme `1.0.4`. **npm availability was not confirmed:** the configured package proxy returned missing-package/version errors, and direct public-registry queries failed TLS negotiation. Verify installable package versions before dependency changes; a GitHub release alone is not proof of npm publication.

The review did not render the applications or establish visual parity. Browser parity remains an implementation acceptance criterion.

### Follow-up after the evaluation snapshot

Inventory phase-one adoption subsequently merged in [wintermuted/inventory#81](https://github.com/wintermuted/inventory/pull/81) on November 27, 2026, at `03d98424d9a73b8da9e259afa29f463cbac2e24a`. Its [merged manifest](https://github.com/wintermuted/inventory/blob/03d98424d9a73b8da9e259afa29f463cbac2e24a/package.json) consumes the recovered official ui-react `1.2.1` and ui-theme `1.0.4` GitHub tarballs. That supersedes the adoption status in the historical table, not the pinned evidence or remaining roadmap. Stable production Inventory Storybook publication and central composition remain a separate gate; merging primitive adoption does not satisfy it.

## 1. Adopt existing central components instead of transferring duplicates

| Project/local offer | Decision | Important migration boundary |
| --- | --- | --- |
| Inventory `ui-staging/PageHeader`, `Breadcrumbs`, `PreviewImage`, `FilterPanel` | **Adopt existing ui-react exports; then remove staging copies.** These transfers already exist centrally. | Keep router link renderers, recipe/image mapping, kitchen icons/copy, and composition classes in local adapters. |
| Inventory staged `LoadingState` / `ErrorState` | **Compose Spinner and Alert, not two new public state components.** | Keep product LoadingState/ErrorState adapter APIs and storage-recovery instructions. Preserve status versus alert semantics. |
| Icon Builder `Dialog` | **Use central Dialog through a compatibility adapter.** Do not transfer a second modal engine. | Local version is a conditionally mounted div dialog with initialFocus and backdrop dismissal; central version is controlled native dialog. Preserve opening/closing, initial focus, restoration and backdrop behavior explicitly. |
| Icon Builder `Toast` | **Use central Toast; keep timing locally.** | Local duration/resetKey/onDismiss behavior must remain in the host adapter. Central Toast is controlled and also supplies a visible dismissal action. |
| Icon Builder `FormField` | **Converge on FieldGroup with compatible additive changes where required.** | Local controlId maps to htmlFor, but required marker, inline layout, explicit hintId and simultaneous hint/error are not all equivalent today. Do not silently discard them. |
| Icon Builder `IconActionButton` | **Compose Button with icon and an accessible name.** | Keep the project IconName-to-Lucide mapping local. A thin icon adapter may remain; no second generic button implementation or primitive story is needed. |
| Icon Builder `ToggleButton` | **Compose Button with aria-pressed.** | Independent boolean toggles are not mutually exclusive ToggleGroup selections. Preserve cancelled-click handling and native button attributes. |
| Icon Builder `StatusMessage` | **Compose existing feedback primitives where semantics match.** | Preserve inline paragraph layout, role and live-region urgency rather than mechanically applying Alert's default status role to every message. |
| Game of Life `SegmentedControl`, `ColorPaletteSelector`, `LanguageSwitcher` | **Already consolidated; retain useful domain adapters.** | They already use ToggleGroup/LanguageSelector. Palettes, translations and i18next updates belong locally. A forwarding-only SegmentedControl alias can be retired when callsites and stories no longer need its old prop names. |
| Game of Life `ThemeTabs` | **Adopt Tabs; do not promote ThemeTabs.** | Actual consumers switch State/Patterns and Starter/Custom panels. Local implementation supplies tab buttons but not central panel/keyboard contracts. Preserve current panel mounting/reset behavior rather than accidentally retaining state in centrally mounted hidden panels. |
| Game of Life `DisclosureSection` | **Reuse Accordion for simple disclosure; use an isolated sibling action composition for actionable headers.** | Rules locking currently has a disabled button nested in summary and explicitly prevents disclosure toggling. ActionDisclosure currently always expands on action and does not expose action.disabled, so it is not a drop-in replacement. Preserve locking and disabled semantics before removing the local engine. |
| Overworld `PlannerDisclosure`, alert refresh controls, `PlacesLoadStatus` | **Already consolidated; retain adapters and product stories.** | Source imports ActionDisclosure, RefreshAction and LoadStatus. Snapshot retention, map-aware help, entity copy and feed policy are correctly local. |
| Overworld `BookmarkToggle` | **Keep product adapter around Button.** | It already uses central Button. Bookmark icons, wording and saved-entity semantics do not justify a generic BookmarkToggle export. |

Inventory's reviewed Storybook README describes staging as awaiting transfer, while the destination library already documents and implements those transfers. Update that stale boundary documentation during consumer adoption rather than repeating extraction.

## 2. Promote these six proven primitives

These are central implementation candidates, not merely links to remote stories. Canonical styling stays in ui-theme and typed React wrappers stay in ui-react. Reuse existing CSS before adding a competing visual contract.

| Candidate | Proven production reuse | Destination and minimum contract |
| --- | --- | --- |
| **EmptyState** | Icon Builder collection, project steering and unassigned icon-slot states; Game of Life CatalogEmptyState; Inventory matching/catalog empty states. | React wrapper around existing `.wm-empty-state`; supplied heading/content/icon/action nodes and compact presentation. No forced icon library, search/reset logic, domain copy or default live region. |
| **ActionGroup** | Icon Builder asset toolbar, ViewBox actions, source-material actions and new-project actions. | Small layout primitive with native attributes/ref, gap/alignment/justification/wrapping. Reuse central layout conventions and spacing tokens; never own the actions. |
| **ResponsiveGrid** | Icon Builder asset-size comparison, collection assets, steering sources, icon slots and project asset gallery. | Token-backed auto-fit/auto-fill grid with minimum item width and gap. Extend/reuse content-grid/gallery foundations; preserve narrow-container overflow protection. Cards and result selection remain host-owned. |
| **SplitLayout** | Icon Builder project workspace, prompt/documentation guidance and source preview/reference page. | Two-column layout with supplied column sizing, gap and documented responsive collapse variants. Reuse central layout CSS where compatible; do not pretend a fixed-sidebar layout is identical. Keep current breakpoint behavior during migration. |
| **PropertyList** | Icon Builder asset diagnostics, general layer attributes and layer dimension attributes. | Semantic dl/dt/dd, supplied label/value nodes, stable keys and optional gap. Existing native editor controls can remain children supplied through the local portal adapter. Never import SVG attribute models or controller ownership. |
| **CodeBlock** | Icon Builder new-project snippet, source prompt reference and PromptCarousel samples. | Polymorphic preformatted display with optional wrapping; reuse existing central code-block CSS. No clipboard, Mermaid, syntax-highlighter dependency or prompt-specific behavior. |

**Priority:** EmptyState and PropertyList provide the clearest semantic reuse. ActionGroup, ResponsiveGrid, SplitLayout and CodeBlock are lower-risk presentation consolidation, but must not become a second independent styling system.

## 3. Consolidate headers by extending one existing API

Icon Builder uses its PageHeader on asset, source and project pages. Overworld has a separate DetailHeader. Inventory already has an adapter for the central PageHeader.

**Recommendation:** evolve the existing central PageHeader, rather than add AssetHeader or DetailHeader as competing generic exports.

- Preserve today's default h1/string-title behavior.
- Add only demonstrated composition support: explicit heading level, compatible title content, leading/back content and navigation/metadata placement where existing action/description slots are insufficient.
- Keep sticky positioning, app navigation policy, route targets, icon lookup and truncation/layout overrides local unless the same contract is demonstrably reused.
- Convert Icon Builder PageHeader and Overworld DetailHeader into thin product adapters, then eliminate their generic rendering duplication.
- Keep header-specific product stories; move the canonical header API and generic variants into the central Storybook.

This is an API design step, not a mechanical rename: Icon Builder and Overworld currently render h3 titles and different slots.

## 4. Defer these interactions; do not transfer them unchanged

| Candidate | Current evidence / reason to defer | Reconsider when |
| --- | --- | --- |
| Icon Builder editable `NumberStepper` | Native editable/uncontrolled number input with optional bounds/ref access. Central NumberStepper displays a controlled bounded number. Similar names conceal different intent. | Three independent editable-number compositions establish a shared draft/commit contract. If promoted, use a distinct NumberInput API rather than breaking or duplicating the existing stepper name. |
| `RangeNumberControl` | Current source reuse centers on SVG opacity editing; requires draft, numeric/range synchronization and controlled/uncontrolled policy. Inventory's remaining-quantity slider has domain calculation and different UI. | Repeated independent range-plus-number use establishes parity requirements. Do not migrate QuantityFields wholesale. |
| `AnchoredPopover` | Production use inspected is the opacity editor; owns native Popover API positioning, resize/scroll observation and trigger ARIA synchronization. | Multiple unrelated anchored interactive panels need the same controlled opening, collision and focus policy. Do not replace Tooltip or map-positioned overlays by visual similarity. |
| `SplitButton` | Inspected production use is Add Element with shape selection. | Three independent primary-action-plus-selection uses demonstrate a reusable action/selection contract. Existing Button/Menu can compose simpler cases. |
| `InlineRename` / `EditableValue` | Project/source rename and ViewBox editing offer promising shared presentation, but not three equivalent complete edit workflows. Save/cancel copy and focus/busy behavior are also baked in. | A third compatible edit workflow establishes draft, submit, cancel, status and focus-restoration requirements. Supply copy/callbacks; retain network operations locally. |
| `FileDropzone` | One independent grounding-upload workflow demonstrated; repeated selected files do not prove independent reuse. Central theme already has file-upload styling. | Additional independent upload workflows need the same keyboard, disabled, same-file reselection and drag/drop contract. `accept` alone does not validate dropped files. Do not inherit CSS that hides the only keyboard-reachable file input. |
| `ReorderControls` | Current production workflow is SVG layer ordering. | Independent ordered-list workflows share boundary disabling and announcement needs. List reordering and focus preservation must remain explicit. |
| `ResourceLinkList` | Two inspected product contexts; straightforward list/link composition with supplied metadata. | A third genuine use warrants an API beyond existing ListGroup/ListItem and native links. Until then, share existing primitives/CSS. |
| Overworld `GroupedPlaceCategoryFilters` | Mixed-state grouped checkbox selection, patch updates, expanded groups and source status; not the same contract as FacetFilter. | Unrelated grouped-selection consumers prove a generic CheckboxGroup contract. Keep place source availability and selection policy local. |
| Overworld `PlaceResultRow` / `SourceProvenancePanel` | Reused within transit/place contexts; variant names, source-record fields and attribution wording retain domain meaning. | Independent non-place result-row or provenance consumers show the same intent. Existing lists, Accordion, links and future PropertyList can reduce presentation duplication meanwhile. |

Story presence and provider-free props are not sufficient proof that a component belongs in the foundational library.

## 5. Keep these product components distributed

| Project | Correct local ownership |
| --- | --- |
| Inventory | AppShell and branded flavor controls; SearchTypeahead matching/ranking/highlighting and navigation; RecipeCard/RecipePreviewImage adapters; QuantityFields and unit/remaining-quantity calculations; CategoryTabs counts/shared-result-panel adapter; DefrostTimeField; ingredient requirements; shopping list; publication metadata; tags. |
| Game of Life | CanvasGrid/GridMinimap, LifeGrid previews, drawing/stamping controls, rule/simulation settings, PlaybackControls adapter, BoardHeader, pattern cards/forms/catalog toolbar, forks/popularity and diagnostics data. |
| Icon Builder | Icon registry; AppFrame composition; EditorSidebar persistence and fixed asset IDs; PreviewCard/PreviewSurface asset adapters; SelectableListItem drag/mark classes; PreviewBoundary recovery; PromptCarousel clipboard behavior; Diagram/Diagrams rendering and asset specifications; EditorPresentation portals and native-controller bridges. |
| Overworld | DeparturePicker, StopPredictionList, TripOptionPicker, route/arrival indicators, WalkingDistance, TimeDisplay preferences and formatting policy, alert feed compositions, map-layer controls, saved places, place details/search and journey/transit models. |

Local duplication can still be consolidated **inside** each product library:

- Game of Life explicitly marks PatternCard versus ProfileBoardSection and BoardPopularityList versus PlaygroundPatternInfo as `DEDUPLICATE-LATER`. Consolidate those around ui-patterns, not wintermuted-ui.
- Inventory's CategoryTabs and group-tab implementations should share the local counting/result-panel adapter or central Tabs after behavior parity is settled; do not publish kitchen category policy.
- PreviewCard should compose central Card slots; PreviewSurface is a contain/size-controlled display, not equivalent to PreviewImage's cover/failure presentation.
- SelectableListItem is currently a visual-state li, not an accessible selection engine. Compose ListItem locally; do not advertise generic selection behavior that the wrapper does not provide.

## 6. Storybook ownership and consolidation

The central `.storybook/main.ts` already composes production catalogs for Game of Life, Icon Builder and Overworld. Keep those references and independent build/deployment ownership.

| Story kind | Owner after migration |
| --- | --- |
| Generic primitive API, controls, empty/disabled/error states and keyboard interactions | Central Storybook; imports canonical ui-react exports and ui-theme CSS. |
| Product adapter with meaningful policy, copy, icons, routing or data mapping | Product Storybook; imports the local adapter that consumes central primitives. |
| Product screen, workflow and branded composition | Product Storybook. |
| Exact duplicate generic primitive story | Remove from the product catalog after central parity and published consumption; link documentation to the central story instead. Preserve useful old links through documented migration where feasible. |

Do not import applications into central stories, copy product datasets, force one project's icons on others, or create circular Storybook composition.

**Inventory catalog gate:** its reviewed production Pages workflow builds/publishes the app and retained PR previews, not a stable production Storybook. The local README confirms PR-only `/inventory/pr-preview/pr-<number>/storybook/` catalogs. Publish a stable production catalog first, then add it to central refs. Do not use an expiring PR preview as the permanent reference.

Remote stories retain their own styles/providers. A central theme-toolbar selection does not automatically theme composed remote previews.

## 7. Proposed execution order and acceptance

1. **Inventory adoption:** verify installable central versions, upgrade theme/dependencies/imports together, replace staging imports, retain product adapters, and remove unused staging code/stories. This does not depend on the six proposed new primitives.
2. **Existing-control consolidation:** migrate Icon Builder Dialog/Toast/FieldGroup/button compositions and Game of Life Tabs/simple disclosures with contract parity. Existing published APIs can be adopted independently; required API extensions precede the affected consumer changes.
3. **Central presentation extraction:** implement the six recommended generic primitives and compatible PageHeader changes in ui-react/ui-theme, with central stories, showcase documentation and focused tests.
4. **Publication gate:** allow Nx Release to version/publish; confirm both packages are installable. Do not manually bump versions or rely only on GitHub tags.
5. **Consumer adoption:** migrate proven callers in Icon Builder and matching empty/header compositions in Inventory, Game of Life and Overworld. Remove only superseded implementation/CSS/stories after imports and controller selector/ref assumptions have migrated.
6. **Catalog completion:** publish Inventory's stable catalog, add its central ref, and retain all four independent product catalogs. This can proceed independently of component extraction.

Acceptance criteria for implementation:

- Public React APIs use typed TSX, shared interfaces and generated declarations; CSS/tokens remain exclusively in ui-theme. No new router, icon, i18n, data-client or Mermaid requirement for the main entry.
- Each new public component has a dedicated registered React unit test and central generic story; showcase/navigation changes accompany additions.
- Existing component defaults and CSS exports remain compatible. Preserve native attributes/refs, heading semantics, button event cancellation, keyboard behavior and instance-unique IDs.
- Preserve Inventory filter responsiveness, input state, image sizing/fallbacks, counts and routing; preserve Game of Life tab mounting/reset and rules-lock behavior.
- Preserve Icon Builder initial-focus/dialog behavior, timer reset, editable numeric drafts and portal/controller ownership; do not silently replace editable inputs with a numeric readout.
- Verify light/dark appearance, long content and narrow layouts, plus relevant focus/keyboard behavior in source-project stories and workflows. Leave lint, typecheck and builds to CI.
- Remove duplicate primitive implementations and generic stories only after central publication and consuming-code parity. Retain domain adapters and product workflow stories.

## Source references

All consumer links below are pinned to reviewed commits.

- [Central public exports](https://github.com/wintermuted/wintermuted-ui/blob/1c430e0b23efb38cf1a8a4668597d2ad6e3f444e/packages/ui-react/src/index.tsx), [API contracts and completed transfer boundaries](https://github.com/wintermuted/wintermuted-ui/blob/1c430e0b23efb38cf1a8a4668597d2ad6e3f444e/packages/ui-react/README.md), [central Storybook composition](https://github.com/wintermuted/wintermuted-ui/blob/1c430e0b23efb38cf1a8a4668597d2ad6e3f444e/packages/storybook/.storybook/main.ts).
- [Inventory staging imports/adapters](https://github.com/wintermuted/inventory/blob/7ce47279aeb0b60aa5b259653f87240899037083/libs/ui/src/lib/ui.tsx), [FilterPanel adapter](https://github.com/wintermuted/inventory/blob/7ce47279aeb0b60aa5b259653f87240899037083/libs/feature-inventory/src/lib/filter-panel.tsx), [QuantityFields](https://github.com/wintermuted/inventory/blob/7ce47279aeb0b60aa5b259653f87240899037083/libs/feature-inventory/src/lib/quantity-fields.tsx), [catalog ownership](https://github.com/wintermuted/inventory/blob/7ce47279aeb0b60aa5b259653f87240899037083/apps/inventory-storybook/README.md), [production publication](https://github.com/wintermuted/inventory/blob/7ce47279aeb0b60aa5b259653f87240899037083/.github/workflows/deploy-pages.yml).
- [Icon Builder primitives](https://github.com/wintermuted/icon-builder/tree/46636b3a330268887491d691f6d24274f61b801b/packages/ui-components/src), [production compositions](https://github.com/wintermuted/icon-builder/tree/46636b3a330268887491d691f6d24274f61b801b/packages/preview-app/src/ui), [PropertyList attribute/dimension uses](https://github.com/wintermuted/icon-builder/blob/46636b3a330268887491d691f6d24274f61b801b/packages/preview-app/src/editor/layer-row.ts), [diagnostics use](https://github.com/wintermuted/icon-builder/blob/46636b3a330268887491d691f6d24274f61b801b/packages/preview-app/src/editor/diagnostics.ts), [editable numeric bridge](https://github.com/wintermuted/icon-builder/blob/46636b3a330268887491d691f6d24274f61b801b/packages/preview-app/src/editor/fields.ts).
- [Game of Life ToggleGroup adapter](https://github.com/wintermuted/game-of-life/blob/3bbd2ce1174e543e34f76f38615b2bcc9f691bea/packages/ui/src/components/ColorPaletteSelector.tsx), [remaining ThemeTabs](https://github.com/wintermuted/game-of-life/blob/3bbd2ce1174e543e34f76f38615b2bcc9f691bea/packages/ui/src/components/ui/ThemeTabs.tsx), [panel consumers](https://github.com/wintermuted/game-of-life/blob/3bbd2ce1174e543e34f76f38615b2bcc9f691bea/packages/app/src/app/components/playground/DiagnosticsPanel.tsx), [rules disclosure action](https://github.com/wintermuted/game-of-life/blob/3bbd2ce1174e543e34f76f38615b2bcc9f691bea/packages/app/src/app/components/playground/PlaygroundInfoPanel.tsx), [local PatternCard duplication marker](https://github.com/wintermuted/game-of-life/blob/3bbd2ce1174e543e34f76f38615b2bcc9f691bea/packages/ui-patterns/src/components/PatternCard.tsx).
- [Overworld presentation ownership](https://github.com/wintermuted/overworld/blob/0716a9940a676c74910ea5a00b4db602fe8b3d81/packages/presentation/ui/README.md), [PlannerDisclosure adaptation](https://github.com/wintermuted/overworld/blob/0716a9940a676c74910ea5a00b4db602fe8b3d81/packages/presentation/ui/src/journeys/ItineraryPresentation.tsx), [LoadStatus adaptation](https://github.com/wintermuted/overworld/blob/0716a9940a676c74910ea5a00b4db602fe8b3d81/packages/applications/go-by-transit/src/view/nearby/components/PlacesLoadStatus.tsx), [DetailHeader](https://github.com/wintermuted/overworld/blob/0716a9940a676c74910ea5a00b4db602fe8b3d81/packages/presentation/ui/src/DetailHeader.tsx).

## Proposed work

Evaluation is complete. The migration tasks below remain proposed, not started:

- Adopt existing central primitives in Inventory.
- Consolidate existing controls in Icon Builder and Game of Life, resolving compatibility gaps first.
- Extract the six proven presentation primitives.
- Design compatible central PageHeader extensions.
- Publish and confirm installable central packages.
- Migrate consumers and eliminate superseded primitive code/styles/stories.
- Publish and compose Inventory's stable production Storybook.
