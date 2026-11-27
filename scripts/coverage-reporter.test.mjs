import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { coverageReporter } from "./coverage-reporter.mjs";

async function report(t, summary) {
  const directory = mkdtempSync(join(tmpdir(), "wm-coverage-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const events = summary ? [{ type: "test:coverage", data: { summary } }] : [];
  for await (const output of coverageReporter(events, { directory })) {
    assert.fail(`Unexpected reporter output: ${output}`);
  }
  return name => JSON.parse(readFileSync(join(directory, `${name}.json`), "utf8"));
}

test("coverage reporter publishes measured percentages and a per-file report", async t => {
  const summary = {
    files: [{ path: "packages/ui-react/src/theme.ts" }],
    totals: { coveredLinePercent: 95.25, coveredBranchPercent: 80, coveredFunctionPercent: 60 },
  };
  const read = await report(t, summary);
  for (const [metric, message, color] of [
    ["lines", "95.3%", "brightgreen"], ["branches", "80.0%", "yellow"], ["functions", "60.0%", "red"],
  ]) {
    assert.deepEqual(read(metric), { schemaVersion: 1, label: `React unit ${metric}`, message, color });
  }
  assert.deepEqual(read("summary"), summary);
});

test("coverage reporter rejects absent, empty, and invalid reports instead of publishing misleading badges", async t => {
  await assert.rejects(report(t), /did not produce a coverage report/);
  await assert.rejects(report(t, { files: [], totals: {} }), /No React library files/);
  for (const percent of [undefined, NaN, -1, 101]) {
    await assert.rejects(report(t, {
      files: [{ path: "packages/ui-react/src/theme.ts" }],
      totals: { coveredLinePercent: percent },
    }), /Invalid lines coverage/);
  }
});
