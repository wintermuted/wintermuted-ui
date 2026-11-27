import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export async function* coverageReporter(events, { directory = resolve("coverage") } = {}) {
  let reported = false;
  for await (const event of events) {
    if (event.type !== "test:coverage") continue;
    const { summary } = event.data;
    assert.ok(summary.files.length > 0, "No React library files were included in coverage");
    const badges = [
      ["lines", "coveredLinePercent"],
      ["branches", "coveredBranchPercent"],
      ["functions", "coveredFunctionPercent"],
    ].map(([metric, key]) => {
      const percent = summary.totals[key];
      assert.ok(Number.isFinite(percent) && percent >= 0 && percent <= 100, `Invalid ${metric} coverage`);
      return [metric, {
        schemaVersion: 1,
        label: `React unit ${metric}`,
        message: `${percent.toFixed(1)}%`,
        color: percent >= 90 ? "brightgreen" : percent >= 75 ? "yellow" : "red",
      }];
    });
    mkdirSync(directory, { recursive: true });
    for (const [metric, badge] of badges) {
      writeFileSync(resolve(directory, `${metric}.json`), `${JSON.stringify(badge)}\n`);
    }
    writeFileSync(resolve(directory, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    reported = true;
  }
  assert.ok(reported, "The test runner did not produce a coverage report");
}

export default coverageReporter;
