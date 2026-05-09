export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatDirection(direction) {
  return String(direction).toUpperCase() === "OUT" ? "EXIT" : "ENTER";
}

export function formatDecision(result) {
  return String(result).toUpperCase() === "DENY" ? "DENY" : "ALLOW";
}

export function formatEventRow(log) {
  const decision = formatDecision(log.result);
  const direction = formatDirection(log.direction);
  const employeeId = Number(log.employeeId);
  const accessPointId = Number(log.accessPointId);
  const siteId = Number(log.siteId);

  return {
    eventId: String(log.logId),
    logId: Number(log.logId),
    employeeId,
    userId: log.employee?.employeeName ?? `Employee ${employeeId}`,
    doorId: log.accessPoint?.accessPointName ?? `Access point ${accessPointId}`,
    factoryId: log.site?.siteName ?? `Site ${siteId}`,
    accessPointId,
    siteId,
    direction,
    decision,
    in: String(log.direction).toUpperCase() === "IN",
    pass: String(log.result).toUpperCase() === "ACCEPT",
    reason: log.reason,
    note: log.note,
    occurredAt: log.eventTime.toISOString(),
    time: log.eventTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
  };
}

export function buildReportData({ activeEmployees, checkedInToday, deniedToday, recentLogs }) {
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      activeEmployees,
      checkedInToday,
      pendingReviews: deniedToday
    },
    recentEvents: recentLogs.map(formatEventRow)
  };
}
