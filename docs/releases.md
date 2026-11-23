# Release runbook

Nx Release owns package versions, dependency-range updates, changelogs, npm publication, and GitHub releases. The checked-in workflow publishes `ui-theme` and `ui-react` independently after compatibility checks. It does not publish the private root or showcase.

This guide describes the 1.0 release configuration. A manifest version or successful Pages deployment is not evidence that a package has been published.

## Release identities and artifacts

| Package | Source manifest | Published content | Tag |
| --- | --- | --- | --- |
| `@wintermuted/ui-theme` | `packages/ui-theme/package.json` | CSS, the CSS-loading root, README, and license | `ui-theme@X.Y.Z` |
| `@wintermuted/ui-react` | `packages/ui-react/package.json` | Staged ESM, declarations, manifest, README, and license | `ui-react@X.Y.Z` |

Versions are independent: a React-only change need not bump the theme. When the theme changes, Nx may also update the dependent React package and its required theme range. `preserveMatchingDependencyRanges` is disabled so an out-of-range major dependency update can be written instead of blocking release preparation.

Legacy `vX.Y.Z` theme tags are retained. Do not rewrite them, move an existing package tag, or reuse an npm version for different content.

## Configuration map

| File | Responsibility |
| --- | --- |
| `nx.json` | Released projects, independent versions, tag format, conventional commits, dependency updates, changelogs |
| `packages/*/package.json` | Public exports, package files, dependencies, pack/publish targets |
| `scripts/release.mjs` | Dry run, preparation state, and GitHub release finalization |
| `scripts/release-baseline.mjs` | Temporary legacy and first-React baselines |
| `scripts/stage-react.mjs` | Assemble the React package without bundling peers |
| `.github/workflows/react-package.yml` | Compatibility workflow reused as the release gate |
| `.github/workflows/auto-release.yml` | Publication, atomic Git push, finalization, and theme downstream dispatch |
| `.github/workflows/publish-package.yml` | Republish an existing tagged package without changing versions |
| `.github/workflows/bump-downstream.yml` | Notify configured downstream theme consumers |

## Version selection

Use conventional commits and preserve the intended message when squashing a PR:

| Change | Example merge message | Expected selection |
| --- | --- | --- |
| Bug fix | `fix: correct dialog focus restoration` | Patch for affected released projects |
| New compatible feature | `feat: add a component variant` | Minor for affected released projects |
| Removed export or incompatible API | `feat!: separate CSS theme from React integration` | Major for affected released projects |
| Non-releasable maintenance | `chore: update repository tooling` | No bump unless other releasable changes exist |

A `BREAKING CHANGE:` footer is another way to express a breaking release. A message alone does not select every package: Nx combines commit history with affected project files and dependency relationships. Review the dry-run output rather than assuming a version from the PR title.

Zero-major adjustment is disabled. A major selection from theme 0.22.0 becomes 1.0.0, not another 0.x minor.

### The initial 1.0 split

Both source manifests were set to 1.0.0 through Nx Release's explicit version command, without creating release tags or publishing locally. Preserve an unscoped breaking merge message for the split so automated preparation selects 1.0.0 from the previous theme and initial React baselines.

Before the first standalone React release, the wrapper finds the commit that introduced `packages/ui-react/package.json` and temporarily tags that commit with its original version. It does not use the newly bumped manifest as the historical baseline. Once a real reachable `ui-react@...` release exists, that tag becomes the baseline.

For theme history without an Nx tag, the wrapper temporarily maps the latest reachable legacy `v...` tag to the equivalent `ui-theme@...` tag. Temporary tags are removed after success or failure. Missing history fails explicitly rather than silently treating the theme as a new package.

## Before merging

Confirm the public package boundary, update directly related documentation, and include migration instructions for breaks. For this split, external React consumers must migrate all removed subpaths, not merely upgrade the CSS dependency.

Check the CI results, including the separate CSS lint workflow. Auto Release directly waits for the reusable React/package compatibility job; it does not depend on the separate lint or Pages jobs. Branch protection should enforce the required checks before merge.

Preview version selection without publication:

```sh
npm run release -- --dry-run
```

Use a checkout with full reachable release history. Uncommitted edits are not conventional-commit history; preview a committed candidate when checking its release selection. The dry run does not change manifests or publish, and cleans up temporary baseline tags.

Lint, typecheck, and builds remain CI responsibilities. The runbook commands below describe workflow operations, not a requirement to run them locally before every commit.

## Automated release sequence

```mermaid
flowchart TD
    Merge["Push to main"] --> Checks["Compatibility workflow"]
    Checks --> Prepare["Nx preparation: versions, ranges, changelogs, local commit + tags"]
    Prepare --> Changes{"Any package changed?"}
    Changes -->|"No"| Stop["Finish without publication"]
    Changes -->|"Yes"| Stage["Stage React using prepared manifest"]
    Stage --> Trusted["Publish selected packages with provenance / trusted publishing"]
    Trusted --> Result{"Publication succeeded?"}
    Result -->|"No"| Token["Retry with NPM_TOKEN fallback"]
    Token --> Retry{"Publication succeeded?"}
    Retry -->|"No"| Block["Fail: do not push release commit or tags"]
    Result -->|"Yes"| Push["Atomically push release commit + package tags"]
    Retry -->|"Yes"| Push
    Push --> Finalize["Create GitHub package releases"]
    Finalize --> Theme{"Theme released?"}
    Theme -->|"Yes"| Notify["Dispatch downstream theme update"]
    Theme -->|"No"| Done["Finish React-only release"]
```

