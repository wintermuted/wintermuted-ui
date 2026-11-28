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
const packageOnly = process.argv.includes("--package-only");
const reactMajor = process.argv.find(arg => arg.startsWith("--react-major="))?.split("=")[1] ?? "18";
assert.ok(["18", "19"].includes(reactMajor), "React major must be 18 or 19.");
const reactVersion = reactMajor === "18" ? "18.3.1" : "19";
try {
  const reactDist = join(root, "dist", "packages", "ui-react");
  assert.ok(existsSync(join(reactDist, "package.json")), "Missing compiled React package; CI must build ui-react before consumer checks.");
  const reactManifest = JSON.parse(readFileSync(join(reactDist, "package.json"), "utf8"));
  assert.equal(reactManifest.exports["./select"], undefined);
  assert.equal(reactManifest.peerDependencies["react-select"], undefined);
  assert.equal(reactManifest.scripts?.prepack, undefined, "The compiled package must not retain the source-only pack guard.");
  const reactPacked = JSON.parse(runNpm(["pack", reactDist, "--json", "--pack-destination", temp], root))[0];
  assert.match(reactManifest.main, /\.js$/);
  assert.match(reactManifest.types, /\.d\.ts$/);
  for (const targets of Object.values(reactManifest.exports)) {
    assert.match(targets.default, /\.js$/);
    assert.match(targets.types, /\.d\.ts$/);
    for (const target of Object.values(targets)) {
      assert.ok(reactPacked.files.some(file => file.path === target.replace(/^\.\//, "")), `Missing packed export: ${target}`);
    }
  }
  assert.ok(!reactPacked.files.some(file => /\.tsx?$/.test(file.path) && !file.path.endsWith(".d.ts")),
    "React package must not ship TypeScript implementation files.");
  assert.ok(!reactPacked.files.some(file => /^src\/select\./.test(file.path)));
  const selectDist = join(root, "dist", "packages", "ui-react-select");
  assert.ok(existsSync(join(selectDist, "package.json")), "Missing compiled select package; CI must build ui-react-select before consumer checks.");
  const selectManifest = JSON.parse(readFileSync(join(selectDist, "package.json"), "utf8"));
  assert.equal(selectManifest.scripts?.prepack, undefined);
  assert.equal(selectManifest.peerDependencies["react-select"], "^5.8.0");
  assert.equal(selectManifest.peerDependenciesMeta, undefined);
  const selectPacked = JSON.parse(runNpm(["pack", selectDist, "--json", "--pack-destination", temp], root))[0];
  for (const targets of Object.values(selectManifest.exports)) {
    assert.match(targets.default, /\.js$/);
    assert.match(targets.types, /\.d\.ts$/);
    for (const target of Object.values(targets)) {
      assert.ok(selectPacked.files.some(file => file.path === target.replace(/^\.\//, "")), `Missing packed select export: ${target}`);
    }
  }
  assert.ok(!selectPacked.files.some(file => /\.tsx?$/.test(file.path) && !file.path.endsWith(".d.ts")));
  for (const name of ["LoadStatus", "RefreshAction", "ActionDisclosure"]) {
    for (const suffix of [".js", ".d.ts"]) {
      assert.ok(reactPacked.files.some(file => file.path === `src/components/${name}${suffix}`),
        `Missing compiled component: ${name}${suffix}`);
    }
    const declarations = readFileSync(join(reactDist, "src", "components", `${name}.d.ts`), "utf8");
    assert.doesNotMatch(declarations, /ui-staging|@overworld|vite\/client|\.css/);
  }
  const publicDeclarations = readFileSync(join(reactDist, "src", "index.d.ts"), "utf8");
  for (const name of ["LoadIssue", "LoadStatusHelp", "LoadStatusProps", "RefreshActionProps",
    "ActionDisclosureAction", "ActionDisclosureProps"]) assert.ok(publicDeclarations.includes(name), name);
  const packed = JSON.parse(runNpm(["pack", "--workspace=@wintermuted/ui-theme", "--json", "--pack-destination", temp], root))[0];
  const tarball = join(temp, packed.filename);
  const css = join(temp, "css-only");
  const typecheck = (file, moduleResolution) => {
    writeFileSync(join(css, "tsconfig.json"), JSON.stringify({
      compilerOptions: { strict: true, noEmit: true, moduleResolution,
        module: moduleResolution === "NodeNext" ? "NodeNext" : "ESNext",
        target: "ES2020", jsx: "react-jsx", esModuleInterop: true, skipLibCheck: false },
      files: [file],
    }));
    const typescriptManifest = require.resolve("typescript/package.json");
    const typescriptBin = JSON.parse(readFileSync(typescriptManifest, "utf8")).bin.tsc;
    execFileSync(process.execPath, [resolve(dirname(typescriptManifest), typescriptBin), "-p", join(css, "tsconfig.json")],
      { cwd: css, stdio: "inherit" });
  };
  const { mkdirSync } = await import("node:fs");
  const standalone = join(temp, "standalone-select");
  mkdirSync(standalone);
  writeFileSync(join(standalone, "package.json"), JSON.stringify({ private: true, type: "module" }));
  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball,
    `react@${reactVersion}`, `react-dom@${reactVersion}`, join(temp, selectPacked.filename)], standalone);
  const resolveSelect = createRequire(join(standalone, "package.json"));
  assert.throws(() => resolveSelect.resolve("@wintermuted/ui-react"), { code: "MODULE_NOT_FOUND" });
  execFileSync(process.execPath, ["--input-type=module", "-e", `
import assert from "node:assert/strict";
import React from "react";
import {renderToString} from "react-dom/server";
import {MultiSelect} from "@wintermuted/ui-react-select";
assert.match(renderToString(React.createElement(MultiSelect, {options: [], "aria-label": "Standalone stops"})),
  /Standalone stops/);
`], { cwd: standalone, stdio: "inherit" });
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
  for (const name of ["load-status", "action-disclosure"]) {
    const key = `./styles/components/${name}.css`;
    assert.equal(manifest.exports[key], key);
    const content = readFileSync(resolve(installed, key), "utf8");
    assert.match(content, /\.wm-/);
    assert.doesNotMatch(content, /ui-staging|@overworld|planner-|places-/);
  }
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
    `react@${reactVersion}`, `react-dom@${reactVersion}`,
    `@types/react@${reactMajor}`, `@types/react-dom@${reactMajor}`], css);
  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", join(temp, reactPacked.filename)], css);
  assert.throws(() => resolveInstalled.resolve("react-select"), { code: "MODULE_NOT_FOUND" });
  assert.throws(() => resolveInstalled.resolve("@wintermuted/ui-react-select"), { code: "MODULE_NOT_FOUND" });
  assert.throws(() => resolveInstalled.resolve("@wintermuted/ui-react/select"), { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" });
  const resolveReact = createRequire(join(css, "node_modules", "@wintermuted", "ui-react", "package.json"));
  assert.throws(() => resolveReact.resolve("react-select"), { code: "MODULE_NOT_FOUND" });
  execFileSync(process.execPath, ["--input-type=module", "-e", `
import assert from "node:assert/strict";
import React from "react";
import {renderToString} from "react-dom/server";
import {Button, ThemeProvider, ToggleGroup, FacetFilter, SortableTableHeader, StatCard, LoadStatus, RefreshAction, ActionDisclosure,
  RankedBarList, Toast, ColorPicker, NumberStepper, LanguageSelector} from "@wintermuted/ui-react";
import {initTheme, getThemeScript} from "@wintermuted/ui-react/theme";
assert.match(renderToString(React.createElement(ThemeProvider, null,
  React.createElement(Button, null, "Without optional select"))), /Without optional select/);
assert.equal(initTheme(), "light");
assert.ok(getThemeScript().includes("wintermuted:theme"));
const h = React.createElement;
const app = h("div", null,
  h(LoadStatus, {issues: [{message: "Records unavailable"}], warnings: ["Some records are incomplete"],
    labels: {retry: "Retry records", loading: "Loading records"}}),
  h(RefreshAction, {loading: true, error: true, onRefresh() {},
    labels: {idle: "Update records", loading: "Updating records", retry: "Retry records"}}),
  h(ActionDisclosure, {title: "Record options", defaultExpanded: false,
    action: {label: "Edit records", onClick() {}}}, h("input", {"aria-label": "Record name", defaultValue: "Draft"})),
  h(ToggleGroup, {label: "Documents", options: [{value: "orders", label: "Orders"}], value: "orders", onChange() {}}),
  h(FacetFilter, {label: "Departments", options: [], selected: [], onChange() {}, available: false,
    emptyLabel: "No departments", moreLabel: "More", fewerLabel: "Fewer",
    reset: {label: "Any", count: 0, selected: true, onSelect() {}}}),
  h("table", null, h("thead", null, h("tr", null, h(SortableTableHeader, {column: "amount", label: "Amount",
    active: true, direction: "asc", onSort() {}, onDirection() {}, directionLabel: "Reverse amount", directionIcon: "^"})))),
  h(StatCard, {label: "Orders", value: 0, variant: "compact"}),
  h(RankedBarList, {label: "Ranking", maximum: 10, empty: "Empty", items: [{id: "a", label: "Shipping", value: 5, valueLabel: "5"}]}),
  h(Toast, {open: false, message: "Saved", dismissLabel: "Dismiss", onDismiss() {}}),
  h(ColorPicker, {value: "#123456", groups: [], onSelect() {}, onChange() {},
    label: "Ink", inputLabel: "Pick ink", hexLabel: "Hex", invalidLabel: "Invalid hex"}),
  h(NumberStepper, {value: 0.5, min: 0, max: 1, step: 0.1, onChange() {}, label: "Quantity",
    decreaseLabel: "Less", increaseLabel: "More", valueLabel: "Current quantity", decreaseIcon: "-", increaseIcon: "+"}),
  h(LanguageSelector, {label: "Locale", options: [{value: "ja", label: "Japanese"}], value: "ja", onChange() {}}));
const html = renderToString(app);
assert.match(html, /Orders/);
assert.match(html, /aria-sort="ascending"/);
assert.match(html, /hidden=""/);
assert.match(html, /role="alert"[^>]*>Records unavailable Some records are incomplete/);
assert.match(html, /aria-busy="true"[^>]*>Updating records/);
assert.match(html, /aria-expanded="false"/);
assert.match(html, /aria-label="Edit records"/);
assert.doesNotMatch(html, /wm-staged|ui-staging|@overworld/);
`], { cwd: css, stdio: "inherit" });
  if (!packageOnly) {
    writeFileSync(join(css, "without-select.tsx"), `
import * as React from "react";
import {Button, Card, ThemeProvider, ToggleGroup, FacetFilter, SortableTableHeader, StatCard, LoadStatus, RefreshAction, ActionDisclosure,
  RankedBarList, Toast, ColorPicker, NumberStepper, LanguageSelector} from "@wintermuted/ui-react";
import type {ButtonProps, ThemeContextValue, ToggleOption, FacetOption, SortableTableHeaderProps,
  LoadIssue, LoadStatusHelp, LoadStatusProps, RefreshActionProps, ActionDisclosureAction, ActionDisclosureProps,
  ColorGroup, RankedBarItem, ColorPickerProps, NumberStepperProps, ToastProps, StatCardProps,
  ToggleGroupProps, FacetFilterProps, RankedBarListProps, LanguageOption, LanguageSelectorProps} from "@wintermuted/ui-react";
import {initTheme} from "@wintermuted/ui-react/theme";
const props: ButtonProps = {onClick: event => event.currentTarget.focus()};
export function readTheme(context: ThemeContextValue) { return context.resolvedTheme; }
export const app = <ThemeProvider><Card><Button {...props}>Refresh</Button></Card></ThemeProvider>;
const toggles: ToggleOption<"orders" | "returns">[] = [{value: "orders", label: "Orders"}];
const facets: FacetOption<"all">[] = [{value: "all", label: "All Services", count: 0}];
const groups: ColorGroup[] = [{id: "brand", label: "Brand", choices: [{value: "#123456", label: "Ink"}]}];
const rows: RankedBarItem[] = [{id: "shipping", label: "Shipping", value: 1, valueLabel: "1 order"}];
const issues: readonly LoadIssue[] = [{message: "Records unavailable", retry() {}}];
const warnings: readonly string[] = ["Some records are incomplete"];
const refreshRef = React.createRef<HTMLButtonElement>();
const actionRef = React.createRef<HTMLButtonElement>();
const refresh: RefreshActionProps = {loading: false, error: false, labels: {idle: "Update", loading: "Updating", retry: "Retry"},
  onRefresh: event => { const button: HTMLButtonElement = event.currentTarget; button.focus(); }, disabled: false};
const action: ActionDisclosureAction = {label: "Edit records", buttonRef: actionRef, onClick() {}};
const status: LoadStatusProps = {issues, warnings, labels: {retry: "Retry records", loading: "Loading records"},
  renderHelp: (help: LoadStatusHelp) => { const tone: "error" | "warning" = help.tone; return <span>{help.message} {tone}</span>; }};
const disclosure: ActionDisclosureProps = {title: "Record options", children: <input aria-label="Record name"/>,
  headingLevel: 2, headingId: "records-title", action, classNames: {header: "host", heading: "host-title", action: "host-edit"}};
// @ts-expect-error RefreshAction owns type=button; consumers cannot opt into submission.
const submitRefresh: RefreshActionProps = {...refresh, type: "submit"};
// @ts-expect-error Heading levels follow the supported semantic heading contract.
const invalidHeading: ActionDisclosureProps = {...disclosure, headingLevel: 1};
export const controls = <>
  <LoadStatus {...status}/>
  <RefreshAction {...refresh} ref={refreshRef} variant="secondary" size="sm" data-record="one"/>
  <ActionDisclosure {...disclosure}/>
  <ToggleGroup options={toggles} value="orders" label="Documents" onChange={value => { const typed: "orders" | "returns" = value; }}/>
  <FacetFilter options={facets} selected={["all"]} label="Departments" available emptyLabel="Empty"
    moreLabel="More" fewerLabel="Fewer" onChange={values => { const typed: "all"[] = values; }}
    reset={{label: "Any", count: 0, selected: false, onSelect() {}}}/>
  <table><thead><tr><SortableTableHeader column="amount" label="Amount" active direction="asc"
    onSort={column => { const typed: "amount" = column; }} onDirection={() => {}}
    directionLabel="Reverse" directionIcon="^"/></tr></thead></table>
  <StatCard label="Orders" value={0} variant="compact" tone="success"/>
  <RankedBarList items={rows} maximum={10} label="Ranking" empty="Empty"/>
  <Toast open={false} message="Saved" dismissLabel="Dismiss" onDismiss={() => {}}/>
  <ColorPicker value="#123456" groups={groups} onSelect={() => {}} onChange={() => {}}
    label="Ink" inputLabel="Pick ink" hexLabel="Hex" invalidLabel="Invalid hex"
    draftValue="unfinished" onDraftChange={() => {}} triggerClassName="host"/>
  <NumberStepper value={0.5} min={0} max={1} step={0.1} onChange={() => {}} label="Quantity"
    decreaseLabel="Less" increaseLabel="More" valueLabel="Current quantity" decreaseIcon="-" increaseIcon="+"/>
  <LanguageSelector label="Locale" options={[{value: "ja", label: "Japanese"}]} value="ja" onChange={() => {}} variant="dropup"/>
</>;
initTheme();
`);
    for (const resolution of ["bundler", "NodeNext"]) typecheck("without-select.tsx", resolution);
  }
  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", join(temp, selectPacked.filename)], css);
  assert.ok(resolveInstalled.resolve("react-select"));
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
import {MultiSelect} from "@wintermuted/ui-react-select";
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
import {MultiSelect} from "@wintermuted/ui-react-select";
import {initTheme} from "@wintermuted/ui-react/theme";
assert.match(renderToString(React.createElement(Button, null, "Standalone")), /Standalone/);
assert.match(renderToString(React.createElement(MultiSelect, {options: []})), /input/);
assert.equal(initTheme(), "light");
`], { cwd: css, stdio: "inherit" });
  if (!packageOnly) {
  writeFileSync(join(css, "consumer.tsx"), `
import * as React from "react";
import {Button, Card, CardTitle, Input, Select, ListItem, Table, Dialog, Tabs, Menu, ThemeProvider, ThemeSelect} from "@wintermuted/ui-react";
import {MultiSelect} from "@wintermuted/ui-react-select";
import type {MultiSelectProps} from "@wintermuted/ui-react-select";
import {initTheme, getThemeScript} from "@wintermuted/ui-react/theme";
initTheme(); getThemeScript("test:theme");
const input = React.createRef<HTMLInputElement>();
const options = [{value: 1, label: "Main", stop: {id: 1}}];
const selectProps: MultiSelectProps<(typeof options)[number], false> = {
  isMulti: false, options, onChange: value => { const stop: number | undefined = value?.stop.id; },
};
export const app = <ThemeProvider><Card as="article"><CardTitle as="h4">Stops</CardTitle>
<Button onClick={e => e.currentTarget.focus()}>Refresh</Button>
<Input ref={input} onChange={e => console.log(e.currentTarget.value)}/>
<Select onChange={e => console.log(e.currentTarget.value)}><option>Main</option></Select>
<ListItem value={2}>Main</ListItem><Table responsive aria-label="Arrivals"/>
<MultiSelect options={options} defaultValue={options} onChange={values => values.map(o => o.stop.id)}/>
<MultiSelect isMulti={false} options={options} onChange={value => value?.stop.id}/>
<MultiSelect {...selectProps}/>
<Dialog open={false} onClose={() => {}} title="Stops"/><ThemeSelect/>
<Tabs label="Views" items={[{id:"a",label:"Arrivals",content:"Times"}]}/>
<Menu label="Actions" items={[{id:"a", label:"Refresh", onSelect: e => e.currentTarget.focus()}]}/>
</Card></ThemeProvider>;
`);
  for (const resolution of ["bundler", "NodeNext"]) typecheck("consumer.tsx", resolution);
  writeFileSync(join(css, "main.js"), `
import "@wintermuted/ui-theme/index.css";
import React from "react";
import {createRoot} from "react-dom/client";
import {Button, ThemeProvider, ThemeSelect} from "@wintermuted/ui-react";
import {MultiSelect} from "@wintermuted/ui-react-select";
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
  console.log(`Packed CSS-only, React ${reactMajor} with/without react-select, TypeScript 7 bundler/NodeNext, Vite 8 and Webpack 5 consumers passed.`);
  } else {
    console.log(`Packed CSS-only install, React ${reactMajor} SSR with/without react-select, and React-free theme imports passed.`);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
