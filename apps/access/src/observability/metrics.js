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

export const accessCheckErrorsTotal = new client.Counter({
  name: "dpacs_access_check_errors_total",
  help: "Total number of failed access check requests",
  labelNames: ["reason"],
  registers: [register],
});

export const accessCheckDurationSeconds = new client.Histogram({
  name: "dpacs_access_check_duration_seconds",
  help: "Access check request duration in seconds",
  labelNames: ["result"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

export const accessSqsSendTotal = new client.Counter({
  name: "dpacs_access_sqs_send_total",
  help: "Total number of SQS send attempts from access service",
  labelNames: ["status"],
  registers: [register],
});

export const accessValkeyOperationErrorsTotal = new client.Counter({
  name: "dpacs_access_valkey_operation_errors_total",
  help: "Total number of Valkey operation errors",
  labelNames: ["operation"],
  registers: [register],
});

export function getAccessCheckResultLabel(result) {
  if (typeof result?.pass === "boolean") {
    return result.pass ? "allowed" : "denied";
  }

  if (typeof result?.allowed === "boolean") {
    return result.allowed ? "allowed" : "denied";
  }

  if (typeof result?.result === "string") {
    return result.result.toLowerCase();
  }

  return "unknown";
}
