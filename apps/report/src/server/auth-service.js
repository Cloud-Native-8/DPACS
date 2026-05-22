import { prisma } from "@repo/db/client";
import { ApiError } from "./api-error.js";
import { requireAuth, signJwt } from "./jwt-auth.js";

function toNumber(value) {
  return value === null || value === undefined ? null : Number(value);
}

function inferJobLevel(employee) {
  const title = employee.jobTitle?.toLowerCase() ?? "";

  if (title.includes("director")) return { jobLevelId: 1, jobLevelName: "Director", level: 1 };
  if (title.includes("manager")) return { jobLevelId: 2, jobLevelName: "Manager", level: 2 };
  if (title.includes("engineer")) return { jobLevelId: 3, jobLevelName: "Engineer", level: 3 };
  if (title.includes("intern")) return { jobLevelId: 5, jobLevelName: "Intern", level: 5 };
  return { jobLevelId: 4, jobLevelName: "Staff", level: 4 };
}

async function getParentDepartmentId(departmentId) {
  const parent = await prisma.departmentHierarchy.findFirst({
    where: {
      descendantDepartmentId: departmentId,
      depth: 1
    },
    select: {
      ancestorDepartmentId: true
    }
  });

  return parent?.ancestorDepartmentId ?? null;
}

function formatDepartment(department, parentDepartmentId) {
  if (!department) return null;

  return {
    departmentId: toNumber(department.departmentId),
    departmentName: department.departmentName,
    parentDepartmentId: toNumber(parentDepartmentId),
    createdAt: department.createdAt?.toISOString() ?? null,
    updatedAt: department.updatedAt?.toISOString() ?? null
  };
}

export async function formatEmployeeProfile(employee) {
  const parentDepartmentId = await getParentDepartmentId(employee.departmentId);

  return {
    employeeId: toNumber(employee.employeeId),
    employeeName: employee.employeeName,
    email: employee.email,
    phone: employee.phone,
    jobTitle: employee.jobTitle,
    department: formatDepartment(employee.department, parentDepartmentId),
    jobLevel: inferJobLevel(employee),
    isActive: employee.isActive,
    createdAt: employee.createdAt?.toISOString() ?? null,
    updatedAt: employee.updatedAt?.toISOString() ?? null
  };
}

async function findActiveEmployeeByEmail(email) {
  const employee = await prisma.employee.findUnique({
    where: {
      email
    },
    include: {
      department: true
    }
  });

  if (!employee || !employee.isActive) {
    return null;
  }

  return employee;
}

async function findActiveEmployeeById(employeeId) {
  const employee = await prisma.employee.findUnique({
    where: {
      employeeId: BigInt(employeeId)
    },
    include: {
      department: true
    }
  });

  if (!employee || !employee.isActive) {
    return null;
  }

  return employee;
}

export async function loginEmployee({ username, password }) {
  if (!username || !password) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid username or password.");
  }

  const employee = await findActiveEmployeeByEmail(username);

  if (!employee || employee.password !== password) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid username or password.");
  }

  const now = Math.floor(Date.now() / 1000);
  const employeeId = toNumber(employee.employeeId);
  const token = signJwt({
    sub: String(employeeId),
    employeeId,
    iat: now,
    exp: now + 60 * 60 * 8
  });

  return {
    token,
    employee: await formatEmployeeProfile(employee)
  };
}

export async function getCurrentEmployee(req) {
  const currentUser = requireAuth(req);
  const employee = await findActiveEmployeeById(currentUser.employeeId);

  if (!employee) {
    throw new ApiError(401, "UNAUTHORIZED", "Please login first.");
  }

  return formatEmployeeProfile(employee);
}
