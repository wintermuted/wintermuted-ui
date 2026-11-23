import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { withThemeBaseline } from "./release-baseline.mjs";

function fixture(t, includeShowcase = true) {
  const cwd = mkdtempSync(join(tmpdir(), "wm-release-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init", "--quiet");
  git("config", "user.name", "Release test");
  git("config", "user.email", "release-test@example.invalid");
  writeFileSync(join(cwd, "package.json"), "{}");
  mkdirSync(join(cwd, "packages", "ui-react"), { recursive: true });
  writeFileSync(join(cwd, "packages", "ui-react", "package.json"), '{"version":"0.0.0"}');
  if (includeShowcase) {
    mkdirSync(join(cwd, "packages", "showcase"), { recursive: true });
    writeFileSync(join(cwd, "packages", "showcase", "package.json"), '{"version":"0.1.0","private":true}');
  }
  git("add", ".");
  git("commit", "--quiet", "-m", "chore: initialize");
  return { cwd, git };
}

test("legacy baseline uses the latest reachable semver release and is removed after dry-run", async (t) => {
  const { cwd, git } = fixture(t);
  git("tag", "v0.21.4");
  git("tag", "v0.21.7");
  git("tag", "v-not-a-version");
  const head = git("rev-parse", "HEAD");
  git("checkout", "--quiet", "-b", "future");
  git("commit", "--quiet", "--allow-empty", "-m", "feat: future change");
  git("tag", "v9.0.0");
  git("checkout", "--quiet", "--detach", head);
  await withThemeBaseline(async ({ from, baseline }) => {
    assert.equal(baseline, "ui-theme@0.21.7");
    assert.equal(from, head);
    assert.equal(git("rev-parse", baseline), head);
    assert.equal(git("rev-parse", "ui-react@0.0.0"), head);
  }, cwd);
  assert.equal(git("tag", "--list", "ui-theme@*"), "");
  assert.equal(git("tag", "--list", "ui-react@*"), "");
  assert.equal(git("rev-parse", "v0.21.7"), head);
});

test("existing Nx baseline is preserved; temporary baselines are cleaned up on failure", async (t) => {
  const { cwd, git } = fixture(t);
  git("tag", "v0.21.7");
  await assert.rejects(withThemeBaseline(async () => {
    execFileSync(process.execPath, ["-e", "process.exit(1)"]);
  }, cwd));
  assert.equal(git("tag", "--list", "ui-theme@*"), "");
  assert.equal(git("tag", "--list", "ui-react@*"), "");
  git("tag", "ui-theme@0.22.0");
  git("tag", "ui-react@1.0.0");
  await withThemeBaseline(async ({ baseline }) => assert.equal(baseline, "ui-theme@0.22.0"), cwd);
  assert.equal(git("tag", "--list", "ui-theme@*"), "ui-theme@0.22.0");
  assert.equal(git("tag", "--list", "ui-react@*"), "ui-react@1.0.0");
});

test("missing history fails instead of resetting to a first release", async (t) => {
  const { cwd } = fixture(t);
  await assert.rejects(withThemeBaseline(async () => assert.fail("must not release"), cwd), /Fetch full release history/);
});

test("showcase bootstrap has no fabricated tag and later releases use their own baseline", async (t) => {
  const { cwd, git } = fixture(t);
  git("tag", "ui-theme@1.0.0");
  git("tag", "ui-react@1.0.0");
  const initial = git("rev-parse", "HEAD");
  await withThemeBaseline(async ({ baselines, firstShowcaseRelease }) => {
    assert.equal(firstShowcaseRelease, true);
    assert.equal(baselines.showcase, initial);
    assert.equal(git("tag", "--list", "showcase@*"), "");
  }, cwd);
  git("tag", "showcase@0.1.0");
  git("commit", "--quiet", "--allow-empty", "-m", "fix: later showcase change");
  await withThemeBaseline(async ({ baselines, firstShowcaseRelease }) => {
    assert.equal(firstShowcaseRelease, false);
    assert.equal(baselines.showcase, initial);
  }, cwd);
});

test("missing showcase history rejects preparation and cleans up temporary public package tags", async (t) => {
  const { cwd, git } = fixture(t, false);
  git("tag", "v0.21.7");
  await assert.rejects(withThemeBaseline(async () => assert.fail("must not release"), cwd), /No showcase package history/);
  assert.equal(git("tag", "--list", "ui-theme@*"), "");
  assert.equal(git("tag", "--list", "ui-react@*"), "");
});
