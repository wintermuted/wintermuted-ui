import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

const readWorkflow = (name) => readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), "utf8").replaceAll("\r\n", "\n");
const cleanup = readWorkflow("cleanup-showcase-preview");
const removalStep = cleanup.slice(cleanup.indexOf("      - name: Remove preview directory from gh-pages"));
const cleanupScript = removalStep.match(/^        run: \|\r?\n((?: {10}[^\r\n]*(?:\r?\n|$)|\r?\n)*)/m)[1]
  .replace(/^ {10}/gm, "")
  .replaceAll("${{ github.event.pull_request.number }}", "7");

function fixture(t, publishBranch = true) {
  const root = mkdtempSync(join(tmpdir(), "wm-pages-cleanup-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const cwd = join(root, "source");
  mkdirSync(cwd);
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init", "--bare", "--quiet", join(root, "origin.git"));
  git("init", "--quiet");
  git("config", "user.name", "Pages test");
  git("config", "user.email", "pages-test@example.invalid");
  git("remote", "add", "origin", join(root, "origin.git"));
  for (const file of ["showcase/index.html", "storybook/index.html", "previews/pr-7/storybook/index.html", "previews/pr-8/showcase/index.html"]) {
    const path = join(cwd, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, file);
  }
  git("add", ".");
  git("commit", "--quiet", "-m", "fixture");
  if (publishBranch) git("push", "--quiet", "origin", "HEAD:refs/heads/gh-pages");
  const output = join(cwd, "cleanup-output");
  const run = () => {
    writeFileSync(output, "");
    execFileSync("bash", ["-e", "-o", "pipefail", "-c", cleanupScript], {
      cwd,
      env: { ...process.env, GITHUB_OUTPUT: output },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return readFileSync(output, "utf8");
  };
  return { cwd, git, run };
}

test("Pages deploy and cleanup queue pending runs instead of replacing cleanup events", () => {
  for (const name of ["deploy-showcase-pages", "cleanup-showcase-preview"]) {
    const workflow = readWorkflow(name);
    const concurrency = workflow.match(/^concurrency:\r?\n(?:[ \t][^\r\n]*(?:\r?\n|$)|\r?\n)*/m)?.[0] ?? "";
    assert.match(concurrency, /^  group: pages$/m, name);
    assert.match(concurrency, /^  cancel-in-progress: false$/m, name);
    assert.match(concurrency, /^  queue: max$/m, name);
  }
});

test("Pages publishes measured coverage beside the matching production or preview site", () => {
  const workflow = readWorkflow("deploy-showcase-pages");
  assert.ok(workflow.indexOf("npm run test:coverage") < workflow.indexOf("node scripts/stage-pages.mjs"));
  assert.match(workflow, /name: react-unit-coverage\n\s+path: coverage\n\s+if-no-files-found: error/);
  assert.ok(workflow.includes('node scripts/stage-pages.mjs "${{ github.event.pull_request.number }}"\n            cp -R coverage "gh-pages-out/previews/pr-${{ github.event.pull_request.number }}/coverage"'));
  assert.ok(workflow.includes("node scripts/stage-pages.mjs\n            cp -R coverage gh-pages-out/coverage"));
  for (const event of ["push", "pull_request"]) {
    const trigger = workflow.split(`  ${event}:\n`)[1].split(/^  \w/m)[0];
    assert.ok(trigger.includes('"tests/**"'), event);
    assert.ok(trigger.includes('"scripts/coverage-reporter*"'), event);
  }
});

test("Pages restricts deployment to main or pull-request previews before any staging", () => {
  const workflow = readWorkflow("deploy-showcase-pages");
  const deployJob = workflow.slice(workflow.indexOf("\n  deploy:\n"), workflow.indexOf("\n  publish:\n"));
  const jobSettings = deployJob.slice(0, deployJob.indexOf("\n    steps:\n"));
  assert.match(jobSettings, /^    if: github\.event_name == 'pull_request' \|\| github\.ref == 'refs\/heads\/main'$/m);
  const publishJob = workflow.slice(workflow.indexOf("\n  publish:\n"));
  assert.match(publishJob, /^    needs: deploy$/m);
  assert.doesNotMatch(publishJob, /always\(\)/);
});

test("cleanup limits Pages and OIDC permissions to the publication job", () => {
  const permissions = cleanup.match(/^permissions:\n((?:  [^\n]*\n)*)/m)?.[1];
  assert.equal(permissions?.trim(), "contents: write");
  const publishStart = cleanup.indexOf("\n  publish:\n");
  assert.ok(publishStart > 0);
  const cleanupJob = cleanup.slice(cleanup.indexOf("\n  cleanup:\n"), publishStart);
  const publishJob = cleanup.slice(publishStart);
  assert.doesNotMatch(cleanupJob, /^\s+permissions:/m);
  assert.doesNotMatch(cleanupJob, /actions\/configure-pages/);
  assert.match(publishJob, /permissions:\n      pages: write\n      id-token: write/);
  assert.doesNotMatch(publishJob, /contents: write/);
  assert.ok(publishJob.includes("uses: actions/configure-pages@v5"));
  assert.ok(publishJob.indexOf("actions/configure-pages@v5") < publishJob.indexOf("actions/deploy-pages@v4"));
});

test("cleanup republishes an existing Pages tree on retry even after its preview was removed", (t) => {
  const { cwd, git, run } = fixture(t);
  assert.match(run(), /^ready=true$/m);
  const path = join(cwd, "gh-pages-out");
  const checkRemainingSite = () => {
    assert.ok(!existsSync(join(path, "previews/pr-7")));
    for (const file of ["showcase/index.html", "storybook/index.html", "previews/pr-8/showcase/index.html"]) {
      assert.equal(readFileSync(join(path, file), "utf8"), file);
    }
  };
  checkRemainingSite();
  const cleanedHead = git("rev-parse", "refs/remotes/origin/gh-pages");
  git("worktree", "remove", path);
  assert.match(run(), /^ready=true$/m);
  checkRemainingSite();
  assert.equal(git("rev-parse", "refs/remotes/origin/gh-pages"), cleanedHead);
  assert.match(cleanup, /ready: \$\{\{ steps\.remove\.outputs\.ready \}\}/);
  assert.match(cleanup, /if: needs\.cleanup\.outputs\.ready == 'true'/);
  assert.match(cleanup, /artifact_name: \$\{\{ format\('github-pages-\{0\}', github\.run_attempt\) \}\}/);
  assert.match(cleanup, /name: github-pages-\$\{\{ github\.run_attempt \}\}/);
  assert.match(cleanup, /artifact_name: \$\{\{ needs\.cleanup\.outputs\.artifact_name \}\}/);
  assert.ok(cleanup.includes("- name: Upload cleaned Pages artifact\n        if: steps.remove.outputs.ready == 'true'"));
});

test("cleanup skips Pages publication only when the gh-pages branch does not exist", (t) => {
  const { cwd, run } = fixture(t, false);
  assert.equal(run(), "");
  assert.ok(!existsSync(join(cwd, "gh-pages-out")));
});
