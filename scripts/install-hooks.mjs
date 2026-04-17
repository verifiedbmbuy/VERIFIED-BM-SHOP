import { execSync } from "node:child_process";

const run = (command) => execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

try {
  const inside = run("git rev-parse --is-inside-work-tree");
  if (inside !== "true") {
    console.log("[hooks] Not inside a git worktree. Skipping hook install.");
    process.exit(0);
  }

  run("git config core.hooksPath .githooks");
  console.log("[hooks] Installed. Git hooks path is now .githooks.");
} catch {
  console.log("[hooks] Git repository not detected. Skipping hook install.");
  process.exit(0);
}
