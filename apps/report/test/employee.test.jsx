import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmployeeViewPage from "../pages/employee.jsx";
import { fetchAccessApi, getStoredToken } from "../src/lib/access-api-client.js";
import { setupPageTest } from "./page-test-utils.js";

vi.mock("../src/lib/access-api-client.js", () => ({
  fetchAccessApi: vi.fn(),
  getStoredToken: vi.fn()
}));

const employeePayload = [
  {
    employeeId: "emp-1",
    employeeName: "Alice Chen",
    department: { departmentName: "Engineering" },
    email: "alice@example.com",
    jobTitle: "Developer"
  },
  {
    employeeId: "emp-2",
    employeeName: "Bob Lin",
    department: { departmentName: "Operations" },
    phone: "0912-000-000",
    jobTitle: "Operator"
  }
];

const monthlyReport = {
  totalWorkingHours: 9.5,
  averageDailyWorkingHours: 9.5,
  totalOvertimeHours: 1.5,
  averageDailyOvertimeHours: 1.5,
  dailyRecords: [
    {
      date: "2026-05-02",
      workingHours: 9.5,
      overtimeHours: 1.5,
      overEightHours: true,
      accessEvents: [
        {
          logId: "event-1",
          eventTime: "2026-05-02T01:00:00Z",
          direction: "IN",
          siteName: "HQ",
          accessPointName: "Front Door",
          result: "ACCEPT",
          note: ""
        }
      ]
    }
  ]
};

const installEmployeeSuccessMock = () => {
  fetchAccessApi.mockImplementation((path) => {
    if (path.startsWith("/api/employees")) {
      const keyword = new URL(path, "http://test.local").searchParams.get("keyword");
      return Promise.resolve({
        employees: keyword
          ? employeePayload.filter((employee) => employee.employeeName.includes(keyword))
          : employeePayload
      });
    }

    if (path.startsWith("/api/manager/reports/employees/")) {
      return Promise.resolve(monthlyReport);
    }

    return Promise.reject(new Error(`Unexpected path: ${path}`));
  });
};

describe("EmployeeViewPage", () => {
  beforeEach(() => {
    setupPageTest();
    getStoredToken.mockReturnValue("test-token");
  });

  it("loads employees, selects the first employee, and renders monthly metrics", async () => {
    installEmployeeSuccessMock();

    render(<EmployeeViewPage />);

    expect(await screen.findByText("Alice Chen")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(await screen.findAllByText("9.5")).toHaveLength(2);
    expect(screen.getAllByText("1.5")).toHaveLength(2);
  });

  it("selects an employee from search results and reloads the monthly report", async () => {
    installEmployeeSuccessMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<EmployeeViewPage />);

    await screen.findByText("Alice Chen");
    await user.type(screen.getByPlaceholderText("Search employee by name, department"), "Bob");
    await waitFor(() => {
      expect(screen.getAllByText("Bob Lin").length).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByText("Bob Lin")[0]);

    expect(screen.getByText("Operations")).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchAccessApi).toHaveBeenCalledWith(
        "/api/manager/reports/employees/emp-2/monthly-attendance?yearMonth=2026-05",
        "test-token"
      );
    });
  });

  it("reloads the monthly report when the month changes", async () => {
    installEmployeeSuccessMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<EmployeeViewPage />);

    await screen.findByText("Alice Chen");
    await user.selectOptions(screen.getAllByRole("combobox")[1], "4");

    await waitFor(() => {
      expect(fetchAccessApi).toHaveBeenCalledWith(
        "/api/manager/reports/employees/emp-1/monthly-attendance?yearMonth=2026-04",
        "test-token"
      );
    });
  });

  it("opens the access records modal when a day bar is clicked", async () => {
    installEmployeeSuccessMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<EmployeeViewPage />);

    await screen.findByText("Alice Chen");
    await user.click(screen.getByTitle("2026-05-02: 9.5h"));

    expect(screen.getByText("2026-05-02 進出紀錄")).toBeInTheDocument();
    expect(screen.getByText("HQ / Front Door")).toBeInTheDocument();
  });

  it("shows an error when employee loading fails", async () => {
    fetchAccessApi.mockRejectedValue(new Error("employees failed"));

    render(<EmployeeViewPage />);

    expect(await screen.findByText("employees failed")).toBeInTheDocument();
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });
});
