import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const registry = "https://registry.npmjs.org";
const packageRoots = { "ui-theme": "packages/ui-theme", "ui-react": "dist/packages/ui-react" };

export async function inspectPublication(name, version, request = fetch) {
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
    peerDependencies: manifest.peerDependencies, tarball: manifest.dist.tarball };
}

export async function publishProject({ name, version, shasum }, { inspect, trusted, fallback }) {
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
    if (!await verify()) await fallback();
  }
  if (!await verify()) throw new Error(`Publication is not downloadable for ${name}@${version}; do not finalize or blindly retry`);
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
  const run = (args, env = process.env) => execFileSync("npm", args, { stdio: "inherit", env });
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
