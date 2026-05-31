import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadRootEnv } from "./run-with-root-env.mjs";
import { resolvePackages } from "./workspace-targets.mjs";

loadRootEnv();

const args = process.argv.slice(2);
const packagesArgIndex = args.indexOf("--packages");
const selectedPackages = resolvePackages(
  packagesArgIndex === -1 ? "" : args[packagesArgIndex + 1],
);

const resultsDir = path.resolve(".test-results");

const packageLabels = new Map([
  ["@repo/access", "access-service"],
  ["@repo/report", "report-service"],
  ["@repo/worker", "worker"],
  ["@repo/db", "db"],
  ["@repo/queue", "queue"],
]);

const packageTestPlans = new Map([
  [
    "@repo/access",
    [
      {
        label: "node integration tests",
        type: "node-test",
        root: "apps/access/src",
      },
    ],
  ],
  [
    "@repo/report",
    [
      {
        label: "node server tests",
        type: "node-test",
        root: "apps/report/src",
      },
      {
        label: "vitest UI tests",
        type: "vitest",
        outputFile: path.join(resultsDir, "report-ui.junit.xml"),
      },
    ],
  ],
  ["@repo/worker", [{ label: "package test", type: "empty", message: "worker has no test cases" }]],
  ["@repo/db", [{ label: "package test", type: "empty", message: "db has no test cases" }]],
  ["@repo/queue", [{ label: "package test", type: "empty", message: "queue has no test cases" }]],
]);

