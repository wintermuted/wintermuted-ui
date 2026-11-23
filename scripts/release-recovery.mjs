import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const legacyRun = "45091280105";
const legacyCommit = "b051c09020072f2224d38a31bc89c9c42a3d6155";

export function recoverySource({ tag = "", preparedRun = "", sourceRun = "", project, version }, run) {
  if (!["ui-theme", "ui-react"].includes(project)) throw new Error("Invalid recovery project.");
  if ([tag, preparedRun, sourceRun].filter(Boolean).length !== 1) {
    throw new Error("Choose exactly one existing tag, prepared run, or legacy source run.");
  }
  if (tag) {
    if (!new RegExp(`^${project}@\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?$`).test(tag)) throw new Error("Tag does not match the selected project.");
    if (version && tag !== `${project}@${version}`) throw new Error("Tag does not match the requested version.");
    return { ref: tag, version: tag.slice(project.length + 1), mode: "tag" };
  }
  if (!/^\d+$/.test(preparedRun || sourceRun) || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error("Run recovery requires a numeric run ID and an exact version.");
  }
  const autoRelease = run?.path === ".github/workflows/auto-release.yml" &&
    run.event === "push" && run.head_branch === "main";
  const recovery = run?.path === ".github/workflows/publish-package.yml" &&
    run.event === "workflow_dispatch";
  if (!run || (!autoRelease && !(preparedRun && recovery)) ||
      run.head_repository?.full_name !== "wintermuted/wintermuted-ui" ||
      run.status !== "completed" || !/^[0-9a-f]{40}$/.test(run.head_sha)) {
    throw new Error("Recovery must reference a completed Auto Release or package recovery run from this repository.");
  }
  if (sourceRun && (sourceRun !== legacyRun || run.head_sha !== legacyCommit ||
      run.conclusion !== "failure" || project !== "ui-react" || version !== "1.0.0")) {
    throw new Error("Artifact-free recovery is limited to the inspected React 1.0.0 interrupted release.");
  }
  if (sourceRun) return { ref: run.head_sha, version, mode: "legacy" };
  return { ref: run.head_sha, version, mode: "artifact",
    artifact: recovery ? "recovery-packages" : "prepared-release",
    attempts: recovery ? "recovery-publication-attempts" : "publication-attempts" };
}

function main() {
  const preparedRun = process.env.PREPARED_RUN || "";
  const sourceRun = process.env.SOURCE_RUN || "";
  const id = preparedRun || sourceRun;
  if (id && !/^\d+$/.test(id)) throw new Error("Invalid recovery run ID.");
  if (process.env.GITHUB_REPOSITORY !== "wintermuted/wintermuted-ui") throw new Error("Unexpected recovery repository.");
  const run = id ? JSON.parse(execFileSync("gh", ["api", `repos/wintermuted/wintermuted-ui/actions/runs/${id}`], { encoding: "utf8" })) : undefined;
  const source = recoverySource({
    tag: process.env.RELEASE_TAG, preparedRun, sourceRun,
    project: process.env.RELEASE_PROJECT, version: process.env.RELEASE_VERSION
  }, run);
  appendFileSync(process.env.GITHUB_OUTPUT, `ref=${source.ref}\nversion=${source.version}\nmode=${source.mode}\n`);
  if (source.mode === "artifact") {
    appendFileSync(process.env.GITHUB_OUTPUT, `artifact=${source.artifact}\nattempts=${source.attempts}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
