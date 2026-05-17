import client from "prom-client";

export const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: "dpacs_access_",
});

export const accessCheckTotal = new client.Counter({
  name: "dpacs_access_check_total",
  help: "Total number of access check requests",
  labelNames: ["result"],
  registers: [register],
});

export const accessCheckDurationSeconds = new client.Histogram({
  name: "dpacs_access_check_duration_seconds",
  help: "Access check end-to-end request duration in seconds",
  labelNames: ["result"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

export const accessDependencyErrorsTotal = new client.Counter({
  name: "dpacs_access_dependency_errors_total",
  help: "Total number of access dependency errors",
  labelNames: ["dependency"],
  registers: [register],
});

export function getAccessCheckResultLabel(result) {
  if (typeof result?.result === "boolean") {
    return result.result ? "allowed" : "denied";
  }

  return "unknown";
}
