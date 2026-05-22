import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AttendanceQueryPage from "../pages/attendance.jsx";
import { fetchAccessApi, getStoredToken } from "../src/lib/access-api-client.js";
import { setupPageTest } from "./page-test-utils.js";

vi.mock("../src/lib/access-api-client.js", () => ({
  fetchAccessApi: vi.fn(),
  getStoredToken: vi.fn()
}));

const todayStatus = {
  estimatedOffWorkTime: "2026-05-23T10:30:00Z",
  remainingMinutes: 90
};

const summary = {
  totalWorkingHours: 9,
  totalOvertimeHours: 1,
  accessLogs: [
    {
      logId: "log-1",
      direction: "IN",
      result: "ACCEPT",
      eventTime: "2026-05-22T01:00:00Z"
    },
    {
      logId: "log-2",
      direction: "OUT",
      result: "ACCEPT",
      eventTime: "2026-05-22T10:00:00Z"
    }
  ]
};

const installAttendanceSuccessMock = () => {
  fetchAccessApi.mockImplementation((path) => {
    if (path === "/api/me/attendance/today-status") {
      return Promise.resolve(todayStatus);
    }

    if (path.startsWith("/api/me/attendance/summary")) {
      return Promise.resolve(summary);
    }

    return Promise.reject(new Error(`Unexpected path: ${path}`));
  });
};

const expectKpiValue = (label, value) => {
  const card = screen.getByText(label).closest("article");
  expect(within(card).getByText(value)).toBeInTheDocument();
};

describe("AttendanceQueryPage", () => {
  beforeEach(() => {
    setupPageTest();
    getStoredToken.mockReturnValue("test-token");
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("loads attendance KPIs and renders accepted access rows", async () => {
    installAttendanceSuccessMock();

    render(<AttendanceQueryPage />);

    await screen.findByText("總時數");
    expectKpiValue("總時數", "9");
    expectKpiValue("累積加班時數", "1");
    expectKpiValue("預估下班時間", "10:30");
    expectKpiValue("剩餘時數", "1.5");
    expect(screen.getByText("05/22")).toBeInTheDocument();
    expect(screen.getByText("01:00")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("uses the week preset to reload the summary query", async () => {
    installAttendanceSuccessMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<AttendanceQueryPage />);

    await screen.findByText("9");
    await user.click(screen.getByRole("button", { name: "本週" }));

    await waitFor(() => {
      expect(fetchAccessApi).toHaveBeenCalledWith(
        "/api/me/attendance/summary?startDate=2026-05-17&endDate=2026-05-23",
        "test-token"
      );
    });
  });

  it("keeps the date range valid when the start date moves after the end date", async () => {
    installAttendanceSuccessMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<AttendanceQueryPage />);

    await screen.findByText("9");
    const [startInput] = container.querySelectorAll('input[type="date"]');

    await user.clear(startInput);
    await user.type(startInput, "2026-05-23");

    await waitFor(() => {
      expect(fetchAccessApi).toHaveBeenCalledWith(
        "/api/me/attendance/summary?startDate=2026-05-23&endDate=2026-05-23",
        "test-token"
      );
    });
  });

  it("shows an error and fallback values when the attendance APIs fail", async () => {
    fetchAccessApi.mockRejectedValue(new Error("資料讀取失敗"));

    render(<AttendanceQueryPage />);

    expect(await screen.findByText("資料讀取失敗")).toBeInTheDocument();
    expect(within(screen.getByText("總時數").closest("article")).getByText("-")).toBeInTheDocument();
    expect(
      within(screen.getByText("預估下班時間").closest("article")).getByText("-")
    ).toBeInTheDocument();
  });
});
