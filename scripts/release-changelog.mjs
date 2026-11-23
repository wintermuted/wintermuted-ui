export async function finalizeChangelogs(client, state) {
  const releases = Object.entries(state.projectsVersionData).filter(([, data]) => data.newVersion);
  for (const [project] of releases) {
    if (!state.baselines?.[project]) throw new Error(`Missing prepared baseline for ${project}.`);
  }
  for (const [project, data] of releases) {
    await client.releaseChangelog({
      projects: [project],
      versionData: { [project]: data },
      from: state.baselines[project],
      to: state.commit,
      stageChanges: false,
      gitCommit: false,
      gitTag: false,
      gitPush: false
    });
  }
}
