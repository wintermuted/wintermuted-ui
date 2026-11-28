import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const repositoryUrl = "https://github.com/wintermuted/wintermuted-ui/blob/main/";
const guides = [
  ["installation", "docs/agent-usage.md", "Installation and package selection"],
  ["theme", "packages/ui-theme/README.md", "CSS imports, tokens, and modular stylesheet dependencies"],
  ["react", "packages/ui-react/README.md", "React usage, component contracts, and examples"],
  ["select", "packages/ui-react-select/README.md", "MultiSelect installation and adapter contract"],
  ["migration", "docs/migration-to-v1.md", "Removed exports and consumer migration"],
  ["recipes", "docs/recipes.md", "Task-oriented recipes with complete imports and application-owned state"],
];
const recipes = [
  ["validated-form", "Build a validated form"],
  ["sortable-table", "Create a sortable table"],
  ["responsive-filters", "Add responsive filters"],
  ["dark-mode-ssr", "Initialize dark mode with SSR"],
];

function section(markdown, heading) {
  const start = markdown.indexOf(`## ${heading}\n`);
  assert.ok(start >= 0, `Missing documentation section: ${heading}`);
  const end = markdown.indexOf("\n## ", start + 1);
  return markdown.slice(start, end < 0 ? undefined : end).trim();
}

function resolveLinks(markdown, source) {
  return markdown.replace(/(\]\()([^)]+)(\))/g, (match, before, target, after) => {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(target)) return match;
    return `${before}${repositoryUrl}${posix.normalize(posix.join(posix.dirname(source), target))}${after}`;
  });
}

export function agentDocumentation(root = repositoryRoot) {
  const read = (source) => readFileSync(resolve(root, ...source.split("/")), "utf8").replace(/\r\n/g, "\n");
  const files = new Map();
  for (const [name, source] of guides) {
    files.set(`agent-docs/${name}.md`, `${resolveLinks(read(source), source).trim()}\n`);
  }
  const react = read("packages/ui-react/README.md");
  const theming = `${section(react, "Theme preferences and SSR")}\n`;
  files.set("agent-docs/theming.md", theming);
  const recipeSource = read("docs/recipes.md");
  for (const [name, heading] of recipes) {
    files.set(`agent-docs/recipes/${name}.md`, `# ${heading}

Install \`@wintermuted/ui-react\`, \`@wintermuted/ui-theme\`, React and React DOM. Check your installed exports and declarations before using these source-revision examples.

${section(recipeSource, heading).replace(/^## .+\n/, "").trim()}

## References

- [Installation and package selection](../installation.md)
- [All task-oriented recipes](../recipes.md)
- [React component contracts](../react.md)
- [CSS imports and dependencies](../theme.md)
- [Theme preferences and SSR](../theming.md)
`);
  }

  const contracts = new Map();
  for (const row of section(react, "Component contracts").split("\n")) {
    const cells = row.match(/^\| (.+?) \| (.+) \|$/);
    if (!cells) continue;
    for (const name of cells[1].matchAll(/`([A-Za-z]+)(?:<[^`]+>)?`/g)) {
      assert.ok(!contracts.has(name[1]), `Duplicate component contract: ${name[1]}`);
      contracts.set(name[1], cells[2]);
    }
  }
  const barrel = read("packages/ui-react/src/index.tsx");
  const components = [...barrel.matchAll(/export \{ (\w+) \} from "\.\/components\/\w+\.js";/g)]
    .map((match) => match[1]).sort();
  assert.ok(components.length > 0, "No documented React component exports");
  const componentLinks = [];
  for (const name of components) {
    assert.ok(contracts.has(name), `Missing component contract: ${name}`);
    const filename = `agent-docs/components/${name}.md`;
    const related = [...contracts].filter(([other, contract]) =>
      other !== name && components.includes(other) && contract === contracts.get(name)).map(([other]) => other);
    files.set(filename, `# ${name}

Import \`${name}\` from \`@wintermuted/ui-react\`. Load \`@wintermuted/ui-theme/index.css\` explicitly; React components do not inject CSS.

## Contract

${contracts.get(name)}
${related.length ? `\nRelated exports in this contract: ${related.map((other) => `[${other}](./${other}.md)`).join(", ")}.\n` : ""}
## References

- [React usage and examples](../react.md)
- [CSS and modular imports](../theme.md)
- [Theme preferences and SSR](../theming.md)
- [Canonical implementation](${repositoryUrl}packages/ui-react/src/components/${name}.tsx)
`);
    componentLinks.push(`- [${name}](./${filename}): Public React component contract.`);
  }
  files.set("agent-docs/components/MultiSelect.md", files.get("agent-docs/select.md"));
  componentLinks.push("- [MultiSelect](./agent-docs/components/MultiSelect.md): Searchable select from @wintermuted/ui-react-select; requires react-select.");
  files.set("llms.txt", `# Wintermuted UI

> Plain-CSS design tokens and optional typed React components. Use these Markdown guides when integrating Wintermuted UI through agent chat.

React components do not inject CSS. Native Select belongs to @wintermuted/ui-react; MultiSelect belongs to @wintermuted/ui-react-select and requires react-select. Applications own routing, data fetching, and domain state.

These documents describe this deployment's source revision, not confirmation that an API is available in a published npm version. Check the installed package's exports and declarations before using an API.

## Guides

${guides.map(([name, , description]) => `- [${description}](./agent-docs/${name}.md)`).join("\n")}
- [Theme preferences and SSR](./agent-docs/theming.md): Initialization, hydration, storage keys, and CSP.

## Components

${componentLinks.join("\n")}

## Recipes

${recipes.map(([name, heading]) => `- [${heading}](./agent-docs/recipes/${name}.md): Complete imports and application-owned state.`).join("\n")}
`);
  return files;
}

export function agentDocsPlugin() {
  return {
    name: "wintermuted-agent-documentation",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.method !== "GET" && request.method !== "HEAD") return next();
        const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
        if (!pathname.startsWith(server.config.base)) return next();
        const filename = pathname.slice(server.config.base.length);
        if (filename !== "llms.txt" && !filename.startsWith("agent-docs/")) return next();
        try {
          const content = agentDocumentation().get(filename);
          if (content === undefined) return next();
          response.setHeader("Content-Type", `${filename.endsWith(".md") ? "text/markdown" : "text/plain"}; charset=utf-8`);
          response.end(request.method === "HEAD" ? undefined : content);
        } catch (error) {
          next(error);
        }
      });
    },
    generateBundle() {
      for (const [fileName, source] of agentDocumentation()) {
        this.emitFile({ type: "asset", fileName, source });
      }
    },
  };
}
