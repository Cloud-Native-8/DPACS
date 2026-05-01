import { spawn } from "node:child_process";
import { loadRootEnv } from "./run-with-root-env.mjs";
import { needsDbGenerate, resolvePackages } from "./workspace-targets.mjs";

loadRootEnv();

const args = process.argv.slice(2);
const packagesArgIndex = args.indexOf("--packages");
const selectedPackages = resolvePackages(
  packagesArgIndex === -1 ? "" : args[packagesArgIndex + 1]
);

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

if (packagesArgIndex === -1) {
  await run("pnpm", ["test"]);
} else if (selectedPackages.length > 0) {
  await run("pnpm", [
    ...selectedPackages.flatMap((pkg) => ["--filter", pkg]),
    "--if-present",
    "test"
  ]);
}

if (needsDbGenerate(selectedPackages)) {
  await run("pnpm", ["--filter", "@repo/db", "generate"]);
}

if (packagesArgIndex === -1) {
  await run("pnpm", ["build"]);
} else if (selectedPackages.length > 0) {
  await run("pnpm", [
    ...selectedPackages.flatMap((pkg) => ["--filter", pkg]),
    "--if-present",
    "build"
  ]);
}
