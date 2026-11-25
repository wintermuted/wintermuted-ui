import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function reconcileRelease(state, cwd = process.cwd()) {
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  const ancestor = (from, to) => {
    const result = spawnSync("git", ["merge-base", "--is-ancestor", from, to], { cwd });
    if (result.error || ![0, 1].includes(result.status)) {
      throw result.error || new Error("Cannot determine release ancestry.");
    }
    return result.status === 0;
  };
  if (!/^[a-f0-9]{40,64}$/.test(state.commit || "")) throw new Error("Invalid prepared release commit.");
  if (git("status", "--porcelain")) throw new Error("Release reconciliation requires a clean checkout.");
  if (git("rev-parse", "HEAD") !== state.commit) throw new Error("Start reconciliation at the prepared release commit.");
  const tags = Object.entries(state.projectsVersionData)
    .filter(([, data]) => data.newVersion)
    .map(([project, data]) => {
      if (!["ui-theme", "ui-react", "showcase"].includes(project) ||
          !/^\d+\.\d+\.\d+$/.test(data.newVersion)) throw new Error("Invalid prepared release tag.");
      return `${project}@${data.newVersion}`;
    });
  if (!tags.length) throw new Error("No prepared release tags.");
  for (const tag of tags) {
    if (git("rev-parse", `${tag}^{commit}`) !== state.commit) throw new Error(`Prepared tag moved: ${tag}`);
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    git("fetch", "--no-tags", "origin", "refs/heads/main");
    const remote = git("rev-parse", "FETCH_HEAD");
    if (!ancestor(remote, "HEAD")) {
      if (!ancestor(`${state.commit}^`, remote)) throw new Error("Main no longer contains the release source.");
      // Merge into the prepared commit, never rebase it: immutable package tags stay on its original tree.
      git("merge", "--no-edit", "-m", "chore(release): reconcile newer main [skip ci]\n\nCo-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>", remote);
    }
    const head = git("rev-parse", "HEAD");
    const result = spawnSync("git", ["push", "--atomic", "origin", "HEAD:refs/heads/main",
      ...tags.map(tag => `refs/tags/${tag}:refs/tags/${tag}`)], { cwd, encoding: "utf8" });
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    if (result.error) throw result.error;
    if (result.status === 0) return head;
    // Retry only when a read proves that main advanced during this particular push.
    git("fetch", "--no-tags", "origin", "refs/heads/main");
    const advanced = git("rev-parse", "FETCH_HEAD");
    if (advanced === remote || !ancestor(remote, advanced) || ancestor(advanced, "HEAD")) {
      throw new Error("Atomic release push failed without concurrent main advancement; stop for recovery.");
    }
  }
  throw new Error("Main kept advancing; recover from the saved prepared release artifact.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const state = JSON.parse(readFileSync(".nx/release-state.json", "utf8"));
  reconcileRelease(state);
}
