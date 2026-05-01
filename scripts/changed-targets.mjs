import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { analyzeChangedFiles, ALL_IMAGES, ALL_PACKAGES } from "./workspace-targets.mjs";

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];

    if (!part.startsWith("--")) {
      continue;
    }

    const key = part.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith("--")) {
      args[key] = "true";
      continue;
    }

    args[key] = value;
    index += 1;
  }

  return args;
}

function isZeroSha(value) {
  return /^0+$/.test(value);
}

function getChangedFiles(base, head) {
  const output = execFileSync("git", ["diff", "--name-only", base, head], {
    encoding: "utf8"
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toCsv(values) {
  return values.join(",");
}

function writeGithubOutput(outputPath, analysis) {
  const payload = [
    `mode=${analysis.mode}`,
    `should_run=${analysis.shouldRun ? "true" : "false"}`,
    `packages=${toCsv(analysis.packages)}`,
    `images=${toCsv(analysis.images)}`,
    "json<<__JSON__",
    JSON.stringify(analysis),
    "__JSON__"
  ].join("\n");

  appendFileSync(outputPath, `${payload}\n`, "utf8");
}

const args = parseArgs(process.argv.slice(2));

let analysis;

if (args.files) {
  analysis = analyzeChangedFiles(args.files.split(","));
} else if (!args.base || !args.head || isZeroSha(args.base)) {
  analysis = {
    mode: "full",
    shouldRun: true,
    packages: [...ALL_PACKAGES],
    images: [...ALL_IMAGES],
    reasons: ["missing diff base"]
  };
} else {
  analysis = analyzeChangedFiles(getChangedFiles(args.base, args.head));
}

if (args["github-output"]) {
  writeGithubOutput(args["github-output"], analysis);
} else {
  process.stdout.write(`${JSON.stringify(analysis, null, 2)}\n`);
}
