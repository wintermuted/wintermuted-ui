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
  for (const step of ["Configure Pages", "Upload cleaned Pages artifact"]) {
    assert.ok(cleanup.includes(`- name: ${step}\n        if: steps.remove.outputs.ready == 'true'`));
  }
});

test("cleanup skips Pages publication only when the gh-pages branch does not exist", (t) => {
  const { cwd, run } = fixture(t, false);
  assert.equal(run(), "");
  assert.ok(!existsSync(join(cwd, "gh-pages-out")));
});
