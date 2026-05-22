import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AnomaliesPage from "../pages/anomalies.jsx";
import { fetchAccessApi, getApiUrl, getStoredToken } from "../src/lib/access-api-client.js";
import { setupPageTest } from "./page-test-utils.js";

vi.mock("../src/lib/access-api-client.js", () => ({
  fetchAccessApi: vi.fn(),
  getApiUrl: vi.fn((path) => path),
  getStoredToken: vi.fn()
}));

const anomalyLog = {
  logId: "log-1",
  employeeName: "Alice Chen",
  eventTime: "2026-05-20T02:10:00Z",
  direction: "IN",
  result: "DENY",
  status: false
};

const detailPayload = {
  deniedAccessLog: anomalyLog,
  dailyAccessSequence: [
    {
      logId: "seq-1",
      eventTime: "2026-05-20T01:00:00Z",
      direction: "IN",
      result: "ACCEPT"
    },
    {
      logId: "log-1",
      eventTime: "2026-05-20T02:10:00Z",
      direction: "IN",
      result: "DENY"
    }
  ]
};

const installAnomalySuccessMock = () => {
  fetchAccessApi.mockImplementation((path) => {
    if (path.startsWith("/api/manager/reports/denied-access-logs/log-1")) {
      return Promise.resolve(detailPayload);
    }

    if (path.startsWith("/api/manager/reports/denied-access-logs")) {
      return Promise.resolve({ logs: [anomalyLog] });
    }

    return Promise.reject(new Error(`Unexpected path: ${path}`));
  });
};

describe("AnomaliesPage", () => {
  beforeEach(() => {
    setupPageTest();
    getStoredToken.mockReturnValue("test-token");
    getApiUrl.mockImplementation((path) => path);
    global.fetch = vi.fn();
  });

  it("loads and renders denied access logs", async () => {
    installAnomalySuccessMock();

    render(<AnomaliesPage />);

    expect(await screen.findByText("Alice Chen")).toBeInTheDocument();
    expect(screen.getByText("2026/05/20 02:10")).toBeInTheDocument();
    expect(screen.getByText("同進")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "待確認" })).toBeInTheDocument();
  });

  it("reloads logs when the selected month changes", async () => {
    installAnomalySuccessMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<AnomaliesPage />);

    await screen.findByText("Alice Chen");
    await user.clear(container.querySelector('input[type="month"]'));
    await user.type(container.querySelector('input[type="month"]'), "2026-04");

    await waitFor(() => {
      expect(fetchAccessApi).toHaveBeenCalledWith(
        expect.stringContaining("startDate=2026-04-01"),
        "test-token"
      );
    });
    expect(fetchAccessApi).toHaveBeenCalledWith(
      expect.stringContaining("endDate=2026-04-30"),
      "test-token"
    );
  });

  it("opens the detail modal for a denied log", async () => {
    installAnomalySuccessMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<AnomaliesPage />);

    await user.click(await screen.findByRole("button", { name: "待確認" }));

    expect(await screen.findByText("當天進出紀錄")).toBeInTheDocument();
    expect(screen.getByText("05/20")).toBeInTheDocument();
    expect(screen.getByText("01:00")).toBeInTheDocument();
    expect(screen.getByText("02:10")).toBeInTheDocument();
  });

  it("updates the selected anomaly status", async () => {
    installAnomalySuccessMock();
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...anomalyLog, status: true })
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<AnomaliesPage />);

    await user.click(await screen.findByRole("button", { name: "待確認" }));
    await user.click(await screen.findByLabelText("已確認"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/manager/access-logs/log-1/status",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: true })
        })
      );
    });
    expect(await screen.findByRole("button", { name: "已處理" })).toBeInTheDocument();
  });

  it("shows an update error without changing the status", async () => {
    installAnomalySuccessMock();
    global.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: "狀態更新失敗" })
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<AnomaliesPage />);

    await user.click(await screen.findByRole("button", { name: "待確認" }));
    await user.click(await screen.findByLabelText("已確認"));

    expect(await screen.findByText("狀態更新失敗")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "待確認" })).toBeInTheDocument();
  });

  it("shows an empty state when the month has no anomaly logs", async () => {
    fetchAccessApi.mockResolvedValue({ logs: [] });

    render(<AnomaliesPage />);

    expect(await screen.findByText(/沒有異常紀錄/)).toBeInTheDocument();
  });
});