function run(command, commandArgs, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, commandArgs, {
      cwd: options.cwd,
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("exit", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function findTestFiles(root) {
  const files = [];

  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (/\.test\.jsx?$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  if (existsSync(root)) {
    await walk(root);
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function decodeXml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&amp;", "&");
}

function parseAttributes(value) {
  const attrs = {};
  const pattern = /([A-Za-z_:][\w:.-]*)="([^"]*)"/g;
  let match;

  while ((match = pattern.exec(value)) !== null) {
    attrs[match[1]] = decodeXml(match[2]);
  }

  return attrs;
}

function parseJunit(xml, packageName, suiteLabel) {
  const testcases = [];
  const pattern = /<testcase\b([^>]*)>([\s\S]*?)<\/testcase>|<testcase\b([^>]*)\/>/g;
  let match;

  while ((match = pattern.exec(xml)) !== null) {
    const attrs = parseAttributes(match[1] ?? match[3] ?? "");
    const body = match[2] ?? "";
    const hasFailure = /<(failure|error)\b/.test(body);
    const hasSkipped = /<skipped\b/.test(body);
    let status = "passed";
    if (hasFailure) {
      status = "failed";
    } else if (hasSkipped) {
      status = "skipped";
    }

    testcases.push({
      packageName,
      app: packageLabels.get(packageName) ?? packageName,
      suite: suiteLabel,
      file: attrs.classname ?? "test",
      name: attrs.name ?? "unnamed test",
      duration: Number(attrs.time ?? 0),
      status,
    });
  }

  return testcases;
}

function summarize(cases) {
  const summary = { total: cases.length, passed: 0, failed: 0, skipped: 0 };

  for (const testCase of cases) {
    if (testCase.status === "passed") summary.passed += 1;
    if (testCase.status === "failed") summary.failed += 1;
    if (testCase.status === "skipped") summary.skipped += 1;
  }

  return summary;
}

function statusIcon(status) {
  if (status === "passed") return "✅ Passed";
  if (status === "failed") return "❌ Failed";
  if (status === "skipped") return "⏭️ Skipped";
  return "⚪ No tests";
}

function escapeMarkdown(value) {
  return String(value)
    .replaceAll("\\", String.raw`\\`)
    .replaceAll("|", String.raw`\|`)
    .replaceAll("\n", " ");
}

function packageStatus(summary, commandFailed, hasNoTests) {
  if (commandFailed || summary.failed > 0) return "failed";
  if (hasNoTests || summary.total === 0) return "none";
  if (summary.skipped === summary.total) return "skipped";
  return "passed";
}

async function runNodeTests(packageName, plan) {
  const files = await findTestFiles(plan.root);
  if (files.length === 0) {
    return { cases: [], commandFailed: false, note: "No test files found" };
  }

  const result = await run("node", ["--test", "--test-reporter=junit", ...files]);
  const cases = parseJunit(result.stdout, packageName, plan.label);

  return {
    cases,
    commandFailed: result.code !== 0,
    note: result.code === 0 ? "" : `Command exited with ${result.code}`,
  };
}

async function runVitestTests(packageName, plan) {
  await rm(plan.outputFile, { force: true });

  const result = await run("pnpm", [
    "--filter",
    packageName,
    "exec",
    "vitest",
    "run",
    "--reporter=junit",
    "--outputFile",
    path.relative(path.resolve("apps/report"), plan.outputFile),
  ]);

  const xml = existsSync(plan.outputFile) ? await readFile(plan.outputFile, "utf8") : "";
  const cases = parseJunit(xml, packageName, plan.label);

  return {
    cases,
    commandFailed: result.code !== 0,
    note: result.code === 0 ? "" : `Command exited with ${result.code}`,
  };
}

function emptyResult(packageName, plan) {
  return {
    cases: [],
    commandFailed: false,
    note: plan.message,
    app: packageLabels.get(packageName) ?? packageName,
    suite: plan.label,
    noTests: true,
  };
}

async function runPlan(packageName, plan) {
  if (plan.type === "node-test") {
    return runNodeTests(packageName, plan);
  }

  if (plan.type === "vitest") {
    return runVitestTests(packageName, plan);
  }

  return emptyResult(packageName, plan);
}

function renderMarkdown(packageResults, changedPackages) {
  const lines = [
    "## App test case results",
    "",
    "### Summary",
    "",
    "| App / Package | Suite | Status | Total | Passed | Failed | Skipped | Notes |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
  ];

  for (const result of packageResults) {
    const summary = summarize(result.cases);
    const status = packageStatus(summary, result.commandFailed, result.noTests);
    lines.push(
      `| ${escapeMarkdown(result.app)} | ${escapeMarkdown(result.suite)} | ${statusIcon(status)} | ${summary.total} | ${summary.passed} | ${summary.failed} | ${summary.skipped} | ${escapeMarkdown(result.note)} |`,
    );
  }

  lines.push("", "### Test cases", "");

  const allCases = packageResults.flatMap((result) => result.cases);
  if (allCases.length === 0) {
    lines.push("No test cases were discovered for the selected packages.");
  } else {
    lines.push(
      "| App / Package | Suite | Test case | Result | Duration |",
      "| --- | --- | --- | --- | ---: |",
    );

    for (const testCase of allCases) {
      lines.push(
        `| ${escapeMarkdown(testCase.app)} | ${escapeMarkdown(testCase.suite)} | ${escapeMarkdown(testCase.name)} | ${statusIcon(testCase.status)} | ${testCase.duration.toFixed(3)}s |`,
      );
    }
  }

  lines.push("", `**Changed packages:** \`${changedPackages || "none"}\``);

  return `${lines.join("\n")}\n`;
}

await mkdir(resultsDir, { recursive: true });

const packageResults = [];
let failed = false;

for (const packageName of selectedPackages) {
  const plans = packageTestPlans.get(packageName) ?? [];
  for (const plan of plans) {
    const result = await runPlan(packageName, plan);
    const summary = summarize(result.cases);
    const status = packageStatus(summary, result.commandFailed, result.noTests);

    packageResults.push({
      packageName,
      app: result.app ?? packageLabels.get(packageName) ?? packageName,
      suite: result.suite ?? plan.label,
      cases: result.cases,
      commandFailed: result.commandFailed,
      note: result.note ?? "",
      noTests: result.noTests ?? false,
    });

    if (status === "failed") {
      failed = true;
    }
  }
}

const changedPackages = packagesArgIndex === -1 ? selectedPackages.join(",") : (args[packagesArgIndex + 1] ?? "");
const markdown = renderMarkdown(packageResults, changedPackages);
const summaryPath = process.env.GITHUB_STEP_SUMMARY ?? path.join(resultsDir, "test-summary.md");

await writeFile(summaryPath, markdown, { flag: "a" });

if (failed) {
  process.exitCode = 1;
}
