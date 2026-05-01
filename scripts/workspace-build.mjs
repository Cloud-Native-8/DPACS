import { spawn } from "node:child_process";
import { loadRootEnv } from "./run-with-root-env.mjs";

loadRootEnv();

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
      shell: false
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

await run("pnpm", ["--filter", "@repo/db", "generate"]);
await run("pnpm", ["-r", "--if-present", "build"]);
