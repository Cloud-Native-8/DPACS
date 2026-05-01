import { spawn } from "node:child_process";
import { IMAGE_CONFIGS, resolveImages } from "./workspace-targets.mjs";

const args = process.argv.slice(2);
const imageArgIndex = args.indexOf("--images");
const pushEnabled = args.includes("--push");
const additionalTagsArgIndex = args.indexOf("--additional-tags");
const imagePrefix = process.env.IMAGE_PREFIX ?? "dpacs";
const imageTag = process.env.IMAGE_TAG ?? "local";
const additionalTags = additionalTagsArgIndex === -1
  ? []
  : args[additionalTagsArgIndex + 1].split(",").map((value) => value.trim()).filter(Boolean);
const images = resolveImages(imageArgIndex === -1 ? "" : args[imageArgIndex + 1]);

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

for (const imageName of images) {
  const image = IMAGE_CONFIGS[imageName];
  const tags = [imageTag, ...additionalTags].map((tagName) => `${imagePrefix}/${imageName}:${tagName}`);

  console.log(`\n==> Building ${tags.join(", ")}`);

  await run("docker", [
    "build",
    "-f",
    image.dockerfile,
    ...tags.flatMap((tag) => ["-t", tag]),
    image.context
  ]);

  if (pushEnabled) {
    for (const tag of tags) {
      await run("docker", ["push", tag]);
    }
  }
}
