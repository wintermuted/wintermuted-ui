import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { checkStorybook, stagePages } from "./stage-pages.mjs";

function fixture(t) {
  const root = mkdtempSync(resolve(tmpdir(), "wintermuted-pages-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const options = {
    showcaseDir: resolve(root, "showcase-output"),
    storybookDir: resolve(root, "storybook-output"),
    pagesDir: resolve(root, "pages"),
  };
  const write = (path, content = "existing") => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  };
  write(resolve(options.showcaseDir, "showcase/index.html"), "showcase");
  write(resolve(options.storybookDir, "index.html"), '<script src="./assets/manager.js"></script><link href="./assets/style.css" rel="stylesheet">');
  write(resolve(options.storybookDir, "iframe.html"), '<script src="./assets/preview.js"></script>');
  write(resolve(options.storybookDir, "assets/manager.js"), "manager");
  write(resolve(options.storybookDir, "assets/preview.js"), "preview");
  write(resolve(options.storybookDir, "assets/style.css"), "body {}");
  write(resolve(options.storybookDir, "index.json"), JSON.stringify({ entries: { "components-button--playground": { type: "story" } } }));
  write(resolve(options.pagesDir, ".git"), "gitdir: preserved");
  return { ...options, write };
}

test("production publishes both validated sites and preserves PR previews", (t) => {
  const options = fixture(t);
  options.write(resolve(options.pagesDir, "previews/pr-7/storybook/index.html"));
  options.write(resolve(options.pagesDir, "obsolete.html"));
  stagePages(options);
  assert.equal(readFileSync(resolve(options.pagesDir, "showcase/index.html"), "utf8"), "showcase");
  assert.ok(existsSync(resolve(options.pagesDir, "storybook/iframe.html")));
  assert.ok(existsSync(resolve(options.pagesDir, "storybook/index.json")));
  assert.ok(existsSync(resolve(options.pagesDir, "previews/pr-7/storybook/index.html")));
  assert.equal(readFileSync(resolve(options.pagesDir, ".git"), "utf8"), "gitdir: preserved");
  assert.ok(existsSync(resolve(options.pagesDir, ".nojekyll")));
  assert.ok(!existsSync(resolve(options.pagesDir, "obsolete.html")));
});

test("PR publication replaces only that PR and supports nested manager, iframe, and story links", (t) => {
  const options = fixture(t);
  options.write(resolve(options.pagesDir, "showcase/index.html"), "production");
  options.write(resolve(options.pagesDir, "storybook/index.html"), "production");
  options.write(resolve(options.pagesDir, "previews/pr-8/storybook/index.html"), "other PR");
  options.write(resolve(options.pagesDir, "previews/pr-7/stale.js"));
  stagePages({ ...options, previewNumber: 7 });
  assert.equal(readFileSync(resolve(options.pagesDir, "showcase/index.html"), "utf8"), "production");
  assert.equal(readFileSync(resolve(options.pagesDir, "storybook/index.html"), "utf8"), "production");
  assert.equal(readFileSync(resolve(options.pagesDir, "previews/pr-8/storybook/index.html"), "utf8"), "other PR");
  assert.ok(!existsSync(resolve(options.pagesDir, "previews/pr-7/stale.js")));
  checkStorybook(resolve(options.pagesDir, "previews/pr-7/storybook"));
  for (const base of ["https://example.test/repo/storybook/", "https://example.test/repo/previews/pr-7/storybook/"]) {
    const deepLink = new URL("?path=/story/components-button--playground", base);
    assert.equal(new URL("./iframe.html?id=components-button--playground&viewMode=story", deepLink).pathname, `${new URL(base).pathname}iframe.html`);
    assert.equal(new URL("./assets/preview.js", deepLink).pathname, `${new URL(base).pathname}assets/preview.js`);
  }
  assert.ok(existsSync(resolve(options.pagesDir, "previews/pr-7/showcase/index.html")));
});

test("invalid or incomplete output fails before replacing published content", (t) => {
  const options = fixture(t);
  options.write(resolve(options.pagesDir, "storybook/index.html"), "production");
  options.write(resolve(options.storybookDir, "iframe.html"), '<script src="/assets/preview.js"></script>');
  assert.throws(() => stagePages(options), /root-relative asset/);
  options.write(resolve(options.storybookDir, "iframe.html"), '<script src="./missing.js"></script>');
  assert.throws(() => stagePages(options), /missing output/);
  options.write(resolve(options.storybookDir, "iframe.html"), "");
  rmSync(resolve(options.storybookDir, "index.json"));
  assert.throws(() => stagePages(options), /ENOENT/);
  assert.equal(readFileSync(resolve(options.pagesDir, "storybook/index.html"), "utf8"), "production");
});

test("missing showcase and empty Storybook indexes do not replace production", (t) => {
  const options = fixture(t);
  options.write(resolve(options.pagesDir, "storybook/index.html"), "production");
  options.write(resolve(options.storybookDir, "index.json"), '{"entries":{}}');
  assert.throws(() => stagePages(options), /no published stories or docs/);
  rmSync(resolve(options.showcaseDir, "showcase/index.html"));
  assert.throws(() => stagePages(options), /Missing built showcase/);
  assert.equal(readFileSync(resolve(options.pagesDir, "storybook/index.html"), "utf8"), "production");
});

test("PR numbers cannot escape the preview directory", (t) => {
  const options = fixture(t);
  for (const previewNumber of ["../production", "0", "-1", "1/../../", ""]) {
    assert.throws(() => stagePages({ ...options, previewNumber }), /Invalid PR number/);
  }
});
