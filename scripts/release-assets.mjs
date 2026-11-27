import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { inspectPublication } from "./release-publication.mjs";

const runGh = (args) => execFileSync("gh", args, { stdio: ["ignore", "pipe", "inherit"] });

export async function attachReleaseAsset(tag, repository, {
  inspect = (name, version) => inspectPublication(name, version, fetch, { includeTarball: true }),
  gh = runGh
} = {}) {
  const match = /^(ui-theme|ui-react)@(\d+\.\d+\.\d+)$/.exec(tag || "");
  if (!match) throw new Error("Assets require ui-theme@X.Y.Z or ui-react@X.Y.Z");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || "")) throw new Error("A GitHub owner/repository is required");
  const [, project, version] = match;
  const publication = await inspect(`@wintermuted/${project}`, version);
  if (!publication) throw new Error(`${tag} is not visible in the registry`);
  const filename = `wintermuted-${project}-${version}.tgz`;
  const endpoint = `repos/${repository}/releases/tags/${encodeURIComponent(tag)}`;
  const readRelease = () => {
    const release = JSON.parse(gh(["api", endpoint]).toString());
    if (release.tag_name !== tag || release.draft) throw new Error(`Invalid public release for ${tag}`);
    return release;
  };
  const findAsset = (release) => {
    const assets = release.assets.filter((asset) => asset.name === filename);
    if (assets.length > 1) throw new Error(`Duplicate release assets for ${tag}`);
    return assets[0];
  };
  const verifyAsset = (asset) => {
    const bytes = gh(["api", `repos/${repository}/releases/assets/${asset.id}`, "-H", "Accept: application/octet-stream"]);
    if (!Buffer.from(bytes).equals(publication.bytes)) {
      throw new Error(`Release asset differs from the verified npm tarball: ${filename}; refusing to overwrite`);
    }
    return asset.browser_download_url;
  };
  const existing = findAsset(readRelease());
  if (existing) return verifyAsset(existing);
  const directory = mkdtempSync(join(tmpdir(), "wm-release-asset-"));
  try {
    const path = join(directory, filename);
    writeFileSync(path, publication.bytes);
    // Never clobber: an uncertain upload or concurrent asset requires read-only verification.
    gh(["release", "upload", tag, path, "--repo", repository]);
    const uploaded = findAsset(readRelease());
    if (!uploaded) throw new Error(`Uploaded asset is not visible for ${tag}; verify before retrying`);
    return verifyAsset(uploaded);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function main() {
  let tags = process.argv.slice(2);
  if (tags.length === 1 && tags[0] === "--released") {
    const projects = process.env.RELEASE_PROJECTS?.split(",");
    if (!projects?.length || projects.some((project) => !["ui-theme", "ui-react"].includes(project))) {
      throw new Error("RELEASE_PROJECTS must select only ui-theme and/or ui-react");
    }
    tags = projects.map((project) => {
      const manifest = JSON.parse(readFileSync(`packages/${project}/package.json`, "utf8"));
      if (manifest.name !== `@wintermuted/${project}`) throw new Error(`Invalid package identity for ${project}`);
      return `${project}@${manifest.version}`;
    });
  }
  if (!tags.length) throw new Error("Provide at least one package release tag");
  for (const tag of tags) {
    console.log(await attachReleaseAsset(tag, process.env.GH_REPO || process.env.GITHUB_REPOSITORY));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
