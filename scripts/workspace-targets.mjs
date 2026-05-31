export const ALL_PACKAGES = [
  "@repo/access",
  "@repo/report",
  "@repo/worker",
  "@repo/db",
  "@repo/queue",
];

export const ALL_IMAGES = ["access", "report", "worker", "db-migrate"];

export const IMAGE_CONFIGS = {
  access: {
    dockerfile: "apps/access/Dockerfile",
    context: ".",
  },
  report: {
    dockerfile: "apps/report/Dockerfile",
    context: ".",
  },
  worker: {
    dockerfile: "apps/worker/Dockerfile",
    context: ".",
  },
  "db-migrate": {
    dockerfile: "packages/db/Dockerfile.migrate",
    context: ".",
  },
};

const FULL_REBUILD_PREFIXES = ["scripts/", ".github/workflows/"];

const FULL_REBUILD_FILES = new Set([
  ".dockerignore",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
]);

function addAll(set, values) {
  for (const value of values) {
    set.add(value);
  }
}

function hasPrefix(file, prefixes) {
  return prefixes.some((prefix) => file.startsWith(prefix));
}

function isDocumentationOnly(file) {
  return file.endsWith(".md") || file.startsWith("docs/");
}

function fullRebuildResult(file) {
  return {
    mode: "full",
    shouldRun: true,
    packages: [...ALL_PACKAGES],
    images: [...ALL_IMAGES],
    reasons: [file],
  };
}

function addTargetsForFile(file, packages, images) {
  if (file.startsWith("apps/access/")) {
    packages.add("@repo/access");
    images.add("access");
    return true;
  }

  if (file.startsWith("apps/report/")) {
    packages.add("@repo/report");
    images.add("report");
    return true;
  }

  if (file.startsWith("apps/worker/")) {
    packages.add("@repo/worker");
    images.add("worker");
    return true;
  }

  if (file.startsWith("packages/db/")) {
    addAll(packages, ["@repo/db", "@repo/report", "@repo/worker"]);
    addAll(images, ["db-migrate", "report", "worker"]);
    return true;
  }

  if (file.startsWith("packages/queue/")) {
    addAll(packages, ["@repo/queue", "@repo/access", "@repo/worker"]);
    addAll(images, ["access", "worker"]);
    return true;
  }

  return false;
}

export function resolvePackages(csv) {
  if (!csv) {
    return [...ALL_PACKAGES];
  }

  return csv
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function resolveImages(csv) {
  if (!csv) {
    return [...ALL_IMAGES];
  }

  return csv
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function needsDbGenerate(packages) {
  return packages.some(
    (pkg) =>
      pkg === "@repo/db" || pkg === "@repo/report" || pkg === "@repo/worker",
  );
}

export function analyzeChangedFiles(files) {
  const packages = new Set();
  const images = new Set();
  const ignored = [];

  for (const rawFile of files) {
    const file = rawFile.trim();

    if (!file) {
      continue;
    }

    if (
      FULL_REBUILD_FILES.has(file) ||
      hasPrefix(file, FULL_REBUILD_PREFIXES)
    ) {
      return fullRebuildResult(file);
    }

    if (isDocumentationOnly(file)) {
      ignored.push(file);
      continue;
    }

    if (addTargetsForFile(file, packages, images)) {
      continue;
    }

    return fullRebuildResult(file);
  }

  if (packages.size === 0 && images.size === 0) {
    return {
      mode: "none",
      shouldRun: false,
      packages: [],
      images: [],
      reasons: ignored,
    };
  }

  return {
    mode: "scoped",
    shouldRun: true,
    packages: [...packages],
    images: [...images],
    reasons: ignored,
  };
}