Auto Release runs on pushes to `main` and serializes releases through its concurrency group. The release job uses the GitHub environment `wintermuted-ui-theme` for both packages.

The wrapper has three modes:

| Mode | Effect |
| --- | --- |
| `--dry-run` or no flag | Preview versions/changelogs; skip publication and persistent version writes |
| `--prepare` | Require a clean checkout, run Nx version/changelog preparation, create local commit/tags, save state |
| `--finalize` | Require saved state matching HEAD; create GitHub releases without re-versioning or pushing |

Preparation writes `.nx/release-state.json` with the baseline commit, project version data, and prepared commit. Workflow outputs distinguish any release (`released`) from a theme release (`theme_released`), and include the package tags to push. Finalization depends on that state; a fresh tagged checkout alone cannot reconstruct it.

React is staged **after** version preparation so `dist/packages/ui-react/package.json` contains the released version and current dependency ranges, not stale compatibility-build metadata.

The release commit and all selected package tags are pushed together with `git push --atomic`. This protects Git references only. npm publication is a separate external operation and is not transactional across packages.

## Publication prerequisites

Both packages publish publicly to npm. The release runner installs npm 11.5.1, enables provenance, and grants `id-token: write` for trusted publishing.

Configure npm trusted publishing separately for each package, using the repository and Auto Release workflow identity and matching environment where required. The new React package needs its own configuration; the theme's configuration does not authorize it automatically. If the initial package cannot yet use trusted publishing, provide an authorized `NPM_TOKEN` fallback for the first publication.

Keep `NPM_TOKEN` and `DOWNSTREAM_PAT` in GitHub secrets with the required package/repository permissions. Do not put credentials in manifests, logs, examples, or release state. GitHub's workflow token supplies Git pushes and GitHub release creation; npm authorization is separate.

For terminal GitHub operations on wintermuted-owned repositories, use wintermuted's authorized credentials. Copilot account selection is separate from repository publication identity.

## First stable release checklist

Before announcing 1.0:

1. Verify the split's breaking merge message and dry-run selections for both packages.
2. Confirm npm publication access for both package names, especially the new React package.
3. Let Auto Release publish both packages and push their release commit/tags.
4. Confirm the registry versions, package dependency ranges, and successful GitHub releases.
5. Migrate Overworld using the [1.0 guide](migration-to-v1.md); keep other React consumers on 0.x until both packages are available.

Registry verification is read-only:

```sh
npm view @wintermuted/ui-theme@1.0.0 version
npm view @wintermuted/ui-react@1.0.0 version dependencies peerDependencies
```

The automatic downstream matrix currently includes `wintermuted/cv` and `wintermuted/sub-killer`, not Overworld or every discovered theme consumer. Their repository dispatch handlers control what happens next; a successful dispatch is not a completed consumer migration.

## Recovery

Identify the failed stage and inspect npm and GitHub before retrying. Never infer that nothing published merely because the overall job failed.

| Failure | What may already exist | Response |
| --- | --- | --- |
| Compatibility or preparation | No publication from this run | Fix the reported source/configuration problem and rerun CI. |
| Trusted npm attempt | Some package versions may exist | Inspect the fallback result and registry before further action. |
| Both npm attempts | One package may have published; Git refs have not been pushed by this run | Correct permissions/content problems, then recover the failed release run. Do not reuse a published version with different content. |
| Atomic Git push | npm packages may exist; release Git refs were not updated by that push | Resolve remote advancement/access issues and verify the exact published content before retrying. Do not force-push main. |
| GitHub finalization | npm packages and Git tags exist | Recover GitHub release creation using the prepared state from the same release context or deliberate maintainer recovery; do not republish just to create a release page. |
| Downstream dispatch | Packages, tags, and GitHub releases exist | Retry the dispatch for the existing theme version; do not create another package release. |

If main advanced after a failed run, do not blindly rerun an older preparation and publish different content under an existing npm version. Compare the release logs, manifests, tags, and registry first. A published npm version is immutable.

### Existing-tag publication recovery

The manual **Publish package (recovery)** workflow accepts an existing matching package tag and a package selection. It checks out that tag, verifies the manifest version, stages React when selected, and publishes only that project through Nx. It defaults to a dry run and never bumps versions.

Preview a tagged React publication:

```sh
gh workflow run publish-package.yml --repo wintermuted/wintermuted-ui -f release_tag=ui-react@1.0.0 -f project=ui-react -f dry_run=true
```

After inspecting the preview, a maintainer can deliberately invoke it with `dry_run=false`. A theme recovery uses `project=ui-theme` and a matching theme tag.

This workflow cannot recover a tag that was never pushed, create missing GitHub releases, or dispatch downstream updates. Those are different failure stages. It uses the npm token path with provenance, so verify that the recovery environment has valid publication authorization.

### Downstream dispatch recovery

For an already-published theme release:

```sh
gh workflow run bump-downstream.yml --repo wintermuted/wintermuted-ui -f version=1.0.0 -f release_tag=ui-theme@1.0.0
```

Do not dispatch a theme bump for a React-only release. Auto Release explicitly calls this workflow because GitHub releases created with the workflow token do not trigger another release-event workflow.

## What release automation does not do

It does not migrate consumer imports, guarantee publication is atomic across npm packages, validate external applications, or turn Pages deployment into an npm release. A dependency bump in a consumer is not sufficient for a breaking API migration.

For Overworld, upgrade imports and manifests together only after both packages are available. For release rollback, restore consumer versions and code together; do not move tags or attempt to overwrite an npm version.
