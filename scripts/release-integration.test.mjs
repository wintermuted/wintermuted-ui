import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

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
    for (const path of ["package.json", "package-lock.json", "nx.json", ".gitignore", "packages", "apps", "scripts"]) {
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

test("the split prepares both 1.0.0 releases and exports both tags without publishing", { timeout: 90000 }, (t) => {
  const cwd = mkdtempSync(join(tmpdir(), "wm-nx-split-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  for (const path of ["package.json", "package-lock.json", "nx.json", ".gitignore", "packages", "apps", "scripts"]) {
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
  git("add", ".");
  git("commit", "--quiet", "-m", "chore: monorepo baseline");
  git("tag", "ui-theme@0.22.0");
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
  const outputs = readFileSync(outputPath, "utf8");
  assert.match(outputs, /^theme_released=true$/m);
  assert.match(outputs, /^tags=.*ui-theme@1\.0\.0.*ui-react@1\.0\.0$/m);
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
  assert.match(reactOutputs, /^tags=ui-react@1\.0\.1$/m);
  assert.equal(JSON.parse(readFileSync(themePath, "utf8")).version, "1.0.0");
});
