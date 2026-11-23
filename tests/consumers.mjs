// Builds/type checks are CI-only; --package-only verifies installation and imports.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const temp = mkdtempSync(join(tmpdir(), "wm-consumer-"));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this check through npm run test:pack or npm run test:consumers.");
const runNpm = (args, cwd) => execFileSync(process.execPath, [npmCli, ...args], {
  cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"],
});
try {
  const packed = JSON.parse(runNpm(["pack", "--workspace=@wintermuted/ui-theme", "--json", "--pack-destination", temp], root))[0];
  const tarball = join(temp, packed.filename);
  const css = join(temp, "css-only");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(css);
  writeFileSync(join(css, "package.json"), JSON.stringify({ private: true, type: "module" }));
  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], css);
  for (const peer of ["react", "react-dom", "react-select"]) {
    assert.equal(existsSync(join(css, "node_modules", peer)), false, `CSS consumer unexpectedly installed ${peer}`);
  }
  const installed = join(css, "node_modules", "@wintermuted", "ui-theme");
  const manifest = JSON.parse(readFileSync(join(installed, "package.json"), "utf8"));
  const legacyExports = [".", "./index.css", "./styles/tokens.css", "./styles/base.css", "./styles/components.css"];
  for (const key of legacyExports) assert.ok(existsSync(resolve(installed, manifest.exports[key])));
  assert.equal(manifest.peerDependencies, undefined);
  assert.equal(manifest.dependencies, undefined);
  assert.ok(!existsSync(join(installed, "react")));
  for (const entry of ["./react", "./react/select", "./theme"]) assert.equal(manifest.exports[entry], undefined);
  const resolveInstalled = createRequire(join(css, "package.json"));
  for (const entry of ["react", "react/select", "theme"]) {
    assert.throws(() => resolveInstalled.resolve(`@wintermuted/ui-theme/${entry}`),
      { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" });
  }
  assert.ok(!existsSync(join(installed, "node_modules", "react")));

  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund",
    "react@18.3.1", "react-dom@18.3.1", "react-select@5",
    "@types/react@18", "@types/react-dom@18"], css);
  const reactPacked = JSON.parse(runNpm(["pack", "--workspace=@wintermuted/ui-react", "--json", "--pack-destination", temp], root))[0];
  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", join(temp, reactPacked.filename)], css);
  const docs = new JSDOM(readFileSync(join(root, "packages", "showcase", "src", "pages", "foundations", "react.html"), "utf8"));
  const example = [...docs.window.document.querySelectorAll("pre code")]
    .map(node => node.textContent).find(code => code.startsWith("import "));
  assert.ok(example, "Missing external React installation example");
  execFileSync(process.execPath, ["--input-type=module", "-e",
    example.replace('import "@wintermuted/ui-theme/index.css";', "")], { cwd: css, stdio: "inherit" });
  docs.window.close();
  execFileSync(process.execPath, ["--input-type=module", "-e", `
import assert from "node:assert/strict";
import React from "react";
import {renderToString} from "react-dom/server";
import {Button, Card, ThemeProvider} from "@wintermuted/ui-react";
import {MultiSelect} from "@wintermuted/ui-react/select";
import {initTheme, getThemeScript} from "@wintermuted/ui-react/theme";
assert.match(renderToString(React.createElement(ThemeProvider, null, React.createElement(Card, null,
  React.createElement(Button, null, "Refresh")))), /Refresh/);
assert.match(renderToString(React.createElement(MultiSelect, {options: []})), /input/);
assert.equal(initTheme(), "light");
assert.ok(getThemeScript().includes("wintermuted:theme"));
`], { cwd: css, stdio: "inherit" });
  execFileSync(process.execPath, ["--input-type=module", "-e", `
import assert from "node:assert/strict";
import React from "react";
import {renderToString} from "react-dom/server";
import {Button} from "@wintermuted/ui-react";
import {MultiSelect} from "@wintermuted/ui-react/select";
import {initTheme} from "@wintermuted/ui-react/theme";
assert.match(renderToString(React.createElement(Button, null, "Standalone")), /Standalone/);
assert.match(renderToString(React.createElement(MultiSelect, {options: []})), /input/);
assert.equal(initTheme(), "light");
`], { cwd: css, stdio: "inherit" });
  if (!process.argv.includes("--package-only")) {
  writeFileSync(join(css, "consumer.tsx"), `
import * as React from "react";
import {Button, Card, CardTitle, Input, Select, ListItem, Table, Dialog, Tabs, Menu, ThemeProvider, ThemeSelect} from "@wintermuted/ui-react";
import {MultiSelect} from "@wintermuted/ui-react/select";
import {initTheme, getThemeScript} from "@wintermuted/ui-react/theme";
initTheme(); getThemeScript("test:theme");
const input = React.createRef<HTMLInputElement>();
const options = [{value: 1, label: "Main", stop: {id: 1}}];
export const app = <ThemeProvider><Card as="article"><CardTitle as="h4">Stops</CardTitle>
<Button onClick={e => e.currentTarget.focus()}>Refresh</Button>
<Input ref={input} onChange={e => console.log(e.currentTarget.value)}/>
<Select onChange={e => console.log(e.currentTarget.value)}><option>Main</option></Select>
<ListItem value={2}>Main</ListItem><Table responsive aria-label="Arrivals"/>
<MultiSelect options={options} defaultValue={options} onChange={values => values.map(o => o.stop.id)}/>
<MultiSelect isMulti={false} options={options} onChange={value => value?.stop.id}/>
<Dialog open={false} onClose={() => {}} title="Stops"/><ThemeSelect/>
<Tabs label="Views" items={[{id:"a",label:"Arrivals",content:"Times"}]}/>
<Menu label="Actions" items={[{id:"a", label:"Refresh", onSelect: e => e.currentTarget.focus()}]}/>
</Card></ThemeProvider>;
`);
  writeFileSync(join(css, "tsconfig.json"), JSON.stringify({
    compilerOptions: { strict: true, noEmit: true, moduleResolution: "bundler", module: "ESNext",
      target: "ES2020", jsx: "react-jsx", esModuleInterop: true, skipLibCheck: false },
    files: ["consumer.tsx"],
  }));
  const typescriptManifest = require.resolve("typescript/package.json");
  const typescriptBin = JSON.parse(readFileSync(typescriptManifest, "utf8")).bin.tsc;
  execFileSync(process.execPath, [resolve(dirname(typescriptManifest), typescriptBin), "-p", join(css, "tsconfig.json")],
    { cwd: css, stdio: "inherit" });
  writeFileSync(join(css, "main.js"), `
import "@wintermuted/ui-theme/index.css";
import React from "react";
import {createRoot} from "react-dom/client";
import {Button, ThemeProvider, ThemeSelect} from "@wintermuted/ui-react";
import {MultiSelect} from "@wintermuted/ui-react/select";
import {initTheme} from "@wintermuted/ui-react/theme";
initTheme();
createRoot(document.getElementById("root")).render(React.createElement(ThemeProvider, null,
React.createElement(Button, null, "Refresh"), React.createElement(ThemeSelect),
React.createElement(MultiSelect, {options:[{label:"Main",value:1}]})));
`);
  writeFileSync(join(css, "index.html"), '<div id="root"></div><script type="module" src="./main.js"></script>');
  const { build } = await import("vite");
  await build({ root: css, configFile: false, logLevel: "warn" });
  const webpack = require("webpack");
  await new Promise((ok, fail) => {
    const compiler = webpack({
      mode: "production", context: css, entry: "./main.js",
      output: { path: join(css, "webpack-dist"), filename: "bundle.js" },
      module: { rules: [{ test: /\.css$/, use: [require.resolve("style-loader"), require.resolve("css-loader")] }] },
    });
    compiler.run((error, stats) => compiler.close(closeError => {
      if (error || closeError || stats?.hasErrors()) fail(error || closeError || new Error(stats.toString("errors-only")));
      else ok();
    }));
  });
  console.log("Packed CSS-only, React 18, TypeScript 7/bundler, Vite 8 and Webpack 5 consumers passed.");
  } else {
    console.log("Packed CSS-only install, optional peers, React 18 SSR imports and React-free theme imports passed.");
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
