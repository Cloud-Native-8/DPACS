import { vi } from "vitest";

export const fixedNow = new Date("2026-05-23T12:00:00+08:00");

export const setupPageTest = () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(fixedNow);
  localStorage.setItem("token", "test-token");
  localStorage.setItem(
    "employee",
    JSON.stringify({ employeeName: "Test Manager", jobTitle: "Manager" })
  );
};

export const flushPromises = async () => {
  await Promise.resolve();
};
