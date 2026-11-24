import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { inspectPublication, publishProject } from "./release-publication.mjs";

const packageIdentity = { name: "@wintermuted/ui-theme", version: "1.0.1", shasum: "same-content" };

test("complementary trusted and fallback successes never republish the successful theme", async () => {
  const calls = [];
  const published = new Map();
  for (const name of ["@wintermuted/ui-theme", "@wintermuted/ui-react"]) {
    await publishProject({ ...packageIdentity, name }, {
      inspect: async () => published.get(name),
      trusted: async () => {
        calls.push(`trusted:${name}`);
        if (name.endsWith("ui-react")) throw new Error("Login required");
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

test("non-downloadable publication and failed fallback cannot finalize", async () => {
  await assert.rejects(publishProject(packageIdentity, {
    inspect: async () => null, trusted: async () => {}, fallback: async () => assert.fail("Must not retry successful submission")
  }), /not downloadable/);
  await assert.rejects(publishProject(packageIdentity, {
    inspect: async () => null,
    trusted: async () => { throw new Error("Login required"); },
    fallback: async () => { throw new Error("Token rejected"); }
  }), /Token rejected/);
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
