import { prisma } from "@repo/db/client";
import { ApiError } from "./api-error.js";

export { ApiError };

const DAY_MS = 24 * 60 * 60 * 1000;
const TAIPEI_TIME_ZONE = "Asia/Taipei";

function toInt(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number.parseInt(Array.isArray(value) ? value[0] : value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toBigInt(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const text = String(Array.isArray(value) ? value[0] : value).trim();

  if (!/^\d+$/.test(text)) {
    return undefined;
  }

  return BigInt(text);
}

function toNumber(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return Number(value);
}

function uniqueBigInts(values) {
  return [...new Set(values.map((value) => value.toString()))].map((value) =>
    BigInt(value),
  );
}

function isVisibleEmployee(scope, employeeId) {
  const id = BigInt(employeeId);
  return scope.employeeIds.some((visibleId) => visibleId === id);
}

function ensureVisibleEmployee(scope, employeeId) {
  if (!isVisibleEmployee(scope, employeeId)) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "You do not have permission to access this resource.",
    );
  }
}

function scopedEmployeeIdWhere(scope, requestedEmployeeId) {
  if (requestedEmployeeId) {
    if (!isVisibleEmployee(scope, requestedEmployeeId)) {
      return { in: [] };
    }

    return requestedEmployeeId;
  }

  return {
    in: scope.employeeIds,
  };
}

function scopedDepartmentIds(query, scope) {
  const departmentId = toBigInt(query.departmentId ?? query.department_id);

  if (!departmentId) {
    return scope.departmentIds;
  }

  return scope.departmentIds.filter(
    (visibleDepartmentId) => visibleDepartmentId === departmentId,
  );
}

function toText(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(Array.isArray(value) ? value[0] : value).trim();
}

function toDirection(value) {
  const text = toText(value)?.toUpperCase();
  if (text === "IN" || text === "OUT") {
    return text === "IN" ? "In" : "Out";
  }
  return undefined;
}

function toResult(value) {
  const text = toText(value)?.toUpperCase();
  if (text === "ACCEPT" || text === "ALLOW") {
    return "Accept";
  }
  if (text === "DENY" || text === "DENIED") {
    return "Deny";
  }
  return undefined;
}

function startOfDay(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function endOfDay(date) {
  return new Date(startOfDay(date).getTime() + DAY_MS - 1);
}

function taipeiDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TAIPEI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}

function taipeiDayRange(date = new Date()) {
  const { year, month, day } = taipeiDateParts(date);
  const start = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+08:00`);
  const end = new Date(start.getTime() + DAY_MS);

  return { start, end };
}

function parseDate(value, fallback) {
  const text = toText(value);
  if (!text) {
    return fallback;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function parseYearMonth(value) {
  const text = toText(value);
  if (!text || !/^\d{4}-\d{2}$/.test(text)) {
    return undefined;
  }

  const [year, month] = text
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  return { text, year, month };
}

function monthRange(yearMonth) {
  const start = new Date(Date.UTC(yearMonth.year, yearMonth.month - 1, 1));
  const end = new Date(Date.UTC(yearMonth.year, yearMonth.month, 1));
  return { start, end };
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatTime(date) {
  if (!date) {
    return null;
  }

  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes(),
  ).padStart(2, "0")}`;
}

function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatEventDate(date) {
  return date.toISOString().slice(0, 10);
}

function eventDayRange(date) {
  const start = new Date(`${formatEventDate(date)}T00:00:00.000Z`);
  return {
    start,
    end: new Date(start.getTime() + DAY_MS),
  };
}

function sameDay(a, b) {
  return formatEventDate(a) === formatDate(b);
}

