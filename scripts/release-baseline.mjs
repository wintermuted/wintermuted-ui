import { execFileSync } from "node:child_process";

export async function withThemeBaseline(run, cwd = process.cwd()) {
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  const tags = (pattern) => git("tag", "--merged", "HEAD", "--list", pattern, "--sort=-version:refname")
    .split("\n");
  const current = tags("ui-theme@*").find((tag) => /^ui-theme@\d+\.\d+\.\d+$/.test(tag));
  const legacy = current ? undefined : tags("v*").find((tag) => /^v\d+\.\d+\.\d+$/.test(tag));
  if (!current && !legacy) {
    throw new Error("No reachable theme release tag exists. Fetch full release history before running Nx Release.");
  }
  const baseline = current || `ui-theme@${legacy.slice(1)}`;
  const from = git("rev-list", "-n", "1", current || legacy);
  const baselines = { "ui-theme": from };
  const temporaryTags = [];
  try {
    if (!current) {
      git("tag", baseline, from);
      temporaryTags.push(baseline);
    }
    const react = tags("ui-react@*").find((tag) => /^ui-react@\d+\.\d+\.\d+$/.test(tag));
    if (react) {
      baselines["ui-react"] = git("rev-list", "-n", "1", react);
    } else {
      const manifestPath = "packages/ui-react/package.json";
      const initial = git("log", "--reverse", "--diff-filter=A", "--format=%H", "--", manifestPath).split("\n")[0];
      if (!initial) throw new Error("No React package history exists. Fetch full release history before running Nx Release.");
      const { version } = JSON.parse(git("show", `${initial}:${manifestPath}`));
      if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Invalid initial React package version.");
      const reactBaseline = `ui-react@${version}`;
      git("tag", reactBaseline, initial);
      temporaryTags.push(reactBaseline);
      baselines["ui-react"] = initial;
    }
    return await run({ from, baseline, baselines });
  } finally {
    for (const tag of temporaryTags.reverse()) git("tag", "--delete", tag);
  }
}
