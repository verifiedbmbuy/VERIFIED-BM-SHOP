import { spawn } from "node:child_process";
import process from "node:process";

const dockerBin = "C:\\Program Files\\Docker\\Docker\\resources\\bin";
const env = { ...process.env };
const pathValue = env.PATH ?? env.Path ?? "";

if (process.platform === "win32" && !pathValue.toLowerCase().includes(dockerBin.toLowerCase())) {
  env.PATH = `${dockerBin};${pathValue}`;
}

const child = process.platform === "win32"
  ? spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "npx supabase start"], {
      stdio: "inherit",
      shell: false,
      env,
    })
  : spawn("npx", ["supabase", "start"], {
      stdio: "inherit",
      shell: false,
      env,
    });

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
