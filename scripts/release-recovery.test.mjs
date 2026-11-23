import assert from "node:assert/strict";
import { test } from "node:test";
import { recoverySource } from "./release-recovery.mjs";

const run = { path: ".github/workflows/auto-release.yml", event: "push", head_branch: "main",
  head_repository: { full_name: "wintermuted/wintermuted-ui" }, status: "completed", conclusion: "failure",
  head_sha: "b051c09020072f2224d38a31bc89c9c42a3d6155" };
const legacy = { sourceRun: "45091280105", project: "ui-react", version: "1.0.0" };

test("interrupted artifact recovery preserves the original source and requested version", () => {
  assert.deepEqual(recoverySource({ preparedRun: "123", project: "ui-react", version: "1.0.0" }, run),
    { ref: run.head_sha, version: "1.0.0", mode: "artifact" });
  assert.deepEqual(recoverySource(legacy, run), { ref: run.head_sha, version: "1.0.0", mode: "legacy" });
});

test("artifact-free bootstrap cannot publish theme, bump versions, or use uninspected source", () => {
  for (const input of [
    { ...legacy, project: "ui-theme" }, { ...legacy, version: "1.0.1" },
    { ...legacy, sourceRun: "123" }, { ...legacy, tag: "ui-react@1.0.0" }
  ]) assert.throws(() => recoverySource(input, run), /limited|exactly one/);
  for (const changed of [
    { ...run, head_sha: "a".repeat(40) }, { ...run, path: ".github/workflows/other.yml" },
    { ...run, head_repository: { full_name: "other/repo" } }, { ...run, status: "in_progress" }
  ]) assert.throws(() => recoverySource(legacy, changed), /limited|completed Auto Release/);
});

test("tag recovery rejects ambiguous or mismatched identities", () => {
  assert.deepEqual(recoverySource({ tag: "ui-react@1.0.0", project: "ui-react" }),
    { ref: "ui-react@1.0.0", version: "1.0.0", mode: "tag" });
  for (const input of [
    { tag: "ui-theme@1.0.0", project: "ui-react" },
    { tag: "main", project: "ui-react" }, { project: "ui-react" },
    { tag: "ui-react@1.0.0", project: "ui-react", version: "1.0.1" }
  ]) assert.throws(() => recoverySource(input), /Tag|exactly one/);
});
