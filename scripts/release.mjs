import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { withThemeBaseline } from "./release-baseline.mjs";
import { finalizeChangelogs } from "./release-changelog.mjs";

const args = new Set(process.argv.slice(2));
for (const arg of args) {
  if (!["--dry-run", "--prepare", "--finalize"].includes(arg)) {
    throw new Error(`Unknown release argument: ${arg}`);
  }
}
if (args.size > 1) throw new Error("Choose one of --dry-run, --prepare, or --finalize.");
const dryRun = !args.has("--prepare") && !args.has("--finalize");
const statePath = new URL("../.nx/release-state.json", import.meta.url);
const projects = ["ui-theme", "ui-react"];
const git = (...command) => execFileSync("git", command, { encoding: "utf8" }).trim();

if (args.has("--finalize")) {
  const { ReleaseClient } = await import("nx/release");
  if (!existsSync(statePath)) throw new Error("No prepared release state exists.");
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  if (state.commit !== git("rev-parse", "HEAD")) throw new Error("Prepared release does not match HEAD.");
  const client = new ReleaseClient({
    changelog: { projectChangelogs: { file: false, createRelease: "github" } }
  });
  await finalizeChangelogs(client, state);
} else if (process.env.WM_RELEASE_WORKER === "true") {
  const { ReleaseClient } = await import("nx/release");
  if (!dryRun && git("status", "--porcelain")) {
    throw new Error("Release preparation requires a clean checkout.");
  }
  if (!process.env.WM_RELEASE_BASELINES) throw new Error("The release worker requires project baselines.");
  const baselines = JSON.parse(process.env.WM_RELEASE_BASELINES);
  for (const project of projects) {
    if (!baselines[project]) throw new Error(`The release worker requires a baseline for ${project}.`);
  }
  // Publish must succeed before the workflow pushes tags or creates a remote release.
  const client = new ReleaseClient({
    changelog: { projectChangelogs: { createRelease: false } },
    git: { push: false }
  });
  const { projectsVersionData } = await client.release({ projects, dryRun, skipPublish: true, yes: true });
  const version = projectsVersionData["ui-theme"]?.newVersion;
  const releases = Object.entries(projectsVersionData).filter(([, data]) => data.newVersion);
  const tags = releases.map(([name, data]) => `${name}@${data.newVersion}`);
  if (!tags.length) {
    console.log("No releasable package changes.");
    if (!dryRun && process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, "released=false\n");
  } else if (!dryRun) {
    const state = { baselines, projectsVersionData, commit: git("rev-parse", "HEAD") };
    mkdirSync(new URL("../.nx/", import.meta.url), { recursive: true });
    writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT,
        `released=true\ntheme_released=${Boolean(version)}\nversion=${version || ""}\ntag=${version ? `ui-theme@${version}` : ""}\ntags=${tags.join(" ")}\nprojects=${releases.map(([name]) => name).join(",")}\n`);
    }
  }
} else {
  // Nx can exit on configuration errors; isolate it so baseline cleanup still runs.
  await withThemeBaseline(async ({ baselines }) => {
    execFileSync(process.execPath, [fileURLToPath(import.meta.url), ...args], {
      stdio: "inherit",
      env: { ...process.env, WM_RELEASE_WORKER: "true", WM_RELEASE_BASELINES: JSON.stringify(baselines) }
    });
  });
}
