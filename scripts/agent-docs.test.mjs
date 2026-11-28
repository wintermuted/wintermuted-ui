import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, posix, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { agentDocumentation, agentDocsPlugin } from "../packages/showcase/src/templates/agent-docs.mjs";

test("the task index links to four focused recipes generated from the canonical guide", () => {
  const files = agentDocumentation();
  for (const name of ["validated-form", "sortable-table", "responsive-filters", "dark-mode-ssr"]) {
    const filename = `agent-docs/recipes/${name}.md`;
    assert.ok(files.has(filename), `Missing ${name}`);
    assert.ok(files.get("llms.txt").includes(`](./${filename})`));
    assert.match(files.get(filename), /import .+ from "@wintermuted\/ui-react/);
  }
  assert.match(files.get("agent-docs/recipes.md"), /Build a validated form/);
  assert.doesNotMatch(files.get("agent-docs/recipes/validated-form.md"), /export function InvoiceTable/);
  assert.doesNotMatch(files.get("agent-docs/recipes/sortable-table.md"), /export function ContactForm/);
});

test("the index and component guides have resolvable Markdown links at production and preview depths", () => {
  const files = agentDocumentation();
  const barrel = readFileSync(new URL("../packages/ui-react/src/index.tsx", import.meta.url), "utf8");
  for (const [, name] of barrel.matchAll(/export \{ (\w+) \} from "\.\/components\/\w+\.js";/g)) {
    assert.ok(files.has(`agent-docs/components/${name}.md`), `Missing ${name} guide`);
  }
  assert.match(files.get("agent-docs/components/FieldGroup.md"), /aria-describedby/);
  assert.match(files.get("agent-docs/components/Dialog.md"), /Caller must set open=false/);
  assert.match(files.get("agent-docs/components/MultiSelect.md"), /@wintermuted\/ui-react-select/);
  assert.match(files.get("agent-docs/theming.md"), /CSP nonce/);
  for (const [filename, content] of files) {
    for (const [, target] of content.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(target)) continue;
      const path = posix.normalize(posix.join(posix.dirname(filename), target.split("#")[0]));
      assert.ok(files.has(path), `${filename} links to missing ${path}`);
      for (const base of ["https://example.test/repo/showcase/", "https://example.test/repo/previews/pr-7/showcase/"]) {
        assert.equal(new URL(target, new URL(filename, base)).pathname, new URL(path, base).pathname);
      }
    }
  }
  assert.match(files.get("agent-docs/react.md"), /https:\/\/github\.com\/wintermuted\/wintermuted-ui\/blob\/main\/docs\/migration-to-v1\.md/);
});

test("new component exports without canonical contracts fail generation", (t) => {
  const root = mkdtempSync(resolve(tmpdir(), "wintermuted-agent-docs-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const source of [
    "docs/agent-usage.md", "docs/migration-to-v1.md", "docs/recipes.md",
    "packages/ui-theme/README.md", "packages/ui-react/README.md",
    "packages/ui-react-select/README.md", "packages/ui-react/src/index.tsx",
  ]) {
    const target = resolve(root, source);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(new URL(`../${source}`, import.meta.url), target);
  }
  const barrel = resolve(root, "packages/ui-react/src/index.tsx");
  writeFileSync(barrel, `${readFileSync(barrel, "utf8")}\nexport { Undocumented } from "./components/Undocumented.js";\n`);
  assert.throws(() => agentDocumentation(root), /Missing component contract: Undocumented/);
});

test("development GET and HEAD serve the same assets emitted for static deployment", () => {
  const plugin = agentDocsPlugin();
  const emitted = new Map();
  plugin.generateBundle.call({
    emitFile({ fileName, source, type }) {
      assert.equal(type, "asset");
      emitted.set(fileName, source);
    },
  });

  assert.deepEqual(emitted, agentDocumentation());
  let middleware;
  plugin.configureServer({ config: { base: "/showcase/" }, middlewares: { use(handler) { middleware = handler; } } });
  for (const [filename, content] of emitted) {
    for (const method of ["GET", "HEAD"]) {
      let body;
      const headers = {};
      middleware({ url: `/showcase/${filename}?test=1`, method }, {
        setHeader(name, value) { headers[name] = value; },
        end(value) { body = value; },
      }, () => assert.fail(`Did not serve ${filename}`));
      assert.equal(body, method === "HEAD" ? undefined : content);
      assert.match(headers["Content-Type"], /^(text\/markdown|text\/plain); charset=utf-8$/);
    }
  }
  for (const [url, method] of [
    ["/showcase/index.html", "GET"], ["/llms.txt", "GET"],
    ["/showcase/agent-docs/missing.md", "GET"], ["/showcase/llms.txt", "POST"],
  ]) {
    let passed = false;
    middleware({ url, method }, {}, (error) => { assert.equal(error, undefined); passed = true; });
    assert.ok(passed, `${method} ${url} must pass to the next handler`);
  }
});

test("the real Vite development server exposes the index and Markdown without client-side rendering", async () => {
  const { createServer } = await import("vite");
  const server = await createServer({
    configFile: fileURLToPath(new URL("../packages/showcase/vite.config.mjs", import.meta.url)),
    server: { port: 0, open: false },
  });
  try {
    await server.listen();
    const address = server.httpServer.address();
    const base = `http://127.0.0.1:${address.port}/showcase/`;
    for (const filename of ["llms.txt", "agent-docs/components/Dialog.md", "agent-docs/theming.md",
      "agent-docs/recipes.md", "agent-docs/recipes/validated-form.md",
      "agent-docs/recipes/sortable-table.md", "agent-docs/recipes/responsive-filters.md",
      "agent-docs/recipes/dark-mode-ssr.md"]) {
      const response = await fetch(new URL(filename, base));
      assert.equal(response.status, 200);
      assert.equal(await response.text(), agentDocumentation().get(filename));
    }
  } finally {
    await server.close();
  }
});