function normalizeReason(reason) {
  if (!reason) {
    return "ACCESS_GRANTED";
  }

  return reason
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function inferJobLevel(employee) {
  const title = employee.jobTitle?.toLowerCase() ?? "";

  if (title.includes("director")) {
    return { jobLevelId: 1, jobLevelName: "Director", level: 1 };
  }
  if (title.includes("manager")) {
    return { jobLevelId: 2, jobLevelName: "Manager", level: 2 };
  }
  if (title.includes("engineer")) {
    return { jobLevelId: 3, jobLevelName: "Engineer", level: 3 };
  }
  if (title.includes("intern")) {
    return { jobLevelId: 5, jobLevelName: "Intern", level: 5 };
  }

  return { jobLevelId: 4, jobLevelName: "Staff", level: 4 };
}

function formatDepartment(department) {
  if (!department) {
    return null;
  }

  return {
    departmentId: toNumber(department.departmentId),
    departmentName: department.departmentName,
    parentDepartmentId: null,
    createdAt: department.createdAt?.toISOString() ?? null,
    updatedAt: department.updatedAt?.toISOString() ?? null,
  };
}

function formatEmployee(employee) {
  const jobLevel = inferJobLevel(employee);

  return {
    employeeId: toNumber(employee.employeeId),
    employeeName: employee.employeeName,
    email: employee.email,
    phone: employee.phone,
    jobTitle: employee.jobTitle,
    department: formatDepartment(employee.department),
    jobLevel,
    isActive: employee.isActive,
    createdAt: employee.createdAt?.toISOString() ?? null,
    updatedAt: employee.updatedAt?.toISOString() ?? null,
  };
}

function formatSite(site) {
  return {
    siteId: toNumber(site.siteId),
    siteName: site.siteName,
    siteAddress: site.siteAddress,
    createdAt: site.createdAt?.toISOString() ?? null,
    updatedAt: site.updatedAt?.toISOString() ?? null,
  };
}

function formatAccessPoint(accessPoint) {
  return {
    accessPointId: toNumber(accessPoint.accessPointId),
    siteId: toNumber(accessPoint.siteId),
    accessPointName: accessPoint.accessPointName,
    locationDescription: accessPoint.locationDescription,
    isActive: accessPoint.isActive,
    createdAt: accessPoint.createdAt?.toISOString() ?? null,
    updatedAt: accessPoint.updatedAt?.toISOString() ?? null,
  };
}

function formatAccessLog(log) {
  const result =
    String(log.result).toUpperCase() === "DENY" ? "DENY" : "ACCEPT";

  return {
    logId: log.logId.toString(),
    employeeId: toNumber(log.employeeId),
    employeeName: log.employee?.employeeName,
    siteId: toNumber(log.siteId),
    siteName: log.site?.siteName,
    accessPointId: toNumber(log.accessPointId),
    accessPointName: log.accessPoint?.accessPointName,
    direction: String(log.direction).toUpperCase() === "OUT" ? "OUT" : "IN",
    result,
    ...(result === "DENY" ? { status: Boolean(log.status) } : {}),
    reason: normalizeReason(log.reason),
    eventTime: log.eventTime.toISOString(),
    note: log.note,
    createdAt: log.createdAt?.toISOString() ?? null,
  };
}

function accessLogInclude() {
  return {
    employee: {
      include: {
        department: true,
      },
    },
    site: true,
    accessPoint: true,
  };
}

function buildAccessLogWhere(query, scope) {
  const startDate = parseDate(query.startDate);
  const endDate = parseDate(query.endDate);
  const where = {};
  const employeeId = toBigInt(query.employeeId);
  const siteId = toBigInt(query.siteId);
  const accessPointId = toBigInt(query.accessPointId);
  const result = toResult(query.result);
  const direction = toDirection(query.direction);

  where.employeeId = scopedEmployeeIdWhere(scope, employeeId);
  if (siteId) where.siteId = siteId;
  if (accessPointId) where.accessPointId = accessPointId;
  if (result) where.result = result;
  if (direction) where.direction = direction;

  if (startDate || endDate) {
    where.eventTime = {};
    if (startDate) where.eventTime.gte = startOfDay(startDate);
    if (endDate) where.eventTime.lte = endOfDay(endDate);
  }

  return where;
}

function employeeKeywordWhere(keyword) {
  if (!keyword) {
    return undefined;
  }

  return {
    OR: [
      { employeeName: { contains: keyword, mode: "insensitive" } },
      { email: { contains: keyword, mode: "insensitive" } },
      { phone: { contains: keyword, mode: "insensitive" } },
      { jobTitle: { contains: keyword, mode: "insensitive" } },
    ],
  };
}

async function resolveEmployeeId(query) {
  const employeeId = toBigInt(query.employeeId);
  if (employeeId) {
    return employeeId;
  }

  const employee = await prisma.employee.findFirst({
    orderBy: {
      employeeId: "asc",
    },
    select: {
      employeeId: true,
    },
  });

  return employee?.employeeId;
}

async function getVisibleEmployeeScope(currentUser) {
  const currentEmployeeId = BigInt(currentUser.employeeId);
  const currentEmployee = await prisma.employee.findUnique({
    where: {
      employeeId: currentEmployeeId,
    },
    select: {
      employeeId: true,
      departmentId: true,
    },
  });

  if (!currentEmployee) {
    throw new ApiError(401, "UNAUTHORIZED", "Current employee does not exist.");
  }

  const managedDepartments = await prisma.department.findMany({
    where: {
      managerId: currentEmployeeId,
    },
    select: {
      departmentId: true,
    },
  });

  if (managedDepartments.length === 0) {
    return {
      currentEmployeeId,
      isManager: false,
      departmentIds: [currentEmployee.departmentId],
      employeeIds: [currentEmployeeId],
    };
  }

  const managedDepartmentIds = managedDepartments.map(
    (department) => department.departmentId,
  );
  const descendantRows = await prisma.departmentHierarchy.findMany({
    where: {
      ancestorDepartmentId: {
        in: managedDepartmentIds,
      },
    },
    select: {
      descendantDepartmentId: true,
    },
  });
  const departmentIds = uniqueBigInts([
    ...managedDepartmentIds,
    ...descendantRows.map((row) => row.descendantDepartmentId),
  ]);
  const employees = await prisma.employee.findMany({
    where: {
      departmentId: {
        in: departmentIds,
      },
    },
    select: {
      employeeId: true,
    },
  });
  const employeeIds = uniqueBigInts([
    currentEmployeeId,
    ...employees.map((employee) => employee.employeeId),
  ]);

  return {
    currentEmployeeId,
    isManager: true,
    departmentIds,
    employeeIds,
  };
}

async function resolveScopedEmployeeId(query, scope) {
  const employeeId = toBigInt(query.employeeId);

  if (employeeId) {
    ensureVisibleEmployee(scope, employeeId);
    return employeeId;
  }

  return scope.currentEmployeeId;
}

async function listDepartments(scope) {
  const departments = await prisma.department.findMany({
    where: {
      departmentId: {
        in: scope.departmentIds,
      },
    },
    orderBy: {
      departmentId: "asc",
    },
  });

  const parentRows = await prisma.departmentHierarchy.findMany({
    where: {
      depth: 1,
    },
  });
  const parentByDepartment = new Map(
    parentRows.map((row) => [
      row.descendantDepartmentId,
      row.ancestorDepartmentId,
    ]),
  );

  return {
    departments: departments.map((department) => ({
      ...formatDepartment(department),
      parentDepartmentId: toNumber(
        parentByDepartment.get(department.departmentId),
      ),
    })),
  };
}

async function listEmployees(query, scope) {
  const keyword = toText(query.keyword);
  const jobLevelId = toInt(query.jobLevelId);
  const employees = await prisma.employee.findMany({
    where: {
      employeeId: {
        in: scope.employeeIds,
      },
      departmentId: {
        in: scopedDepartmentIds(query, scope),
      },
      ...employeeKeywordWhere(keyword),
    },
    include: {
      department: true,
    },
    orderBy: {
      employeeId: "asc",
    },
  });

  return {
    employees: employees
      .filter(
        (employee) =>
          !jobLevelId || inferJobLevel(employee).jobLevelId === jobLevelId,
      )
      .map(formatEmployee),
  };
}

async function getEmployee(employeeId, scope) {
  ensureVisibleEmployee(scope, employeeId);

  const employee = await prisma.employee.findUnique({
    where: {
      employeeId,
    },
    include: {
      department: true,
    },
  });

  if (!employee) {
    return null;
  }

  return formatEmployee(employee);
}

async function listSites() {
  const sites = await prisma.site.findMany({
    orderBy: {
      siteId: "asc",
    },
  });

  return {
    sites: sites.map(formatSite),
  };
}

async function listAccessPoints(siteId) {
  const accessPoints = await prisma.accessPoint.findMany({
    where: {
      siteId,
    },
    orderBy: {
      accessPointId: "asc",
    },
  });

  return {
    accessPoints: accessPoints.map(formatAccessPoint),
  };
}

async function listAccessLogs(query, scope) {
  const logs = await prisma.accessLog.findMany({
    where: buildAccessLogWhere(query, scope),
    include: accessLogInclude(),
    orderBy: {
      eventTime: "desc",
    },
  });

  return {
    logs: logs.map(formatAccessLog),
  };
}

async function latestAcceptedLogs(siteId, scope) {
  const logs = await prisma.accessLog.findMany({
    where: {
      employeeId: {
        in: scope.employeeIds,
      },
      result: "Accept",
      ...(siteId ? { siteId } : {}),
    },
    include: accessLogInclude(),
    orderBy: {
      eventTime: "desc",
    },
  });
  const latestByEmployee = new Map();

  for (const log of logs) {
    if (!latestByEmployee.has(log.employeeId)) {
      latestByEmployee.set(log.employeeId, log);
    }
  }

  return [...latestByEmployee.values()];
}

async function getAccessStatus(employeeId, query, scope) {
  ensureVisibleEmployee(scope, employeeId);

  const siteId = toBigInt(query.siteId);
  const log = await prisma.accessLog.findFirst({
    where: {
      employeeId,
      result: "Accept",
      ...(siteId ? { siteId } : {}),
    },
    orderBy: {
      eventTime: "desc",
    },
  });

  return {
    employeeId: toNumber(employeeId),
    siteId: toNumber(siteId ?? log?.siteId),
    isInside: String(log?.direction).toUpperCase() === "IN",
    currentState: log
      ? String(log.direction).toUpperCase() === "IN"
        ? "INSIDE"
        : "OUTSIDE"
      : "UNKNOWN",
    lastLogId: toNumber(log?.logId),
    lastDirection: log?.direction ?? null,
    lastTimestamp: log?.eventTime.toISOString() ?? null,
    lastAccessPointId: toNumber(log?.accessPointId),
  };
}

function calculateDailyWork(date, logs) {
  const dayLogs = logs
    .filter((log) => sameDay(log.eventTime, date))
    .sort((a, b) => a.eventTime - b.eventTime);
  let openIn = null;
  let workingMinutes = 0;

  for (const log of dayLogs) {
    if (String(log.result).toUpperCase() !== "ACCEPT") {
      continue;
    }

    if (String(log.direction).toUpperCase() === "IN" && !openIn) {
      openIn = log.eventTime;
      continue;
    }

    if (String(log.direction).toUpperCase() === "OUT" && openIn) {
      workingMinutes += Math.max(0, log.eventTime - openIn) / 60000;
      openIn = null;
    }
  }

  const workingHours = round(workingMinutes / 60);
  return {
    date: formatDate(date),
    workingHours,
    overtimeHours: round(Math.max(0, workingHours - 8)),
    overEightHours: workingHours > 8,
    isComplete:
      dayLogs.some((log) => String(log.direction).toUpperCase() === "IN") &&
      !openIn,
    accessEvents: dayLogs.map(formatAccessLog),
    deniedAccessLogs: dayLogs
      .filter((log) => String(log.result).toUpperCase() === "DENY")
      .map(formatAccessLog),
  };
}

async function getEmployeeLogs(employeeId, start, end) {
  return prisma.accessLog.findMany({
    where: {
      employeeId,
      eventTime: {
        gte: start,
        lt: end,
      },
    },
    include: accessLogInclude(),
    orderBy: {
      eventTime: "asc",
    },
  });
}

async function getAttendanceSummary(query, scope) {
  const employeeId = await resolveScopedEmployeeId(query, scope);
  const start = startOfDay(parseDate(query.startDate, new Date()));
  const end = endOfDay(parseDate(query.endDate, start));
  const logs = await getEmployeeLogs(
    employeeId,
    start,
    new Date(end.getTime() + 1),
  );
  const dailyRecords = [];

  for (let time = start.getTime(); time <= end.getTime(); time += DAY_MS) {
    dailyRecords.push(calculateDailyWork(new Date(time), logs));
  }

  const totalWorkingHours = round(
    dailyRecords.reduce((sum, record) => sum + record.workingHours, 0),
  );
  const totalOvertimeHours = round(
    dailyRecords.reduce((sum, record) => sum + record.overtimeHours, 0),
  );
  const incompleteDates = dailyRecords
    .filter((record) => record.accessEvents.length > 0 && !record.isComplete)
    .map((record) => record.date);
  const deniedAccessLogCount = dailyRecords.reduce(
    (sum, record) => sum + record.deniedAccessLogs.length,
    0,
  );

  return {
    employeeId: toNumber(employeeId),
    startDate: formatDate(start),
    endDate: formatDate(end),
    totalWorkingHours,
    totalOvertimeHours,
    isComplete: incompleteDates.length === 0,
    message: incompleteDates.length === 0 ? "Complete" : "結果不完整",
    incompleteDates,
    deniedAccessLogCount,
    accessLogs: logs.map(formatAccessLog),
  };
}

async function getDailyAttendance(query, scope) {
  const employeeId = await resolveScopedEmployeeId(query, scope);
  const date = startOfDay(parseDate(query.date, new Date()));
  const logs = await getEmployeeLogs(
    employeeId,
    date,
    new Date(date.getTime() + DAY_MS),
  );
  const daily = calculateDailyWork(date, logs);

  return {
    employeeId: toNumber(employeeId),
    ...daily,
  };
}

async function getTodayAttendanceStatus(query, scope) {
  const employeeId = await resolveScopedEmployeeId(query, scope);
  const { start, end } = taipeiDayRange();
  const logs = await getEmployeeLogs(employeeId, start, end);
  const acceptedIn = logs.find(
    (log) =>
      String(log.result).toUpperCase() === "ACCEPT" &&
      String(log.direction).toUpperCase() === "IN",
  );
  const acceptedOut = logs.findLast?.(
    (log) =>
      String(log.result).toUpperCase() === "ACCEPT" &&
      String(log.direction).toUpperCase() === "OUT",
  );
  const hasDeniedAccessLog = logs.some(
    (log) => String(log.result).toUpperCase() === "DENY",
  );
  const estimatedOffWorkTime = acceptedIn
    ? new Date(acceptedIn.eventTime.getTime() + 8 * 60 * 60 * 1000)
    : null;
  const remainingMinutes = estimatedOffWorkTime
    ? Math.max(0, Math.round((estimatedOffWorkTime - new Date()) / 60000))
    : null;

  return {
    employeeId: toNumber(employeeId),
    hasCheckInToday: Boolean(acceptedIn),
    estimatedOffWorkTime: acceptedOut
      ? acceptedOut.eventTime.toISOString()
      : (estimatedOffWorkTime?.toISOString() ?? null),
    remainingMinutes: acceptedOut ? 0 : remainingMinutes,
    calculable: Boolean(acceptedIn),
    message: acceptedIn
      ? `You have ${acceptedOut ? 0 : remainingMinutes} minutes remaining.`
      : "目前無法計算",
    hasDeniedAccessLog,
  };
}

async function getDeniedAccessLogs(query, scope) {
  const keyword = toText(query.keyword);
  const reason = toText(query.reason);
  const sortBy = toText(query.sortBy) ?? "eventTime";
  const order = toText(query.order)?.toLowerCase() === "asc" ? "asc" : "desc";
  const where = {
    ...buildAccessLogWhere(query, scope),
    result: "Deny",
  };

  if (reason) {
    where.reason = {
      contains: reason.replaceAll("_", " "),
      mode: "insensitive",
    };
  }

  if (keyword) {
    where.employee = employeeKeywordWhere(keyword);
  }

  const logs = await prisma.accessLog.findMany({
    where,
    include: accessLogInclude(),
    orderBy:
      sortBy === "employeeName"
        ? { employee: { employeeName: order } }
        : sortBy === "reason"
          ? { reason: order }
          : { eventTime: order },
  });

  return {
    logs: logs.map(formatAccessLog),
  };
}

async function getDeniedAccessLogDetail(logId, scope) {
  const deniedAccessLog = await prisma.accessLog.findUnique({
    where: {
      logId,
    },
    include: accessLogInclude(),
  });

  if (
    !deniedAccessLog ||
    String(deniedAccessLog.result).toUpperCase() !== "DENY"
  ) {
    return null;
  }

  ensureVisibleEmployee(scope, deniedAccessLog.employeeId);

  const { start, end } = eventDayRange(deniedAccessLog.eventTime);
  const dailyAccessSequence = await getEmployeeLogs(
    deniedAccessLog.employeeId,
    start,
    end,
  );

  return {
    deniedAccessLog: formatAccessLog(deniedAccessLog),
    dailyAccessSequence: dailyAccessSequence.map(formatAccessLog),
  };
}

async function updateAccessLogNote(logId, body, scope) {
  const existingLog = await prisma.accessLog.findUnique({
    where: {
      logId,
    },
    select: {
      employeeId: true,
    },
  });

  if (!existingLog) {
    return null;
  }

  ensureVisibleEmployee(scope, existingLog.employeeId);

  const log = await prisma.accessLog.update({
    where: {
      logId,
    },
    data: {
      note: body?.note ?? null,
    },
    include: accessLogInclude(),
  });

  return formatAccessLog(log);
}

async function updateAccessLogStatus(logId, body, scope) {
  if (typeof body?.status !== "boolean") {
    throw new ApiError(400, "BAD_REQUEST", "status must be a boolean.");
  }

  const existingLog = await prisma.accessLog.findUnique({
    where: {
      logId,
    },
    select: {
      employeeId: true,
      result: true,
    },
  });

  if (!existingLog) {
    return null;
  }

  if (String(existingLog.result).toUpperCase() !== "DENY") {
    throw new ApiError(
      400,
      "BAD_REQUEST",
      "Only denied access logs can update status.",
    );
  }

  ensureVisibleEmployee(scope, existingLog.employeeId);

  const log = await prisma.accessLog.update({
    where: {
      logId,
    },
    data: {
      status: body.status,
    },
    include: accessLogInclude(),
  });

  return formatAccessLog(log);
}

async function getPresenceSummary(query, scope) {
  const siteId = toBigInt(query.siteId);
  const [latestLogs, employeeCount] = await Promise.all([
    latestAcceptedLogs(siteId, scope),
    prisma.employee.count({
      where: {
        employeeId: {
          in: scope.employeeIds,
        },
        isActive: true,
      },
    }),
  ]);
  const insideCount = latestLogs.filter(
    (log) => String(log.direction).toUpperCase() === "IN",
  ).length;
  const outsideCount = Math.max(0, employeeCount - insideCount);

  return {
    siteId: toNumber(siteId),
    insideCount,
    outsideCount,
    message:
      insideCount > 0
        ? `${insideCount} employees are currently in the office.`
        : "No employees are currently in the office.",
  };
}

async function getPresenceEmployees(query, scope) {
  const siteId = toBigInt(query.siteId);
  const keyword = toText(query.keyword);
  const jobLevelId = toInt(query.jobLevelId);
  const latestLogs = await latestAcceptedLogs(siteId, scope);
  const insideLogs = latestLogs.filter(
    (log) => String(log.direction).toUpperCase() === "IN",
  );

  const employees = insideLogs
    .filter((log) => {
      const employee = log.employee;
      const keywordMatches =
        !keyword ||
        [
          employee.employeeName,
          employee.email,
          employee.phone,
          employee.jobTitle,
        ].some((value) => value.toLowerCase().includes(keyword.toLowerCase()));
      return (
        keywordMatches &&
        (!jobLevelId || inferJobLevel(employee).jobLevelId === jobLevelId)
      );
    })
    .map((log) => ({
      employeeId: toNumber(log.employeeId),
      employeeName: log.employee.employeeName,
      jobTitle: log.employee.jobTitle,
      jobLevelName: inferJobLevel(log.employee).jobLevelName,
      email: log.employee.email,
      phone: log.employee.phone,
      departmentId: toNumber(log.employee.departmentId),
      departmentName: log.employee.department?.departmentName ?? null,
      siteId: toNumber(log.siteId),
      isInside: true,
      lastAccessTime: log.eventTime.toISOString(),
    }));

  return {
    employees,
    message:
      employees.length > 0
        ? `${employees.length} employees are currently in the office.`
        : "No employees are currently in the office.",
  };
}

async function getMonthlyAttendanceReport(employeeId, query, scope) {
  ensureVisibleEmployee(scope, employeeId);

  const yearMonth = parseYearMonth(query.yearMonth);
  if (!yearMonth) {
    throw new ApiError(
      400,
      "BAD_REQUEST",
      "yearMonth must use YYYY-MM format.",
    );
  }

  const employee = await prisma.employee.findUnique({
    where: {
      employeeId,
    },
  });
  if (!employee) {
    return null;
  }

  const { start, end } = monthRange(yearMonth);
  const logs = await getEmployeeLogs(employeeId, start, end);
  const dailyRecords = [];

  for (let time = start.getTime(); time < end.getTime(); time += DAY_MS) {
    dailyRecords.push(calculateDailyWork(new Date(time), logs));
  }

  const activeRecords = dailyRecords.filter(
    (record) => record.accessEvents.length > 0,
  );
  const divisor = activeRecords.length || dailyRecords.length || 1;
  const totalWorkingHours = round(
    dailyRecords.reduce((sum, record) => sum + record.workingHours, 0),
  );
  const totalOvertimeHours = round(
    dailyRecords.reduce((sum, record) => sum + record.overtimeHours, 0),
  );
  const averageDailyWorkingHours = round(totalWorkingHours / divisor);
  const averageDailyOvertimeHours = round(totalOvertimeHours / divisor);

  return {
    employeeId: toNumber(employeeId),
    employeeName: employee.employeeName,
    yearMonth: yearMonth.text,
    totalWorkingHours,
    totalOvertimeHours,
    averageDailyWorkingHours,
    averageDailyOvertimeHours,
    overtimeWarning: averageDailyOvertimeHours > 1,
    dailyRecords,
  };
}

async function allDailyWorkRecords(start, end, scope, options = {}) {
  const employees = await prisma.employee.findMany({
    where: {
      employeeId: {
        in: scope.employeeIds,
      },
      departmentId: {
        in: options.departmentIds ?? scope.departmentIds,
      },
      isActive: true,
    },
    orderBy: {
      employeeId: "asc",
    },
  });
  const employeeIds = employees.map((employee) => employee.employeeId);
  const logs = employeeIds.length
    ? await prisma.accessLog.findMany({
        where: {
          employeeId: {
            in: employeeIds,
          },
          eventTime: {
            gte: start,
            lt: end,
          },
        },
        include: accessLogInclude(),
        orderBy: {
          eventTime: "asc",
        },
      })
    : [];

  return employees.map((employee) => {
    const employeeLogs = logs.filter(
      (log) => log.employeeId === employee.employeeId,
    );
    const dailyRecords = [];

    for (let time = start.getTime(); time < end.getTime(); time += DAY_MS) {
      dailyRecords.push(calculateDailyWork(new Date(time), employeeLogs));
    }

    return { employee, dailyRecords };
  });
}

async function getTeamMonthlyStatistics(query, scope) {
  const yearMonth = parseYearMonth(query.yearMonth);
  if (!yearMonth) {
    throw new ApiError(
      400,
      "BAD_REQUEST",
      "yearMonth must use YYYY-MM format.",
    );
  }

  const { start, end } = monthRange(yearMonth);
  const recordsByEmployee = await allDailyWorkRecords(start, end, scope, {
    departmentIds: scopedDepartmentIds(query, scope),
  });
  const employeeCount = recordsByEmployee.length;
  const activeRecords = recordsByEmployee.flatMap((item) =>
    item.dailyRecords.filter((record) => record.accessEvents.length > 0),
  );
  const activeDates = new Set(activeRecords.map((record) => record.date));
  const totalWorkingHours = activeRecords.reduce(
    (sum, record) => sum + record.workingHours,
    0,
  );
  const averageDailyStayHours = activeRecords.length
    ? round(totalWorkingHours / (employeeCount * activeDates.size || 1))
    : 0;
  const checkIns = activeRecords
    .map((record) =>
      record.accessEvents.find(
        (log) => log.result === "ACCEPT" && log.direction === "IN",
      ),
    )
    .filter(Boolean)
    .map((log) => new Date(log.eventTime));
  const checkOuts = activeRecords
    .map((record) =>
      [...record.accessEvents]
        .reverse()
        .find((log) => log.result === "ACCEPT" && log.direction === "OUT"),
    )
    .filter(Boolean)
    .map((log) => new Date(log.eventTime));
  const averageTime = (dates) => {
    if (!dates.length) return null;
    const minutes =
      dates.reduce(
        (sum, date) => sum + date.getUTCHours() * 60 + date.getUTCMinutes(),
        0,
      ) / dates.length;
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(Math.round(minutes % 60)).padStart(2, "0");
    return `${hour}:${minute}`;
  };
  const now = new Date();
  const statisticsEndDate = end > now ? now : new Date(end.getTime() - DAY_MS);

  return {
    yearMonth: yearMonth.text,
    statisticsEndDate: formatDate(statisticsEndDate),
    isCurrentMonth: now >= start && now < end,
    averageDailyStayHours,
    averageDailyStayHoursDiffFromPreviousMonth: 0,
    averageCheckInTime: averageTime(checkIns),
    averageCheckInTimeDiffMinutes: 0,
    averageCheckOutTime: averageTime(checkOuts),
    averageCheckOutTimeDiffMinutes: 0,
  };
}

async function getTeamWorkloadTrend(query, scope) {
  const year = toInt(query.year) ?? new Date().getUTCFullYear();
  const periodType =
    toText(query.periodType)?.toUpperCase() === "YEARLY"
      ? "YEARLY"
      : "QUARTERLY";
  const periods =
    periodType === "YEARLY"
      ? [
          {
            label: String(year),
            start: new Date(Date.UTC(year, 0, 1)),
            end: new Date(Date.UTC(year + 1, 0, 1)),
          },
        ]
      : [0, 1, 2, 3].map((quarter) => ({
          label: `${year}-Q${quarter + 1}`,
          start: new Date(Date.UTC(year, quarter * 3, 1)),
          end: new Date(Date.UTC(year, quarter * 3 + 3, 1)),
        }));

  const data = [];
  const departmentIds = scopedDepartmentIds(query, scope);
  for (const period of periods) {
    const recordsByEmployee = await allDailyWorkRecords(
      period.start,
      period.end,
      scope,
      {
        departmentIds,
      },
    );
    const records = recordsByEmployee.flatMap((item) =>
      item.dailyRecords.filter((record) => record.accessEvents.length > 0),
    );
    data.push({
      period: period.label,
      averageStayHours: records.length
        ? round(
            records.reduce((sum, record) => sum + record.workingHours, 0) /
              records.length,
          )
        : 0,
    });
  }

  return {
    periodType,
    data,
  };
}

async function getStayHourDistribution(query, scope) {
  const yearMonth = parseYearMonth(query.yearMonth);
  if (!yearMonth) {
    throw new ApiError(
      400,
      "BAD_REQUEST",
      "yearMonth must use YYYY-MM format.",
    );
  }

  const { start, end } = monthRange(yearMonth);
  const recordsByEmployee = await allDailyWorkRecords(start, end, scope, {
    departmentIds: scopedDepartmentIds(query, scope),
  });
  const employeeCount = recordsByEmployee.length;
  const dailyAverages = [];

  for (let time = start.getTime(); time < end.getTime(); time += DAY_MS) {
    const date = formatDate(new Date(time));
    const records = recordsByEmployee
      .map((item) => item.dailyRecords.find((record) => record.date === date))
      .filter(Boolean);
    const totalStayHours = round(
      records.reduce((sum, record) => sum + record.workingHours, 0),
    );
    const activeEmployeeCount = records.filter(
      (record) => record.accessEvents.length > 0,
    ).length;

    dailyAverages.push({
      date,
      averageStayHours: employeeCount
        ? round(totalStayHours / employeeCount)
        : 0,
      totalStayHours,
      employeeCount,
      activeEmployeeCount,
    });
  }

  return {
    yearMonth: yearMonth.text,
    employeeCount,
    dailyAverages,
  };
}

function jobLevels() {
  return {
    jobLevels: [
      { jobLevelId: 1, jobLevelName: "Director", level: 1 },
      { jobLevelId: 2, jobLevelName: "Manager", level: 2 },
      { jobLevelId: 3, jobLevelName: "Engineer", level: 3 },
      { jobLevelId: 4, jobLevelName: "Staff", level: 4 },
      { jobLevelId: 5, jobLevelName: "Intern", level: 5 },
    ],
  };
}

export async function handleAccessApiRequest({
  method,
  path,
  query,
  body,
  currentUser,
}) {
  if (!currentUser) {
    throw new ApiError(401, "UNAUTHORIZED", "Please login first.");
  }

  const segments = path.filter(Boolean);
  const joined = `/${segments.join("/")}`;
  const scope = await getVisibleEmployeeScope(currentUser);

  if (method === "GET" && joined === "/departments")
    return listDepartments(scope);
  if (method === "GET" && joined === "/employees")
    return listEmployees(query, scope);
  if (
    method === "GET" &&
    segments[0] === "employees" &&
    segments.length === 2
  ) {
    return getEmployee(toBigInt(segments[1]), scope);
  }
  if (method === "GET" && joined === "/job-levels") return jobLevels();
  if (method === "GET" && joined === "/sites") return listSites();
  if (
    method === "GET" &&
    segments[0] === "sites" &&
    segments[2] === "access-points"
  ) {
    return listAccessPoints(toBigInt(segments[1]));
  }
  if (method === "GET" && joined === "/access-logs")
    return listAccessLogs(query, scope);
  if (
    method === "GET" &&
    segments[0] === "employees" &&
    segments[2] === "access-status"
  ) {
    return getAccessStatus(toBigInt(segments[1]), query, scope);
  }
  if (method === "GET" && joined === "/me/attendance/summary") {
    return getAttendanceSummary(
      { ...query, employeeId: toNumber(scope.currentEmployeeId) },
      scope,
    );
  }
  if (method === "GET" && joined === "/me/attendance/daily") {
    return getDailyAttendance(
      { ...query, employeeId: toNumber(scope.currentEmployeeId) },
      scope,
    );
  }
  if (method === "GET" && joined === "/me/attendance/today-status") {
    return getTodayAttendanceStatus(
      { employeeId: toNumber(scope.currentEmployeeId) },
      scope,
    );
  }
  if (method === "GET" && joined === "/me/attendance/denied-access-logs") {
    return listAccessLogs(
      {
        ...query,
        employeeId: toNumber(scope.currentEmployeeId),
        result: "Deny",
      },
      scope,
    );
  }
  if (method === "GET" && joined === "/manager/reports/presence/summary")
    return getPresenceSummary(query, scope);
  if (method === "GET" && joined === "/manager/reports/presence/employees")
    return getPresenceEmployees(query, scope);
  if (
    method === "GET" &&
    segments[0] === "manager" &&
    segments[1] === "reports" &&
    segments[2] === "employees" &&
    segments[4] === "monthly-attendance"
  ) {
    return getMonthlyAttendanceReport(toBigInt(segments[3]), query, scope);
  }
  if (method === "GET" && joined === "/manager/reports/team/workload-trend")
    return getTeamWorkloadTrend(query, scope);
  if (method === "GET" && joined === "/manager/reports/team/monthly-statistics")
    return getTeamMonthlyStatistics(query, scope);
  if (
    method === "GET" &&
    joined === "/manager/reports/team/stay-hour-distribution"
  )
    return getStayHourDistribution(query, scope);
  if (method === "GET" && joined === "/manager/reports/denied-access-logs")
    return getDeniedAccessLogs(query, scope);
  if (
    method === "GET" &&
    segments[0] === "manager" &&
    segments[1] === "reports" &&
    segments[2] === "denied-access-logs" &&
    segments.length === 4
  ) {
    return getDeniedAccessLogDetail(toBigInt(segments[3]), scope);
  }
  if (
    method === "PATCH" &&
    segments[0] === "manager" &&
    segments[1] === "access-logs" &&
    segments[3] === "note"
  ) {
    return updateAccessLogNote(toBigInt(segments[2]), body, scope);
  }
  if (
    method === "PATCH" &&
    segments[0] === "manager" &&
    segments[1] === "access-logs" &&
    segments[3] === "status"
  ) {
    return updateAccessLogStatus(toBigInt(segments[2]), body, scope);
  }

  throw new ApiError(
    404,
    "NOT_FOUND",
    `No report API route for ${method} ${joined}`,
  );
}
