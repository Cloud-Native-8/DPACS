import { prisma } from "@repo/db/client";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDirection(isEntry) {
  return isEntry ? "ENTER" : "EXIT";
}

function formatDecision(passed) {
  return passed ? "ALLOW" : "DENY";
}

function formatEventRow(event) {
  return {
    eventId: event.eventId,
    userId: event.userId,
    doorId: event.doorId,
    factoryId: event.factoryId,
    direction: formatDirection(event.in),
    decision: formatDecision(event.pass),
    in: event.in,
    pass: event.pass,
    occurredAt: event.occurredAt.toISOString(),
    time: event.occurredAt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
  };
}

export async function getReportData() {
  const today = startOfToday();

  const [checkedInToday, deniedToday, recentEvents, activeEmployeeRows] = await Promise.all([
    prisma.accessEvent.count({
      where: {
        occurredAt: {
          gte: today
        },
        pass: true,
        in: true
      }
    }),
    prisma.accessEvent.count({
      where: {
        occurredAt: {
          gte: today
        },
        pass: false
      }
    }),
    prisma.accessEvent.findMany({
      orderBy: {
        occurredAt: "desc"
      },
      take: 20
    }),
    prisma.accessEvent.findMany({
      where: {
        pass: true,
        in: true
      },
      distinct: ["userId"],
      select: {
        userId: true
      }
    })
  ]);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      activeEmployees: activeEmployeeRows.length,
      checkedInToday,
      pendingReviews: deniedToday
    },
    recentEvents: recentEvents.map(formatEventRow)
  };
}
