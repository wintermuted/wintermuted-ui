import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { attachReleaseAsset } from "./release-assets.mjs";

const tag = "ui-react@1.2.1";
const repository = "wintermuted/wintermuted-ui";
const bytes = Buffer.from("verified npm tarball");
const asset = { id: 123, name: "wintermuted-ui-react-1.2.1.tgz", browser_download_url: "https://github.com/fixture.tgz" };
const release = (assets) => JSON.stringify({ tag_name: tag, draft: false, assets });
const inspect = async (name, version) => {
  assert.equal(name, "@wintermuted/ui-react");
  assert.equal(version, "1.2.1");
  return { bytes };
};

test("recovery uploads the exact verified tarball without clobber and verifies downloaded bytes", async () => {
  let uploaded = false;
  let downloadVerified = false;
  let temporaryPath;
  const url = await attachReleaseAsset(tag, repository, {
    inspect,
    gh: (args) => {
      if (args[0] === "release") {
        assert.deepEqual(args.slice(0, 3), ["release", "upload", tag]);
        assert.deepEqual(args.slice(4), ["--repo", repository]);
        temporaryPath = args[3];
        assert.deepEqual(readFileSync(temporaryPath), bytes);
        uploaded = true;
        return "";
      }
      if (args[1].includes("/releases/assets/")) {
        assert.equal(uploaded, true);
        downloadVerified = true;
        return bytes;
      }
      return release(uploaded ? [asset] : []);
    }
  });
  assert.equal(url, asset.browser_download_url);
  assert.equal(downloadVerified, true);
  assert.equal(existsSync(temporaryPath), false);
});

test("identical existing assets are verified without upload and mismatches fail closed", async () => {
  for (const content of [bytes, Buffer.from("different package")]) {
    const result = attachReleaseAsset(tag, repository, {
      inspect,
      gh: (args) => {
        assert.equal(args[0], "api", "Existing assets must never be uploaded or deleted");
        return args[1].includes("/releases/assets/") ? content : release([asset]);
      }
    });
    if (content === bytes) assert.equal(await result, asset.browser_download_url);
    else await assert.rejects(result, /differs.*refusing to overwrite/);
  }
});

test("missing publications, wrong releases and invalid selectors cannot upload", async () => {
  const noGh = () => assert.fail("Must not contact GitHub");
  await assert.rejects(attachReleaseAsset("showcase@1.0.0", repository, { inspect, gh: noGh }), /Assets require/);
  await assert.rejects(attachReleaseAsset(tag, "", { inspect, gh: noGh }), /owner\/repository/);
  await assert.rejects(attachReleaseAsset(tag, repository, { inspect: async () => null, gh: noGh }), /not visible/);
  await assert.rejects(attachReleaseAsset(tag, repository, {
    inspect,
    gh: () => JSON.stringify({ tag_name: "ui-react@1.2.0", assets: [] })
  }), /Invalid public release/);
});

test("uncertain upload failure is not retried and removes its temporary package", async () => {
  let uploads = 0;
  let temporaryPath;
  await assert.rejects(attachReleaseAsset(tag, repository, {
    inspect,
    gh: (args) => {
      if (args[0] === "api") return release([]);
      uploads += 1;
      temporaryPath = args[3];
      throw new Error("Upload connection closed");
    }
  }), /Upload connection closed/);
  assert.equal(uploads, 1);
  assert.equal(existsSync(temporaryPath), false);
});

test("standalone select releases attach their own verified npm tarball", async () => {
  const selectTag = "ui-react-select@0.1.0";
  const selectAsset = { ...asset, name: "wintermuted-ui-react-select-0.1.0.tgz" };
  const url = await attachReleaseAsset(selectTag, repository, {
    inspect: async (name, version) => {
      assert.equal(name, "@wintermuted/ui-react-select");
      assert.equal(version, "0.1.0");
      return { bytes };
    },
    gh: args => {
      assert.equal(args[0], "api");
      return args[1].includes("/releases/assets/") ? bytes :
        JSON.stringify({ tag_name: selectTag, draft: false, assets: [selectAsset] });
    },
  });
  assert.equal(url, selectAsset.browser_download_url);
});
