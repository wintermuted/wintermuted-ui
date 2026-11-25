import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { inspectPublication, isPreSubmissionAuthRejection, publishProject } from "./release-publication.mjs";

const packageIdentity = { name: "@wintermuted/ui-theme", version: "1.0.1", shasum: "same-content" };
const loginRejection = () => Object.assign(new Error("npm exited with status 1"), {
  status: 1,
  stdout: "npm publish error:\nThis command requires you to be logged in to https://registry.npmjs.org/\nYou need to authorize this machine using `npm adduser`\n"
});

test("only captured pre-submission ENEEDAUTH output permits authentication fallback", () => {
  assert.equal(isPreSubmissionAuthRejection(loginRejection()), true);
  assert.equal(isPreSubmissionAuthRejection({ status: 1, stderr: loginRejection().stdout }), true);
  const colored = loginRejection();
  colored.stdout = Buffer.from(`\u001b[31m${colored.stdout.replaceAll("\n", "\r\n")}\u001b[0m`);
  assert.equal(isPreSubmissionAuthRejection(colored), true);
  for (const output of [
    "E401 Unauthorized",
    "E403 Forbidden",
    "409 Cannot publish over previously staged version",
    "ETIMEDOUT",
    "npm publish error:\nThis command requires you to be logged in to https://registry.npmjs.org/\n",
    `${loginRejection().stdout}Published to https://registry.npmjs.org/ with tag \"latest\"\n`
  ]) {
    assert.equal(isPreSubmissionAuthRejection({ status: 1, stdout: output }), false);
  }
  assert.equal(isPreSubmissionAuthRejection(new Error(loginRejection().stdout)), false);
  assert.equal(isPreSubmissionAuthRejection({ ...loginRejection(), status: 0 }), false);
});

test("complementary trusted and fallback successes never republish the successful theme", async () => {
  const calls = [];
  const published = new Map();
  for (const name of ["@wintermuted/ui-theme", "@wintermuted/ui-react"]) {
    await publishProject({ ...packageIdentity, name }, {
      inspect: async () => published.get(name),
      trusted: async () => {
        calls.push(`trusted:${name}`);
        if (name.endsWith("ui-react")) throw loginRejection();
        published.set(name, { shasum: packageIdentity.shasum });
      },
      fallback: async () => {
        calls.push(`fallback:${name}`);
        published.set(name, { shasum: packageIdentity.shasum });
      }
    });
  }
  assert.deepEqual(calls, ["trusted:@wintermuted/ui-theme", "trusted:@wintermuted/ui-react", "fallback:@wintermuted/ui-react"]);
});

test("an exact existing version is skipped, but different content and registry errors block retries", async () => {
  const publish = async () => assert.fail("Must not publish");
  await publishProject(packageIdentity, {
    inspect: async () => packageIdentity, trusted: publish, fallback: publish
  });
  await assert.rejects(publishProject(packageIdentity, {
    inspect: async () => ({ shasum: "different-content" }), trusted: publish, fallback: publish
  }), /registry content differs/);
  await assert.rejects(publishProject(packageIdentity, {
    inspect: async () => { throw new Error("Registry unavailable"); }, trusted: publish, fallback: publish
  }), /Registry unavailable/);
});

test("a failed trusted command that submitted the package is verified without fallback", async () => {
  let submitted = false;
  await publishProject(packageIdentity, {
    inspect: async () => submitted ? packageIdentity : null,
    trusted: async () => { submitted = true; throw new Error("Uncertain response"); },
    fallback: async () => assert.fail("Must not retry accepted content")
  });
});

test("an accepted submission that throws while still invisible stops without fallback", async () => {
  let submitted = false;
  let inspections = 0;
  await assert.rejects(publishProject(packageIdentity, {
    inspect: async () => { inspections += 1; return null; },
    trusted: async () => { submitted = true; throw new Error("Connection closed after submission"); },
    fallback: async () => assert.fail("A 404 must not authorize resubmission")
  }), /outcome is uncertain/);
  assert.equal(submitted, true);
  assert.equal(inspections, 2);
});

