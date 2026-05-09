import { prisma } from "@repo/db/client";
import { buildReportData, startOfToday } from "../lib/report-data.js";

const ACCESS_ACCEPT = "Accept";
const ACCESS_DENY = "Deny";
const DIRECTION_IN = "In";

function latestAcceptedEntryByEmployee(logs) {
  const latestByEmployee = new Map();

  for (const log of logs) {
    if (latestByEmployee.has(log.employeeId)) {
      continue;
    }

    latestByEmployee.set(log.employeeId, log);
  }

  return [...latestByEmployee.values()].filter((log) => log.direction === DIRECTION_IN).length;
}

export async function getReportData() {
  const today = startOfToday();

  const [checkedInToday, deniedToday, recentLogs, acceptedLogs] = await Promise.all([
    prisma.accessLog.count({
      where: {
        eventTime: {
          gte: today
        },
        result: ACCESS_ACCEPT,
        direction: DIRECTION_IN
      }
    }),
    prisma.accessLog.count({
      where: {
        eventTime: {
          gte: today
        },
        result: ACCESS_DENY
      }
    }),
    prisma.accessLog.findMany({
      include: {
        employee: true,
        site: true,
        accessPoint: true
      },
      orderBy: {
        eventTime: "desc"
      },
      take: 20
    }),
    prisma.accessLog.findMany({
      where: {
        result: ACCESS_ACCEPT
      },
      orderBy: {
        eventTime: "desc"
      },
      select: {
        employeeId: true,
        direction: true
      }
    })
  ]);

  return buildReportData({
    activeEmployees: latestAcceptedEntryByEmployee(acceptedLogs),
    checkedInToday,
    deniedToday,
    recentLogs
  });
}
