import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RealTimePeoplePage from "../pages/realtime.jsx";
import { fetchAccessApi, getStoredToken } from "../src/lib/access-api-client.js";
import { setupPageTest } from "./page-test-utils.js";

vi.mock("../src/lib/access-api-client.js", () => ({
  fetchAccessApi: vi.fn(),
  getStoredToken: vi.fn()
}));

const employees = [
  {
    employeeId: "emp-1",
    employeeName: "Alice Chen",
    departmentName: "Engineering",
    jobTitle: "Developer",
    email: "alice@example.com"
  },
  {
    employeeId: "emp-2",
    employeeName: "Bob Lin",
    departmentName: "Operations",
    jobTitle: "Operator",
    phone: "0912-000-000"
  }
];

const installPresenceSuccessMock = () => {
  fetchAccessApi.mockImplementation((path) => {
    if (path === "/api/manager/reports/presence/summary") {
      return Promise.resolve({ insideCount: 2, outsideCount: 5 });
    }

    if (path.startsWith("/api/manager/reports/presence/employees")) {
      const keyword = new URL(path, "http://test.local").searchParams.get("keyword");
      return Promise.resolve({
        employees: keyword
          ? employees.filter((employee) => employee.employeeName.includes(keyword))
          : employees
      });
    }

    return Promise.reject(new Error(`Unexpected path: ${path}`));
  });
};

describe("RealTimePeoplePage", () => {
  beforeEach(() => {
    setupPageTest();
    getStoredToken.mockReturnValue("test-token");
  });

  it("loads presence summary and employee list", async () => {
    installPresenceSuccessMock();

    render(<RealTimePeoplePage />);

    const aliceRow = (await screen.findByText("Alice Chen")).closest(".grid");
    const bobRow = screen.getByText("Bob Lin").closest(".grid");

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(within(aliceRow).getByText("Engineering")).toBeInTheDocument();
    expect(within(aliceRow).getByText("Developer")).toBeInTheDocument();
    expect(within(aliceRow).getByText("alice@example.com")).toBeInTheDocument();
    expect(within(bobRow).getByText("Operations")).toBeInTheDocument();
    expect(within(bobRow).getByText("Operator")).toBeInTheDocument();
    expect(within(bobRow).getByText("0912-000-000")).toBeInTheDocument();
  });

  it("reloads employees with a keyword when searching", async () => {
    installPresenceSuccessMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<RealTimePeoplePage />);

    await screen.findByText("Alice Chen");
    await user.type(screen.getByPlaceholderText("Search"), "Alice");

    await waitFor(() => {
      expect(fetchAccessApi).toHaveBeenCalledWith(
        "/api/manager/reports/presence/employees?keyword=Alice",
        "test-token"
      );
    });
    expect(await screen.findByText("Alice Chen")).toBeInTheDocument();
  });

  it("shows an empty state when no people are returned", async () => {
    fetchAccessApi.mockImplementation((path) => {
      if (path === "/api/manager/reports/presence/summary") {
        return Promise.resolve({ insideCount: 0, outsideCount: 7 });
      }
      return Promise.resolve({ employees: [] });
    });

    render(<RealTimePeoplePage />);

    expect(await screen.findByText("目前沒有在辦公室的人員")).toBeInTheDocument();
  });

  it("polls presence data every 30 seconds", async () => {
    installPresenceSuccessMock();

    render(<RealTimePeoplePage />);

    await screen.findByText("Alice Chen");
    expect(fetchAccessApi).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(fetchAccessApi).toHaveBeenCalledTimes(4);
    });
  });

  it("shows the API error and clears the list on failure", async () => {
    fetchAccessApi.mockRejectedValue(new Error("presence failed"));

    render(<RealTimePeoplePage />);

    expect(await screen.findByText("presence failed")).toBeInTheDocument();
    expect(screen.getByText("目前沒有在辦公室的人員")).toBeInTheDocument();
  });
});
