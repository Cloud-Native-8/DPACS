import { spawn } from "node:child_process";

const imagePrefix = process.env.IMAGE_PREFIX ?? "dpacs";
const imageTag = process.env.IMAGE_TAG ?? "local";

const images = [
  {
    name: "access",
    dockerfile: "apps/access/Dockerfile",
    context: "."
  },
  {
    name: "report",
    dockerfile: "apps/report/Dockerfile",
    context: "."
  },
  {
    name: "worker",
    dockerfile: "apps/worker/Dockerfile",
    context: "."
  },
  {
    name: "db-migrate",
    dockerfile: "packages/db/Dockerfile.migrate",
    context: "."
  }
];

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

for (const image of images) {
  const tag = `${imagePrefix}/${image.name}:${imageTag}`;

  console.log(`\n==> Building ${tag}`);

  await run("docker", [
    "build",
    "-f",
    image.dockerfile,
    "-t",
    tag,
    image.context
  ]);
}
