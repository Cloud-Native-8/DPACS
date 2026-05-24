import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TrendsPage from "../pages/trends.jsx";
import { fetchAccessApi, getStoredToken } from "../src/lib/access-api-client.js";
import { setupPageTest } from "./page-test-utils.js";

vi.mock("../src/lib/access-api-client.js", () => ({
  fetchAccessApi: vi.fn(),
  getStoredToken: vi.fn()
}));

const departments = [
  { departmentId: "company", departmentName: "Company" },
  { departmentId: "dep-eng", departmentName: "Engineering" }
];

const companyStatistics = {
  averageDailyStayHours: 8,
  averageDailyStayHoursDiffFromPreviousMonth: 1,
  averageCheckInTime: "09:05",
  averageCheckInTimeDiffMinutes: -5,
  averageCheckOutTime: "18:10",
  averageCheckOutTimeDiffMinutes: 0
};

const departmentStatistics = {
  averageDailyStayHours: 7.5,
  averageDailyStayHoursDiffFromPreviousMonth: -0.5,
  averageCheckInTime: "08:55",
  averageCheckInTimeDiffMinutes: 10,
  averageCheckOutTime: "17:40",
  averageCheckOutTimeDiffMinutes: -20
};

const distribution = {
  employeeCount: 3,
  dailyAverages: [
    {
      date: "2026-05-01",
      averageStayHours: 8,
      activeEmployeeCount: 2,
      employeeCount: 3
    }
  ]
};

const departmentDistribution = {
  employeeCount: 1,
  dailyAverages: [
    {
      date: "2026-05-01",
      averageStayHours: 7.5,
      activeEmployeeCount: 1,
      employeeCount: 1
    }
  ]
};

const installTrendsSuccessMock = () => {
  fetchAccessApi.mockImplementation((path) => {
    if (path === "/api/departments") {
      return Promise.resolve({ departments });
    }

    if (path.startsWith("/api/manager/reports/team/monthly-statistics")) {
      return Promise.resolve(path.includes("department_id=dep-eng") ? departmentStatistics : companyStatistics);
    }

    if (path.startsWith("/api/manager/reports/team/stay-hour-distribution")) {
      return Promise.resolve(path.includes("department_id=dep-eng") ? departmentDistribution : distribution);
    }

    return Promise.reject(new Error(`Unexpected path: ${path}`));
  });
};

describe("TrendsPage", () => {
  beforeEach(() => {
    setupPageTest();
    getStoredToken.mockReturnValue("test-token");
  });

  it("loads company statistics and heatmap data", async () => {
    installTrendsSuccessMock();

    render(<TrendsPage />);

    expect(await screen.findByText("8")).toBeInTheDocument();
    expect(screen.getByText("09:05")).toBeInTheDocument();
    expect(screen.getByText("18:10")).toBeInTheDocument();
    expect(screen.getByText(/團隊人數：3 人/)).toBeInTheDocument();
    expect(screen.getByText("8h")).toBeInTheDocument();
  });

  it("reloads team reports when a department is selected", async () => {
    installTrendsSuccessMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<TrendsPage />);

    await screen.findByText("8");
    await user.selectOptions(screen.getAllByRole("combobox")[2], "dep-eng");

    expect(await screen.findByText("7.5")).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchAccessApi).toHaveBeenCalledWith(
        expect.stringContaining("department_id=dep-eng"),
        "test-token"
      );
    });
  });

  it("reloads report data when the month changes", async () => {
    installTrendsSuccessMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<TrendsPage />);

    await screen.findByText("8");
    await user.selectOptions(screen.getAllByRole("combobox")[1], "4");

    await waitFor(() => {
      expect(fetchAccessApi).toHaveBeenCalledWith(
        expect.stringContaining("yearMonth=2026-04"),
        "test-token"
      );
    });
  });

  it("shows an empty heatmap state when distribution has no daily averages", async () => {
    fetchAccessApi.mockImplementation((path) => {
      if (path === "/api/departments") return Promise.resolve({ departments });
      if (path.includes("monthly-statistics")) return Promise.resolve(companyStatistics);
      return Promise.resolve({ employeeCount: 0, dailyAverages: [] });
    });

    render(<TrendsPage />);

    expect(await screen.findByText("目前沒有可顯示的熱力圖資料")).toBeInTheDocument();
  });

  it("shows an API error when team reports fail", async () => {
    fetchAccessApi.mockImplementation((path) => {
      if (path === "/api/departments") return Promise.resolve({ departments });
      return Promise.reject(new Error("team reports failed"));
    });

    render(<TrendsPage />);

    expect(await screen.findByText("team reports failed")).toBeInTheDocument();
  });
});