test("non-downloadable publication and failed fallback cannot finalize", async () => {
  let submissions = 0;
  let inspections = 0;
  const waits = [];
  await assert.rejects(publishProject(packageIdentity, {
    inspect: async () => { inspections += 1; return null; },
    trusted: async () => { submissions += 1; },
    fallback: async () => assert.fail("Must not retry successful submission"),
    sleep: async (milliseconds) => { waits.push(milliseconds); }
  }), /not downloadable/);
  assert.equal(submissions, 1);
  assert.equal(inspections, 42);
  assert.equal(waits.length, 40);
  assert.equal(waits.reduce((total, milliseconds) => total + milliseconds, 0), 600000);
  await assert.rejects(publishProject(packageIdentity, {
    inspect: async () => null,
    trusted: async () => { throw loginRejection(); },
    fallback: async () => { throw new Error("Token rejected"); }
  }), /Token rejected/);
});

test("delayed registry visibility after either publication path waits read-only without resubmitting", async () => {
  for (const useFallback of [false, true]) {
    const calls = [];
    let inspections = 0;
    let elapsed = 0;
    await publishProject(packageIdentity, {
      inspect: async () => {
        inspections += 1;
        return elapsed >= 405000 ? packageIdentity : null;
      },
      trusted: async () => {
        calls.push("trusted");
        if (useFallback) throw loginRejection();
      },
      fallback: async () => { calls.push("fallback"); },
      sleep: async (milliseconds) => { elapsed += milliseconds; }
    });
    assert.deepEqual(calls, useFallback ? ["trusted", "fallback"] : ["trusted"]);
    assert.equal(elapsed, 405000);
    assert.equal(inspections, useFallback ? 30 : 29);
  }
});

test("visibility polling fails closed on different content or registry errors", async () => {
  for (const result of [{ shasum: "different-content" }, new Error("Registry unavailable")]) {
    let inspections = 0;
    let waits = 0;
    let submissions = 0;
    await assert.rejects(publishProject(packageIdentity, {
      inspect: async () => {
        inspections += 1;
        if (inspections <= 2) return null;
        if (result instanceof Error) throw result;
        return result;
      },
      trusted: async () => { submissions += 1; },
      fallback: async () => assert.fail("Visibility errors must not authorize resubmission"),
      sleep: async () => { waits += 1; }
    }), result instanceof Error ? /Registry unavailable/ : /registry content differs/);
    assert.equal(submissions, 1);
    assert.equal(waits, 1);
    assert.equal(inspections, 3);
  }
});

test("inspection verifies exact metadata and downloaded SHA-1 and SHA-512 digests", async () => {
  const bytes = Buffer.from("published tarball fixture");
  const manifest = {
    name: packageIdentity.name, version: packageIdentity.version,
    dependencies: { "@wintermuted/ui-theme": "^1.0.1" },
    dist: {
      tarball: "https://registry.npmjs.org/fixture.tgz",
      shasum: createHash("sha1").update(bytes).digest("hex"),
      integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`
    }
  };
  const request = async (url) => new Response(String(url).endsWith(".tgz") ? bytes : JSON.stringify(manifest));
  const result = await inspectPublication(manifest.name, manifest.version, request);
  assert.equal(result.shasum, manifest.dist.shasum);
  assert.deepEqual(result.dependencies, manifest.dependencies);
  manifest.dist.integrity = "sha512-invalid";
  await assert.rejects(inspectPublication(manifest.name, manifest.version, request), /integrity mismatch/);
  manifest.dist.shasum = "invalid";
  await assert.rejects(inspectPublication(manifest.name, manifest.version, request), /checksum mismatch/);
  manifest.name = "@wintermuted/other";
  await assert.rejects(inspectPublication(packageIdentity.name, manifest.version, request), /Invalid registry identity/);
});

test("only an explicit 404 means absent; network, authorization and tarball errors fail closed", async () => {
  assert.equal(await inspectPublication(packageIdentity.name, packageIdentity.version, async () => new Response("", { status: 404 })), null);
  for (const status of [401, 429, 500]) {
    await assert.rejects(inspectPublication(packageIdentity.name, packageIdentity.version, async () => new Response("", { status })), /Registry lookup failed/);
  }
  await assert.rejects(inspectPublication(packageIdentity.name, packageIdentity.version, async () => { throw new Error("TLS failed"); }), /TLS failed/);
});
