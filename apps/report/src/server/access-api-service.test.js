import assert from "node:assert/strict";
import test from "node:test";

process.env.JWT_SECRET ??= "test-secret";

const ids = {
  topDepartment: 910001n,
  childDepartment: 910002n,
  outsideDepartment: 910003n,
  topManager: 910001n,
  childManager: 910002n,
  childEmployee: 910003n,
  outsideEmployee: 910004n,
  site: 910001n,
  accessPoint: 910001n,
  acceptedLog: 1779628838152916801n,
  deniedLog: 1779628838152916802n,
  outsideDeniedLog: 1779628838152916803n
};

async function loadTestTarget(t) {
  if (!process.env.DATABASE_URL) {
    t.skip("DATABASE_URL is not configured");
    return null;
  }

  let target;
  try {
    const [{ prisma }, { ApiError, handleAccessApiRequest }] = await Promise.all([
      import("@repo/db/client"),
      import("./access-api-service.js")
    ]);
    target = { prisma, ApiError, handleAccessApiRequest };
  } catch (error) {
    t.skip(`report API target cannot be loaded: ${error.message}`);
    return null;
  }

  try {
    await target.prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    t.skip(`database is not reachable: ${error.message}`);
    return null;
  }

  return target;
}

async function cleanup(prisma) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET CONSTRAINTS ALL DEFERRED");
    await tx.accessLog.deleteMany({
      where: {
        logId: {
          in: [ids.acceptedLog, ids.deniedLog, ids.outsideDeniedLog]
        }
      }
    });
    await tx.accessPoint.deleteMany({
      where: {
        accessPointId: ids.accessPoint
      }
    });
    await tx.site.deleteMany({
      where: {
        siteId: ids.site
      }
    });
    await tx.departmentHierarchy.deleteMany({
      where: {
        ancestorDepartmentId: {
          in: [ids.topDepartment, ids.childDepartment, ids.outsideDepartment]
        }
      }
    });
    await tx.departmentHierarchy.deleteMany({
      where: {
        descendantDepartmentId: {
          in: [ids.topDepartment, ids.childDepartment, ids.outsideDepartment]
        }
      }
    });
    await tx.department.deleteMany({
      where: {
        departmentId: {
          in: [ids.topDepartment, ids.childDepartment, ids.outsideDepartment]
        }
      }
    });
    await tx.employee.deleteMany({
      where: {
        employeeId: {
          in: [ids.topManager, ids.childManager, ids.childEmployee, ids.outsideEmployee]
        }
      }
    });
  });
}

async function seed(prisma) {
  await cleanup(prisma);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET CONSTRAINTS ALL DEFERRED");

    await tx.employee.createMany({
      data: [
        employee(ids.topManager, "ReportTopManager", "top-manager@example.test", ids.topDepartment, "General Manager"),
        employee(ids.childManager, "ReportChildManager", "child-manager@example.test", ids.childDepartment, "Backend Manager"),
        employee(ids.childEmployee, "ReportChildEmployee", "child-employee@example.test", ids.childDepartment, "Backend Engineer"),
        employee(ids.outsideEmployee, "ReportOutsideEmployee", "outside@example.test", ids.outsideDepartment, "Outside Engineer")
      ]
    });

    await tx.department.createMany({
      data: [
        department(ids.topDepartment, "Report Top Department", ids.topManager),
        department(ids.childDepartment, "Report Child Department", ids.childManager),
        department(ids.outsideDepartment, "Report Outside Department", ids.outsideEmployee)
      ]
    });

    await tx.departmentHierarchy.createMany({
      data: [
        hierarchy(ids.topDepartment, ids.topDepartment, 0),
        hierarchy(ids.childDepartment, ids.childDepartment, 0),
        hierarchy(ids.outsideDepartment, ids.outsideDepartment, 0),
        hierarchy(ids.topDepartment, ids.childDepartment, 1)
      ]
    });

    await tx.site.create({
      data: {
        siteId: ids.site,
        siteName: "Report Test Site",
        siteAddress: "Test address",
        createdAt: new Date("2026-05-01T00:00:00Z"),
        updatedAt: new Date("2026-05-01T00:00:00Z")
      }
    });

    await tx.accessPoint.create({
      data: {
        accessPointId: ids.accessPoint,
        accessPointName: "Report Test Gate",
        siteId: ids.site,
        locationDescription: "Test gate",
        isActive: true,
        createdAt: new Date("2026-05-01T00:00:00Z"),
        updatedAt: new Date("2026-05-01T00:00:00Z")
      }
    });

    await tx.accessLog.createMany({
      data: [
        accessLog(ids.acceptedLog, ids.childEmployee, "In", "Accept", null, "2026-05-03T08:00:00Z"),
        accessLog(ids.deniedLog, ids.childEmployee, "In", "Deny", false, "2026-05-03T09:00:00Z"),
        accessLog(ids.outsideDeniedLog, ids.outsideEmployee, "In", "Deny", false, "2026-05-03T10:00:00Z")
      ]
    });
  });
}

