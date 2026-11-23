import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const registry = "https://registry.npmjs.org";
const projects = ["ui-theme", "ui-react"];
export const integrity = (bytes) => `sha512-${createHash("sha512").update(bytes).digest("base64")}`;

export function validatePackages(packages) {
  if (!Array.isArray(packages) || !packages.length) throw new Error("No prepared packages.");
  const seen = new Set();
  for (const pkg of packages) {
    if (!projects.includes(pkg.project) || seen.has(pkg.project) ||
        pkg.name !== `@wintermuted/${pkg.project}` ||
        !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pkg.version) ||
        typeof pkg.file !== "string" || basename(pkg.file) !== pkg.file ||
        !/^[A-Za-z0-9.-]+\.tgz$/.test(pkg.file) ||
        !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(pkg.integrity)) {
      throw new Error("Invalid prepared package identity.");
    }
    seen.add(pkg.project);
  }
  return packages;
}

export async function isPublished(pkg, fetchRegistry = fetch) {
  const response = await fetchRegistry(`${registry}/${encodeURIComponent(pkg.name)}/${pkg.version}`, {
    signal: AbortSignal.timeout(30000),
    headers: { accept: "application/json", "cache-control": "no-cache" }
  });
  const metadata = await response.json();
  if (response.status === 404 &&
      ["Not found", "No match found for version"].includes(metadata.error)) return false;
  if (!response.ok) throw new Error(`Registry lookup failed for ${pkg.name}@${pkg.version}: HTTP ${response.status}`);
  if (metadata.name !== pkg.name || metadata.version !== pkg.version ||
      metadata.dist?.integrity !== pkg.integrity) {
    throw new Error(`Registry identity/integrity mismatch for ${pkg.name}@${pkg.version}`);
  }
  return true;
}

export async function publishPackages(packages, { lookup = isPublished, publish, dryRun = false, attempts = {}, saveAttempts = () => {} } = {}) {
  validatePackages(packages);
  // Check the complete selection before any write; uncertainty is not absence.
  const pending = [];
  for (const pkg of packages) {
    if (await lookup(pkg)) console.log(`Verified already published: ${pkg.name}@${pkg.version}`);
    else {
      if (attempts[pkg.project] && attempts[pkg.project] !== "auth-failed") {
        throw new Error(`Prior publication is unresolved for ${pkg.name}@${pkg.version}; do not retry while registry visibility is uncertain.`);
      }
      pending.push(pkg);
    }
  }
  for (const pkg of pending) {
    if (dryRun) {
      console.log(`Would publish: ${pkg.name}@${pkg.version} (${pkg.integrity})`);
      continue;
    }
    attempts[pkg.project] = "attempted";
    saveAttempts(attempts);
    try {
      await publish(pkg);
      attempts[pkg.project] = "accepted";
      saveAttempts(attempts);
    } catch (error) {
      // A lost response may follow an accepted publication. Verify before retrying.
      if (!await lookup(pkg)) {
        if (error.retryableAuth === true) {
          attempts[pkg.project] = "auth-failed";
          saveAttempts(attempts);
        }
        throw error;
      }
    }
    if (!await lookup(pkg)) throw new Error(`Publication not visible for ${pkg.name}@${pkg.version}; retry only after registry verification.`);
    attempts[pkg.project] = "verified";
    saveAttempts(attempts);
    console.log(`Verified publication: ${pkg.name}@${pkg.version}`);
  }
}

export function preparePackages(source, destination, selected, run = execFileSync) {
  const selection = selected.split(",");
  if (!selection.length || new Set(selection).size !== selection.length ||
      selection.some((project) => !projects.includes(project))) throw new Error("Invalid release project selection.");
  mkdirSync(destination, { recursive: true });
  const packages = selection.map((project) => {
    const packageRoot = join(source, project === "ui-react" ? "dist/packages/ui-react" : "packages/ui-theme");
    const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
    const output = run("npm", ["pack", packageRoot, "--json", "--ignore-scripts", "--pack-destination", destination], {
      cwd: source, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"]
    });
    const [packed] = JSON.parse(output);
    const pkg = { project, name: manifest.name, version: manifest.version, file: packed.filename,
      integrity: integrity(readFileSync(join(destination, packed.filename))) };
    if (packed.name !== pkg.name || packed.version !== pkg.version || packed.integrity !== pkg.integrity) {
      throw new Error(`Packed identity mismatch for ${project}`);
    }
    return pkg;
  });
  validatePackages(packages);
  writeFileSync(join(destination, "publication.json"), `${JSON.stringify({ packages }, null, 2)}\n`);
  return packages;
}

async function main() {
  const [mode] = process.argv.slice(2);
  const destination = resolve(process.env.RELEASE_ARTIFACT_DIR || ".nx/prepared-release");
  if (mode === "prepare") {
    preparePackages(resolve(process.env.RELEASE_SOURCE_DIR || "."), destination, process.env.RELEASE_PROJECTS || "");
    return;
  }
  if (mode !== "publish") throw new Error("Choose prepare or publish.");
  let { packages } = JSON.parse(readFileSync(join(destination, "publication.json"), "utf8"));
  validatePackages(packages);
  if (process.env.RELEASE_PROJECTS) {
    const selected = process.env.RELEASE_PROJECTS.split(",");
    if (selected.some((project) => !packages.some((pkg) => pkg.project === project))) throw new Error("Selected project is not in the prepared release.");
    packages = packages.filter((pkg) => selected.includes(pkg.project));
  }
  for (const pkg of packages) {
    if (integrity(readFileSync(join(destination, pkg.file))) !== pkg.integrity) throw new Error(`Prepared tarball integrity mismatch for ${pkg.project}`);
    if (process.env.RELEASE_VERSION && pkg.version !== process.env.RELEASE_VERSION) throw new Error("Prepared version does not match the requested recovery.");
  }
  await publishPackages(packages, {
    dryRun: process.env.DRY_RUN === "true",
    attempts: existsSync(join(destination, "publication-attempts.json")) ?
      JSON.parse(readFileSync(join(destination, "publication-attempts.json"), "utf8")) : {},
    saveAttempts(attempts) {
      writeFileSync(join(destination, "publication-attempts.json"), `${JSON.stringify(attempts, null, 2)}\n`);
    },
    publish(pkg) {
      if (process.env.RELEASE_AUTH === "token" && !process.env.NODE_AUTH_TOKEN) {
        throw new Error("NPM_TOKEN is missing from the wintermuted-ui-theme environment.");
      }
      try {
        execFileSync("npm", ["publish", join(destination, pkg.file), "--access", "public", "--provenance", "--ignore-scripts", `--registry=${registry}`], {
          stdio: ["ignore", "inherit", "pipe"]
        });
      } catch (error) {
        const stderr = error.stderr?.toString() || "";
        process.stderr.write(stderr);
        error.retryableAuth = /npm error code (ENEEDAUTH|E401|E403|E404)\b/.test(stderr);
        throw error;
      }
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
