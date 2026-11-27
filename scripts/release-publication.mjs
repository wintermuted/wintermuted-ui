import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { stripVTControlCharacters } from "node:util";

const registry = "https://registry.npmjs.org";
const packageRoots = { "ui-theme": "packages/ui-theme", "ui-react": "dist/packages/ui-react" };

export function isPreSubmissionAuthRejection(error) {
  if (!Number.isInteger(error.status) || error.status === 0) return false;
  const output = stripVTControlCharacters(`${error.stdout || ""}\n${error.stderr || ""}`).replaceAll("\r", "");
  // Nx preserves npm's ENEEDAUTH summary/detail, but not its structured error code.
  return /^npm publish error:\nThis command requires you to be logged in to https:\/\/registry\.npmjs\.org\/\nYou need to authorize this machine using `npm adduser`(?:\n|$)/m.test(output) &&
    !/Published to |Added the dist-tag /.test(output);
}

export async function inspectPublication(name, version, request = fetch, { includeTarball = false } = {}) {
  const response = await request(`${registry}/${encodeURIComponent(name)}/${encodeURIComponent(version)}`, {
    signal: AbortSignal.timeout(30000)
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Registry lookup failed for ${name}@${version}: HTTP ${response.status}`);
  const manifest = await response.json();
  if (manifest.name !== name || manifest.version !== version || !manifest.dist?.shasum) {
    throw new Error(`Invalid registry identity for ${name}@${version}`);
  }
  const tarballUrl = new URL(manifest.dist.tarball);
  if (tarballUrl.origin !== registry) throw new Error("Unexpected npm tarball origin");
  const tarball = await request(tarballUrl, { signal: AbortSignal.timeout(30000), redirect: "error" });
  if (!tarball.ok) throw new Error(`Tarball download failed for ${name}@${version}: HTTP ${tarball.status}`);
  const bytes = Buffer.from(await tarball.arrayBuffer());
  if (createHash("sha1").update(bytes).digest("hex") !== manifest.dist.shasum) {
    throw new Error(`Tarball checksum mismatch for ${name}@${version}`);
  }
  const integrity = manifest.dist.integrity;
  if (!integrity?.startsWith("sha512-") ||
      integrity !== `sha512-${createHash("sha512").update(bytes).digest("base64")}`) {
    throw new Error(`Tarball integrity mismatch for ${name}@${version}`);
  }
  return { name, version, shasum: manifest.dist.shasum, integrity, dependencies: manifest.dependencies,
    peerDependencies: manifest.peerDependencies, tarball: manifest.dist.tarball,
    ...(includeTarball ? { bytes } : {}) };
}

export async function publishProject({ name, version, shasum }, { inspect, trusted, fallback, sleep = setTimeout }) {
  const verify = async () => {
    const published = await inspect(name, version);
    if (published && published.shasum !== shasum) {
      throw new Error(`Refusing to reuse ${name}@${version}: registry content differs from the prepared package`);
    }
    return published;
  };
  if (await verify()) return;
  try {
    await trusted();
  } catch (error) {
    console.error(`Trusted publication failed for ${name}@${version}: ${error.message}`);
    // A failed command may still have submitted the package successfully.
    if (!await verify()) {
      if (!isPreSubmissionAuthRejection(error)) {
        throw new Error(`Trusted publication outcome is uncertain for ${name}@${version}; stop and verify read-only before recovery`, { cause: error });
      }
      await fallback();
    }
  }
  if (await verify()) return;
  console.log(`Waiting up to 10 minutes for registry visibility of ${name}@${version}; publication will not be retried`);
  // npm can accept an upload before its exact-version metadata becomes visible.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await sleep(15000);
    if (await verify()) return;
  }
  throw new Error(`Publication is not downloadable for ${name}@${version}; do not finalize or blindly retry`);
}

async function main() {
  if (process.argv[2] === "--inspect") {
    const tag = process.argv[3];
    const match = /^(ui-theme|ui-react)@(\d+\.\d+\.\d+)$/.exec(tag || "");
    if (!match) throw new Error("Inspection requires ui-theme@X.Y.Z or ui-react@X.Y.Z");
    const result = await inspectPublication(`@wintermuted/${match[1]}`, match[2]);
    if (!result) throw new Error(`${tag} is not visible in the registry`);
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const projects = process.env.RELEASE_PROJECTS?.split(",");
  if (!projects?.length || projects.some((project) => !Object.hasOwn(packageRoots, project))) {
    throw new Error("RELEASE_PROJECTS must select only ui-theme and/or ui-react");
  }
  const run = (args, env = process.env) => {
    const result = spawnSync("npm", args, {
      stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", maxBuffer: 10 * 1024 * 1024, env
    });
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    if (result.error || result.status !== 0) {
      throw Object.assign(result.error || new Error(`npm publication exited with status ${result.status}`), {
        status: result.status, stdout: result.stdout, stderr: result.stderr
      });
    }
  };
  for (const project of projects) {
    const root = packageRoots[project];
    const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const [packed] = JSON.parse(execFileSync("npm", ["pack", `./${root}`, "--dry-run", "--ignore-scripts", "--json"], {
      encoding: "utf8", stdio: ["ignore", "pipe", "inherit"]
    }));
    if (manifest.name !== `@wintermuted/${project}` || packed.name !== manifest.name ||
        packed.version !== manifest.version || !/^[a-f0-9]{40}$/.test(packed.shasum || "")) {
      throw new Error(`Invalid prepared package identity for ${project}`);
    }
    await publishProject({ ...manifest, shasum: packed.shasum }, {
      inspect: inspectPublication,
      trusted: () => run(["run", "release:publish", "--", `--projects=${project}`]),
      fallback: () => {
        if (!process.env.NPM_TOKEN) throw new Error(`No authorized NPM_TOKEN fallback is configured for ${project}`);
        const directory = mkdtempSync(join(tmpdir(), "wm-npm-auth-"));
        try {
          const config = join(directory, ".npmrc");
          writeFileSync(config, '//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n', { mode: 0o600 });
          run(["run", "release:publish", "--", `--projects=${project}`], {
            ...process.env, NPM_CONFIG_USERCONFIG: config, NODE_AUTH_TOKEN: process.env.NPM_TOKEN
          });
        } finally {
          rmSync(directory, { recursive: true, force: true });
        }
      }
    });
    console.log(`Verified downloadable prepared package: ${manifest.name}@${manifest.version}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