function employee(employeeId, employeeName, email, departmentId, jobTitle) {
  return {
    employeeId,
    employeeName,
    email,
    phone: String(employeeId),
    password: `Pass${String(Number(employeeId)).slice(-4)}!`,
    jobTitle,
    departmentId,
    isActive: true,
    createdAt: new Date("2026-05-01T00:00:00Z"),
    updatedAt: new Date("2026-05-01T00:00:00Z")
  };
}

function department(departmentId, departmentName, managerId) {
  return {
    departmentId,
    departmentName,
    managerId,
    createdAt: new Date("2026-05-01T00:00:00Z"),
    updatedAt: new Date("2026-05-01T00:00:00Z")
  };
}

function hierarchy(ancestorDepartmentId, descendantDepartmentId, depth) {
  return {
    ancestorDepartmentId,
    descendantDepartmentId,
    depth
  };
}

function accessLog(logId, employeeId, direction, result, status, eventTime) {
  return {
    logId,
    employeeId,
    siteId: ids.site,
    accessPointId: ids.accessPoint,
    direction,
    result,
    status,
    reason: result === "Deny" ? "Anti-passback blocked: duplicate entry" : "Access granted",
    eventTime: new Date(eventTime),
    note: null,
    createdAt: new Date(eventTime)
  };
}

test("manager report APIs enforce department scope and update denied status", async (t) => {
  const target = await loadTestTarget(t);
  if (!target) return;

  const { prisma, ApiError, handleAccessApiRequest } = target;
  await seed(prisma);
  t.after(async () => cleanup(prisma));

  const topUser = { employeeId: Number(ids.topManager) };
  const childUser = { employeeId: Number(ids.childManager) };
  const regularUser = { employeeId: Number(ids.childEmployee) };

  const topEmployees = await handleAccessApiRequest({
    method: "GET",
    path: ["employees"],
    query: {},
    currentUser: topUser
  });
  assert.deepEqual(
    topEmployees.employees.map((item) => item.employeeId).sort((a, b) => a - b),
    [Number(ids.topManager), Number(ids.childManager), Number(ids.childEmployee)]
  );

  const regularEmployees = await handleAccessApiRequest({
    method: "GET",
    path: ["employees"],
    query: {},
    currentUser: regularUser
  });
  assert.deepEqual(
    regularEmployees.employees.map((item) => item.employeeId),
    [Number(ids.childEmployee)]
  );

  await assert.rejects(
    () =>
      handleAccessApiRequest({
        method: "GET",
        path: ["employees", String(ids.outsideEmployee)],
        query: {},
        currentUser: childUser
      }),
    (error) => error instanceof ApiError && error.status === 403
  );

  const deniedLogs = await handleAccessApiRequest({
    method: "GET",
    path: ["manager", "reports", "denied-access-logs"],
    query: {
      startDate: "2026-05-01",
      endDate: "2026-05-31"
    },
    currentUser: topUser
  });
  assert.deepEqual(
    deniedLogs.logs.map((log) => log.logId),
    [ids.deniedLog.toString()]
  );
  assert.equal(deniedLogs.logs[0].status, false);

  const updatedLog = await handleAccessApiRequest({
    method: "PATCH",
    path: ["manager", "access-logs", String(ids.deniedLog), "status"],
    query: {},
    body: {
      status: true
    },
    currentUser: topUser
  });
  assert.equal(updatedLog.status, true);

  await assert.rejects(
    () =>
      handleAccessApiRequest({
        method: "PATCH",
        path: ["manager", "access-logs", String(ids.acceptedLog), "status"],
        query: {},
        body: {
          status: true
        },
        currentUser: topUser
      }),
    (error) => error instanceof ApiError && error.status === 400
  );
});

test("team trend APIs respect department filters", async (t) => {
  const target = await loadTestTarget(t);
  if (!target) return;

  const { prisma, handleAccessApiRequest } = target;
  await seed(prisma);
  t.after(async () => cleanup(prisma));

  const topUser = { employeeId: Number(ids.topManager) };

  const allDistribution = await handleAccessApiRequest({
    method: "GET",
    path: ["manager", "reports", "team", "stay-hour-distribution"],
    query: {
      yearMonth: "2026-05"
    },
    currentUser: topUser
  });
  assert.equal(allDistribution.employeeCount, 3);

  const filteredDistribution = await handleAccessApiRequest({
    method: "GET",
    path: ["manager", "reports", "team", "stay-hour-distribution"],
    query: {
      yearMonth: "2026-05",
      department_id: String(ids.childDepartment)
    },
    currentUser: topUser
  });
  assert.equal(filteredDistribution.employeeCount, 2);
  assert.equal(filteredDistribution.dailyAverages[0].date, "2026-05-01");
  assert.equal(filteredDistribution.dailyAverages.at(-1).date, "2026-05-31");

  const statistics = await handleAccessApiRequest({
    method: "GET",
    path: ["manager", "reports", "team", "monthly-statistics"],
    query: {
      yearMonth: "2026-05",
      department_id: String(ids.childDepartment)
    },
    currentUser: topUser
  });
  assert.equal(statistics.yearMonth, "2026-05");
  assert.equal(statistics.averageCheckInTime, "08:00");
});
