import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { finalizeChangelogs } from "./release-changelog.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const version = JSON.parse(readFileSync(join(root, "packages", "ui-theme", "package.json"), "utf8")).version;
const [major, minor, patch] = version.split(".").map(Number);

for (const [type, expected] of [
  ["feat", `${major}.${minor + 1}.0`],
  ["fix", `${major}.${minor}.${patch + 1}`],
  ["feat!", `${major + 1}.0.0`],
  ["chore", null]
]) {
  test(`Nx dry-run derives ${type} releases without publishing or changing manifests`, { timeout: 90000 }, (t) => {
    const cwd = mkdtempSync(join(tmpdir(), "wm-nx-release-"));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    for (const path of ["package.json", "package-lock.json", "nx.json", ".gitignore", "packages", "scripts"]) {
      cpSync(join(root, path), join(cwd, path), { recursive: true });
    }

    symlinkSync(join(root, "node_modules"), join(cwd, "node_modules"), process.platform === "win32" ? "junction" : "dir");
    const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    git("init", "--quiet");
    git("config", "user.name", "Release test");
    git("config", "user.email", "release-test@example.invalid");
    git("remote", "add", "origin", "https://github.com/wintermuted/wintermuted-ui.git");
    git("add", ".");
    git("commit", "--quiet", "-m", "chore: release fixture baseline");
    git("tag", `v${version}`);
    const reactVersion = JSON.parse(readFileSync(join(cwd, "packages", "ui-react", "package.json"), "utf8")).version;
    git("tag", `ui-react@${reactVersion}`);
    git("tag", "showcase@0.1.0");
    const tokens = join(cwd, "packages", "ui-theme", "styles", "tokens.css");
    writeFileSync(tokens, `${readFileSync(tokens, "utf8")}\n/* release fixture change */\n`);
    git("add", ".");
    git("commit", "--quiet", "-m", `${type}: update theme`);
    const manifest = join(cwd, "packages", "ui-theme", "package.json");
    const lock = join(cwd, "package-lock.json");
    const before = [readFileSync(manifest, "utf8"), readFileSync(lock, "utf8")];
    const output = execFileSync(process.execPath, ["scripts/release.mjs", "--dry-run"], {
      cwd,
      encoding: "utf8",
      env: { ...process.env, NX_DAEMON: "false", NX_INTERACTIVE: "false" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    if (expected) {
      assert.ok(output.includes(expected), output);
      assert.match(output, /CHANGELOG\.md/);
    } else {
      assert.match(output, /No releasable package changes/);
    }
    assert.match(output, /Skipped publishing packages/);
    assert.deepEqual([readFileSync(manifest, "utf8"), readFileSync(lock, "utf8")], before);
    assert.equal(git("tag", "--list", "ui-theme@*"), "");
  });
}

test("independent releases filter publication, advance changelog baselines, and preserve valid dependencies", { timeout: 180000 }, async (t) => {
  const cwd = mkdtempSync(join(tmpdir(), "wm-nx-split-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  for (const path of ["package.json", "package-lock.json", "nx.json", ".gitignore", "packages", "scripts", "tests"]) {
    cpSync(join(root, path), join(cwd, path), { recursive: true });
  }
  symlinkSync(join(root, "node_modules"), join(cwd, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init", "--quiet");
  git("config", "user.name", "Release test");
  git("config", "user.email", "release-test@example.invalid");
  git("remote", "add", "origin", "https://github.com/wintermuted/wintermuted-ui.git");
  const themePath = join(cwd, "packages", "ui-theme", "package.json");
  const reactPath = join(cwd, "packages", "ui-react", "package.json");
  const currentTheme = readFileSync(themePath, "utf8");
  const currentReact = readFileSync(reactPath, "utf8");
  writeFileSync(themePath, JSON.stringify({ ...JSON.parse(currentTheme), version: "0.22.0" }));
  writeFileSync(reactPath, JSON.stringify({ ...JSON.parse(currentReact), version: "0.0.0" }));
  // Historical fixtures must not contain changelogs for releases they have not created.
  for (const project of ["ui-theme", "ui-react", "showcase"]) {
    writeFileSync(join(cwd, "packages", project, "CHANGELOG.md"), "# Changelog\n");
  }
  git("add", ".");
  git("commit", "--quiet", "-m", "chore: monorepo baseline");
  git("tag", "ui-theme@0.22.0");
  const initialBaseline = git("rev-parse", "HEAD");
  writeFileSync(themePath, currentTheme);
  writeFileSync(reactPath, currentReact);
  git("add", ".");
  git("commit", "--quiet", "-m", "feat!: separate CSS theme from React integration");
  const outputPath = join(cwd, ".nx", "release-output.txt");
  const output = execFileSync(process.execPath, ["scripts/release.mjs", "--prepare"], {
    cwd, encoding: "utf8",
    env: { ...process.env, NX_DAEMON: "false", NX_INTERACTIVE: "false", GITHUB_OUTPUT: outputPath },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const state = JSON.parse(readFileSync(join(cwd, ".nx", "release-state.json"), "utf8"));
  assert.equal(state.projectsVersionData["ui-theme"].newVersion, "1.0.0");
  assert.equal(state.projectsVersionData["ui-react"].newVersion, "1.0.0");
  assert.deepEqual(state.baselines, { "ui-theme": initialBaseline, "ui-react": initialBaseline, showcase: initialBaseline });
  const outputs = readFileSync(outputPath, "utf8");
  assert.match(outputs, /^theme_released=true$/m);
  assert.match(outputs, /^projects=ui-theme,ui-react$/m);
  assert.match(outputs, /^tags=.*ui-theme@1\.0\.0.*ui-react@1\.0\.0.*showcase@0\.1\.0$/m);
  assert.equal(git("tag", "--list", "ui-react@0.0.0"), "");
  assert.equal(git("rev-list", "-n", "1", "ui-theme@1.0.0"), state.commit);
  assert.equal(git("rev-list", "-n", "1", "ui-react@1.0.0"), state.commit);
  assert.match(output, /Skipped publishing packages/);
  const reactSource = join(cwd, "packages", "ui-react", "src", "index.js");
  writeFileSync(reactSource, `${readFileSync(reactSource, "utf8")}\n// React-only release fixture\n`);
  git("add", ".");
  git("commit", "--quiet", "-m", "fix: update React integration");
  execFileSync(process.execPath, ["scripts/release.mjs", "--prepare"], {
    cwd, encoding: "utf8",
    env: { ...process.env, NX_DAEMON: "false", NX_INTERACTIVE: "false", GITHUB_OUTPUT: outputPath },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const reactOutputs = readFileSync(outputPath, "utf8").slice(outputs.length);
  assert.match(reactOutputs, /^theme_released=false$/m);
  assert.match(reactOutputs, /^tags=ui-react@1\.0\.1 showcase@0\.1\.1$/m);
  assert.match(reactOutputs, /^projects=ui-react$/m);
  assert.equal(JSON.parse(readFileSync(themePath, "utf8")).version, "1.0.0");
  const firstReactState = JSON.parse(readFileSync(join(cwd, ".nx", "release-state.json"), "utf8"));
  assert.deepEqual(firstReactState.baselines, { "ui-theme": state.commit, "ui-react": state.commit, showcase: state.commit });

  writeFileSync(reactSource, `${readFileSync(reactSource, "utf8")}\n// Second React-only release fixture\n`);
  git("add", ".");
  git("commit", "--quiet", "-m", "fix: second React-only update");
  execFileSync(process.execPath, ["scripts/release.mjs", "--prepare"], {
    cwd, encoding: "utf8",
    env: { ...process.env, NX_DAEMON: "false", NX_INTERACTIVE: "false", GITHUB_OUTPUT: outputPath },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const secondReactState = JSON.parse(readFileSync(join(cwd, ".nx", "release-state.json"), "utf8"));
  assert.equal(secondReactState.baselines["ui-theme"], state.commit);
  assert.equal(secondReactState.baselines["ui-react"], firstReactState.commit);
  const finalized = [];
  await finalizeChangelogs({
    async releaseChangelog({ projects, versionData, from, to }) {
      assert.deepEqual(Object.keys(versionData), projects);
      finalized.push({ project: projects[0], notes: git("log", "--format=%s", `${from}..${to}`) });
    }
  }, secondReactState);
  assert.equal(finalized.length, 2);
  for (const { notes } of finalized) {
    assert.match(notes, /fix: second React-only update/);
    assert.doesNotMatch(notes, /fix: update React integration/);
  }

  const tokens = join(cwd, "packages", "ui-theme", "styles", "tokens.css");
  writeFileSync(tokens, `${readFileSync(tokens, "utf8")}\n/* Future theme release fixture */\n`);
  git("add", ".");
  git("commit", "--quiet", "-m", "fix: update theme tokens");
  execFileSync(process.execPath, ["scripts/release.mjs", "--prepare"], {
    cwd, encoding: "utf8",
    env: { ...process.env, NX_DAEMON: "false", NX_INTERACTIVE: "false", GITHUB_OUTPUT: outputPath },
    stdio: ["ignore", "pipe", "pipe"]
  });
  assert.equal(JSON.parse(readFileSync(themePath, "utf8")).version, "1.0.1");
  execFileSync(process.execPath, ["--test", "tests/package.test.js"], {
    cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]
  });
});

test("changelog finalization rejects incomplete baselines before creating any release", async () => {
  let calls = 0;
  await assert.rejects(finalizeChangelogs({
    async releaseChangelog() { calls += 1; }
  }, {
    projectsVersionData: { "ui-theme": { newVersion: "1.0.1" }, "ui-react": { newVersion: "1.0.2" } },
    baselines: { "ui-theme": "theme-baseline" },
    commit: "release-commit"
  }), /Missing prepared baseline for ui-react/);
  assert.equal(calls, 0);
});

test("showcase bootstraps at 0.1.0, releases independently, and follows dependency updates without npm publication", { timeout: 180000 }, async (t) => {
  const cwd = mkdtempSync(join(tmpdir(), "wm-showcase-release-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  for (const path of ["package.json", "package-lock.json", "nx.json", ".gitignore", "packages", "scripts"]) {
    cpSync(join(root, path), join(cwd, path), { recursive: true });
  }
  symlinkSync(join(root, "node_modules"), join(cwd, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init", "--quiet");
  git("config", "user.name", "Release test");
  git("config", "user.email", "release-test@example.invalid");
  git("remote", "add", "origin", "https://github.com/wintermuted/wintermuted-ui.git");
  writeFileSync(join(cwd, "packages", "showcase", "CHANGELOG.md"), "# Changelog\n");
  git("add", ".");
  git("commit", "--quiet", "-m", "chore: package baseline");
  const baseline = git("rev-parse", "HEAD");
  for (const project of ["ui-theme", "ui-react"]) {
    const manifest = JSON.parse(readFileSync(join(cwd, "packages", project, "package.json"), "utf8"));
    git("tag", `${project}@${manifest.version}`);
  }
  const showcasePath = join(cwd, "packages", "showcase", "package.json");
  const page = join(cwd, "packages", "showcase", "src", "pages", "foundations", "index.html");
  writeFileSync(page, `${readFileSync(page, "utf8")}\n<!-- new docs feature -->\n`);
  git("add", ".");
  git("commit", "--quiet", "-m", "feat: version the showcase");
  const env = { ...process.env, NX_DAEMON: "false", NX_INTERACTIVE: "false" };
  const manifests = ["ui-theme", "ui-react", "showcase"].map(project => join(cwd, "packages", project, "package.json"));
  const before = [...manifests, join(cwd, "package-lock.json")].map(path => readFileSync(path, "utf8"));
  const initialTags = git("tag", "--list");
  const dryRun = execFileSync(process.execPath, ["scripts/release.mjs", "--dry-run"], {
    cwd, encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"]
  });
  assert.match(dryRun, /0\.1\.0/);
  assert.deepEqual([...manifests, join(cwd, "package-lock.json")].map(path => readFileSync(path, "utf8")), before);
  assert.equal(git("tag", "--list"), initialTags);
  const outputPath = join(cwd, ".nx", "showcase-output.txt");
  const prepare = () => {
    execFileSync(process.execPath, ["scripts/release.mjs", "--prepare"], {
      cwd, encoding: "utf8", env: { ...env, GITHUB_OUTPUT: outputPath }, stdio: ["ignore", "pipe", "pipe"]
    });
    return JSON.parse(readFileSync(join(cwd, ".nx", "release-state.json"), "utf8"));
  };
  const first = prepare();
  assert.equal(first.projectsVersionData.showcase.newVersion, "0.1.0");
  assert.equal(first.projectsVersionData["ui-theme"].newVersion, null);
  assert.equal(first.projectsVersionData["ui-react"].newVersion, null);
  assert.equal(first.baselines.showcase, baseline);
  assert.match(readFileSync(outputPath, "utf8"), /^projects=$/m);
  assert.match(readFileSync(outputPath, "utf8"), /^tags=showcase@0\.1\.0$/m);
  assert.equal(git("rev-list", "-n", "1", "showcase@0.1.0"), first.commit);
  assert.equal(JSON.parse(readFileSync(showcasePath, "utf8")).private, true);
  assert.match(readFileSync(join(cwd, "packages", "showcase", "CHANGELOG.md"), "utf8"), /version the showcase/);
  writeFileSync(page, `${readFileSync(page, "utf8")}\n<!-- docs-only bug fix -->\n`);
  git("add", ".");
  git("commit", "--quiet", "-m", "fix: correct the showcase");
  const second = prepare();
  assert.equal(second.projectsVersionData.showcase.newVersion, "0.1.1");
  assert.equal(second.projectsVersionData["ui-theme"].newVersion, null);
  assert.equal(second.projectsVersionData["ui-react"].newVersion, null);
  assert.equal(second.baselines.showcase, first.commit);
  const notes = [];
  await finalizeChangelogs({
    async releaseChangelog({ projects, from, to }) {
      assert.deepEqual(projects, ["showcase"]);
      notes.push(git("log", "--format=%s", `${from}..${to}`));
    }
  }, second);
  assert.match(notes[0], /correct the showcase/);
  assert.doesNotMatch(notes[0], /version the showcase/);
  const reactSource = join(cwd, "packages", "ui-react", "src", "index.js");
  writeFileSync(reactSource, `${readFileSync(reactSource, "utf8")}\n// dependency update\n`);
  git("add", ".");
  git("commit", "--quiet", "-m", "fix: update a showcase dependency");
  const third = prepare();
  assert.equal(third.projectsVersionData.showcase.newVersion, "0.1.2");
  assert.equal(third.projectsVersionData["ui-theme"].newVersion, null);
  assert.equal(third.projectsVersionData["ui-react"].newVersion, "1.0.1");
  assert.match(readFileSync(outputPath, "utf8"), /^projects=ui-react$/m);
  assert.equal(third.baselines.showcase, second.commit);
});
