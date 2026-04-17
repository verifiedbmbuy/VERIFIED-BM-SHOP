import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const PRODUCTION_SUPABASE_URL = "https://xukkejkvcgixogvbllmf.supabase.co";

const run = (command) => execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

const isGitRepo = () => {
  try {
    return run("git rev-parse --is-inside-work-tree") === "true";
  } catch {
    return false;
  }
};

const getTrackedFiles = () => {
  try {
    const out = run("git ls-files");
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const readFileSafe = (filePath) => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
};

const projectRoot = process.cwd();

if (!isGitRepo()) {
  console.log("[push-guard] No git repository detected. Skipping safety check.");
  process.exit(0);
}

const failures = [];
const warnings = [];

if (fs.existsSync(path.join(projectRoot, ".deploy-live"))) {
  failures.push(
    "Found .deploy-live marker. This enables production deploy tasks. Remove it before push unless this push is an intentional live deployment."
  );
}

const trackedFiles = getTrackedFiles();
const trackedSet = new Set(trackedFiles);

if (trackedSet.has(".env")) {
  failures.push(".env is tracked by git. This can leak secrets and production config. Untrack it before push.");
}

const trackedEnvFiles = trackedFiles.filter((f) => /^\.env(\..+)?$/.test(f) && !f.endsWith(".example"));

for (const envFile of trackedEnvFiles) {
  const content = readFileSafe(path.join(projectRoot, envFile));
  if (!content) continue;

  if (content.includes(PRODUCTION_SUPABASE_URL)) {
    failures.push(`${envFile} references production Supabase URL (${PRODUCTION_SUPABASE_URL}). Use a dev project for local/staging.`);
  }

  if (/^\s*VITE_ALLOW_PROD_DATA_IN_DEV\s*=\s*["']?true["']?\s*$/m.test(content)) {
    failures.push(`${envFile} sets VITE_ALLOW_PROD_DATA_IN_DEV=true. This can allow localhost writes to production.`);
  }

  if (/VITE_SUPABASE_PUBLISHABLE_KEY\s*=\s*["']?[A-Za-z0-9._\-]+=*["']?/m.test(content)) {
    warnings.push(`${envFile} includes a Supabase publishable key. Keep env files out of git unless intentionally public.`);
  }
}

if (warnings.length > 0) {
  console.log("[push-guard] Warnings:");
  for (const warning of warnings) console.log(`  - ${warning}`);
}

if (failures.length > 0) {
  console.error("\n[push-guard] Push blocked by safety checks:");
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error("\n[push-guard] Fix the items above, then push again.");
  process.exit(1);
}

console.log("[push-guard] Safety checks passed.");
