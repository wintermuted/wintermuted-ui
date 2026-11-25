import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { reconcileRelease } from "./release-reconcile.mjs";

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "wm-reconcile-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const remote = join(directory, "remote.git");
  const cwd = join(directory, "release");
  const upstream = join(directory, "upstream");
  const run = (cwd, ...args) => execFileSync("git", args, {
    cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]
  }).trim();
  run(directory, "init", "--bare", "--initial-branch=main", remote);
  run(directory, "clone", remote, cwd);
  const git = (...args) => run(cwd, ...args);
  for (const [key, value] of [["user.name", "Release test"], ["user.email", "release@example.invalid"], ["core.autocrlf", "false"]]) {
    git("config", key, value);
  }
  writeFileSync(join(cwd, "source.txt"), "published source\n");
  writeFileSync(join(cwd, "version.txt"), "1.0.2\n");
  git("add", ".");
  git("commit", "-m", "feat: original source");
  const source = git("rev-parse", "HEAD");
  git("push", "origin", "HEAD:main");
  run(directory, "clone", remote, upstream);
  run(upstream, "config", "user.name", "Upstream test");
  run(upstream, "config", "user.email", "upstream@example.invalid");
  writeFileSync(join(cwd, "version.txt"), "1.0.3\n");
  git("add", ".");
  git("commit", "-m", "chore(release): publish");
  const commit = git("rev-parse", "HEAD");
  const tag = "ui-theme@1.0.3";
  git("tag", tag);
  const advance = (path = "new-feature.txt") => {
    writeFileSync(join(upstream, path), "newer merged work\n");
    run(upstream, "add", ".");
    run(upstream, "commit", "-m", "feat: newer merged work");
    run(upstream, "push", "origin", "HEAD:main");
    return run(upstream, "rev-parse", "HEAD");
  };
  return { cwd, upstream, git, remote, source, tag, advance, state: {
    commit, projectsVersionData: { "ui-theme": { newVersion: "1.0.3" } }
  } };
}

test("reconciliation preserves newer main and keeps immutable tags on the original release tree", t => {
  const { cwd, git, advance, tag, state } = fixture(t);
  const newer = advance();
  const merged = reconcileRelease(state, cwd);
  assert.notEqual(merged, state.commit);
  assert.equal(git("rev-parse", `${tag}^{commit}`), state.commit);
  assert.equal(git("show", `${tag}:source.txt`), "published source");
  assert.throws(() => git("show", `${tag}:new-feature.txt`));
  assert.equal(readFileSync(join(cwd, "new-feature.txt"), "utf8"), "newer merged work\n");
  assert.equal(git("show", "HEAD:version.txt"), "1.0.3");
  git("merge-base", "--is-ancestor", newer, merged);
  assert.match(git("ls-remote", "origin", "refs/heads/main"), new RegExp(`^${merged}\\s`));
  assert.match(git("ls-remote", "origin", `refs/tags/${tag}`), new RegExp(`^${state.commit}\\s`));
});

test("an unadvanced main accepts the original release commit without creating a merge", t => {
  const { cwd, git, state } = fixture(t);
  assert.equal(reconcileRelease(state, cwd), state.commit);
  assert.match(git("ls-remote", "origin", "refs/heads/main"), new RegExp(`^${state.commit}\\s`));
});

test("conflicting newer work stops without changing any remote release refs", t => {
  const { cwd, git, advance, tag, state } = fixture(t);
  const newer = advance("version.txt");
  assert.throws(() => reconcileRelease(state, cwd), /Command failed/);
  assert.match(git("ls-remote", "origin", "refs/heads/main"), new RegExp(`^${newer}\\s`));
  assert.equal(git("ls-remote", "origin", `refs/tags/${tag}`), "");
});

test("an existing different remote tag fails atomically without retrying or overwriting", t => {
  const { cwd, git, source, state } = fixture(t);
  git("push", "origin", `${source}:refs/tags/ui-theme@1.0.3`);
  assert.throws(() => reconcileRelease(state, cwd), /without concurrent main advancement/);
  assert.match(git("ls-remote", "origin", "refs/heads/main"), new RegExp(`^${source}\\s`));
  assert.match(git("ls-remote", "origin", "refs/tags/ui-theme@1.0.3"), new RegExp(`^${source}\\s`));
});

test("moved local tags and dirty checkouts are rejected before pushing", t => {
  const { cwd, git, source, tag, state } = fixture(t);
  git("tag", "-f", tag, source);
  assert.throws(() => reconcileRelease(state, cwd), /Prepared tag moved/);
  writeFileSync(join(cwd, "source.txt"), "uncommitted\n");
  assert.throws(() => reconcileRelease(state, cwd), /clean checkout/);
});

test("main advancing during the atomic push is merged and retried without moving tags", t => {
  const { cwd, upstream, git, tag, state } = fixture(t);
  const hook = join(cwd, ".git", "hooks", "pre-push");
  const script = join(cwd, ".git", "advance-main.mjs");
  writeFileSync(script, `
    import { execFileSync } from "node:child_process";
    import { rmSync, writeFileSync } from "node:fs";
    rmSync(${JSON.stringify(hook)});
    writeFileSync(${JSON.stringify(join(upstream, "racing-feature.txt"))}, "concurrent feature\\n");
    for (const args of [["add", "."], ["commit", "-m", "feat: racing merge"], ["push", "origin", "HEAD:main"]]) {
      execFileSync("git", args, { cwd: ${JSON.stringify(upstream)}, stdio: "pipe" });
    }
  `);
  const shellPath = path => path.replaceAll("\\", "/").replaceAll("'", "'\\''");
  writeFileSync(hook, `#!/bin/sh\n'${shellPath(process.execPath)}' '${shellPath(script)}'\n`);
  chmodSync(hook, 0o755);
  const merged = reconcileRelease(state, cwd);
  assert.notEqual(merged, state.commit);
  assert.equal(git("rev-parse", tag), state.commit);
  assert.equal(git("show", "HEAD:racing-feature.txt"), "concurrent feature");
  assert.match(git("ls-remote", "origin", "refs/heads/main"), new RegExp(`^${merged}\\s`));
});

test("workflow saves recovery state before publication and uses strict read-only dispatch recovery", () => {
  const workflow = readFileSync(new URL("../.github/workflows/auto-release.yml", import.meta.url), "utf8");
  assert.ok(workflow.indexOf("name: prepared-release-") < workflow.indexOf("name: Publish and verify"));
  for (const path of [".nx/release-state.json", ".nx/prepared-release.bundle", "dist/packages/ui-react", "dist/showcase-*.tar.gz"]) {
    assert.ok(workflow.includes(path), path);
  }
  assert.match(workflow, /include-hidden-files: true/);
  assert.match(workflow, /if \[ "\$GITHUB_EVENT_NAME" = "workflow_dispatch" \]; then\s+node "\$RUNNER_TEMP\/release-tools\/release-publication\.mjs" --verify-only\s+else/);
  assert.match(workflow, /run: node "\$RUNNER_TEMP\/release-tools\/release-reconcile\.mjs"/);
  assert.ok(workflow.indexOf("name: Return to the immutable prepared tree") < workflow.indexOf("name: Create the GitHub release"));
  assert.match(workflow, /if: github\.event_name == 'push' && needs\.release\.outputs\.theme_released == 'true'/);
});
