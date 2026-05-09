import { useMemo, useState } from "react";
import AnomalyDetailModal from "../components/AnomalyDetailModal.jsx";
import DateRangeFilter from "../components/DateRangeFilter.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { anomalyStatusLabels, anomalyTypeLabels } from "../src/lib/access-labels.js";
import { createAvatarStyle, getInitials } from "../src/lib/avatar.js";
import { formatDateTime } from "../src/lib/date-format.js";

const anomalyLogsResponse = {
  logs: [
    {
      logId: 90001,
      employeeId: 1001,
      employeeName: "ByeWind",
      siteId: 1,
      siteName: "Taipei Office",
      accessPointId: 501,
      accessPointName: "Main Entrance",
      direction: "IN",
      result: "ACCEPT",
      reason: "ACCESS_GRANTED",
      eventTime: "2026-02-23T10:01:00+08:00",
      note: "Consecutive IN detected.",
      createdAt: "2026-02-23T10:01:01+08:00"
    },
    {
      logId: 90002,
      employeeId: 1002,
      employeeName: "Natali Craig",
      siteId: 1,
      siteName: "Taipei Office",
      accessPointId: 501,
      accessPointName: "Main Entrance",
      direction: "IN",
      result: "ACCEPT",
      reason: "ACCESS_GRANTED",
      eventTime: "2026-02-23T10:01:00+08:00",
      note: "Consecutive IN detected.",
      createdAt: "2026-02-23T10:01:01+08:00"
    },
    {
      logId: 90003,
      employeeId: 1003,
      employeeName: "Drew Cano",
      siteId: 1,
      siteName: "Taipei Office",
      accessPointId: 502,
      accessPointName: "Office Exit",
      direction: "IN",
      result: "ACCEPT",
      reason: "ACCESS_GRANTED",
      eventTime: "2026-02-23T10:01:00+08:00",
      note: "Consecutive IN detected.",
      createdAt: "2026-02-23T10:01:01+08:00"
    },
    {
      logId: 90004,
      employeeId: 1004,
      employeeName: "Orlando Diggs",
      siteId: 1,
      siteName: "Taipei Office",
      accessPointId: 502,
      accessPointName: "Office Exit",
      direction: "OUT",
      result: "ACCEPT",
      reason: "ACCESS_GRANTED",
      eventTime: "2026-02-23T10:01:00+08:00",
      note: "Consecutive OUT detected.",
      createdAt: "2026-02-23T10:01:01+08:00"
    },
    {
      logId: 90005,
      employeeId: 1005,
      employeeName: "Andi Lane",
      siteId: 1,
      siteName: "Taipei Office",
      accessPointId: 502,
      accessPointName: "Office Exit",
      direction: "OUT",
      result: "ACCEPT",
      reason: "ACCESS_GRANTED",
      eventTime: "2026-02-23T10:01:00+08:00",
      note: "Consecutive OUT detected.",
      createdAt: "2026-02-23T10:01:01+08:00"
    }
  ]
};

const statusByLogId = {
  90001: "resolved",
  90002: "resolved",
  90003: "pending",
  90004: "pending",
  90005: "pending"
};

const dailyAccessRecords = [
  {
    logId: 80001,
    employeeId: 1001,
    eventTime: "2026-02-23T08:58:00+08:00",
    direction: "IN",
    result: "ACCEPT",
    siteName: "Taipei Office",
    accessPointName: "Main Entrance",
    note: ""
  },
  {
    logId: 90001,
    employeeId: 1001,
    eventTime: "2026-02-23T10:01:00+08:00",
    direction: "IN",
    result: "ACCEPT",
    siteName: "Taipei Office",
    accessPointName: "Main Entrance",
    note: "Consecutive IN detected."
  },
  {
    logId: 80002,
    employeeId: 1001,
    eventTime: "2026-02-23T18:12:00+08:00",
    direction: "OUT",
    result: "ACCEPT",
    siteName: "Taipei Office",
    accessPointName: "Office Exit",
    note: ""
  },
  {
    logId: 80003,
    employeeId: 1002,
    eventTime: "2026-02-23T09:02:00+08:00",
    direction: "IN",
    result: "ACCEPT",
    siteName: "Taipei Office",
    accessPointName: "Main Entrance",
    note: ""
  },
  {
    logId: 90002,
    employeeId: 1002,
    eventTime: "2026-02-23T10:01:00+08:00",
    direction: "IN",
    result: "ACCEPT",
    siteName: "Taipei Office",
    accessPointName: "Main Entrance",
    note: "Consecutive IN detected."
  },
  {
    logId: 80004,
    employeeId: 1003,
    eventTime: "2026-02-23T09:14:00+08:00",
    direction: "IN",
    result: "ACCEPT",
    siteName: "Taipei Office",
    accessPointName: "Main Entrance",
    note: ""
  },
  {
    logId: 90003,
    employeeId: 1003,
    eventTime: "2026-02-23T10:01:00+08:00",
    direction: "IN",
    result: "ACCEPT",
    siteName: "Taipei Office",
    accessPointName: "Office Exit",
    note: "Consecutive IN detected."
  },
  {
    logId: 80005,
    employeeId: 1004,
    eventTime: "2026-02-23T08:51:00+08:00",
    direction: "IN",
    result: "ACCEPT",
    siteName: "Taipei Office",
    accessPointName: "Main Entrance",
    note: ""
  },
  {
    logId: 90004,
    employeeId: 1004,
    eventTime: "2026-02-23T10:01:00+08:00",
    direction: "OUT",
    result: "ACCEPT",
    siteName: "Taipei Office",
    accessPointName: "Office Exit",
    note: "Consecutive OUT detected."
  },
  {
    logId: 80006,
    employeeId: 1005,
    eventTime: "2026-02-23T08:47:00+08:00",
    direction: "IN",
    result: "ACCEPT",
    siteName: "Taipei Office",
    accessPointName: "Main Entrance",
    note: ""
  },
  {
    logId: 90005,
    employeeId: 1005,
    eventTime: "2026-02-23T10:01:00+08:00",
    direction: "OUT",
    result: "ACCEPT",
    siteName: "Taipei Office",
    accessPointName: "Office Exit",
    note: "Consecutive OUT detected."
  }
];

const getDateKey = (dateString) => dateString.slice(0, 10);

const getDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayKey = () => getDateInputValue(new Date());

const getDefaultDateRange = (today = new Date()) => {
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    start: getDateInputValue(monthStart),
    end: getDateInputValue(today)
  };
};

const isDateInRange = (date, startDate, endDate) => date >= startDate && date <= endDate;

const defaultDateRange = getDefaultDateRange();

const toDailyAccessLog = (record, deniedAccessLog) => ({
  logId: record.logId,
  employeeId: record.employeeId,
  employeeName: record.employeeName ?? deniedAccessLog.employeeName,
  siteId: record.siteId ?? deniedAccessLog.siteId,
  siteName: record.siteName,
  accessPointName: record.accessPointName,
  direction: record.direction,
  result: record.result,
  reason: record.reason ?? "ACCESS_GRANTED",
  eventTime: record.eventTime,
  note: record.note,
  createdAt: record.createdAt ?? record.eventTime
});

const toDeniedAccessLog = ({ avatarStyle, ...log }) => log;

const getAnomalyType = (log) => anomalyTypeLabels[log.direction] ?? "-";

export default function AnomaliesPage() {
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [logStatuses, setLogStatuses] = useState(statusByLogId);
  const selectedDateRangeLabel = `${dateRange.start} 至 ${dateRange.end}`;
  const todayKey = getTodayKey();

  const logs = useMemo(
    () =>
      anomalyLogsResponse.logs.map((log) => ({
        ...log,
        avatarStyle: createAvatarStyle(log.employeeName)
      })),
    []
  );
  const filteredLogs = logs.filter((log) =>
    isDateInRange(getDateKey(log.eventTime), dateRange.start, dateRange.end)
  );
  const selectedLog = logs.find((log) => log.logId === selectedLogId) ?? null;
  const selectedStatus = selectedLog ? logStatuses[selectedLog.logId] ?? "pending" : "pending";
  const selectedPopupData = selectedLog
    ? {
        deniedAccessLog: toDeniedAccessLog(selectedLog),
        dailyAccessSequence: dailyAccessRecords
          .filter(
            (record) =>
              record.employeeId === selectedLog.employeeId &&
              getDateKey(record.eventTime) === getDateKey(selectedLog.eventTime)
          )
          .map((record) => toDailyAccessLog(record, selectedLog))
      }
    : null;

  const updateSelectedStatus = (status) => {
    if (!selectedLog) return;

    setLogStatuses((currentStatuses) => ({
      ...currentStatuses,
      [selectedLog.logId]: status
    }));
  };

  const resetSelectedLog = () => setSelectedLogId(null);

  const updateDateRange = (key, value) => {
    if (!value) return;

    setDateRange((currentRange) => ({
      ...currentRange,
      [key]: value
    }));
    resetSelectedLog();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar activePage="異常出勤管理" />

        <section className="min-h-[calc(100vh-3rem)] rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <DateRangeFilter
              dateRange={dateRange}
              maxEndDate={todayKey}
              onChange={updateDateRange}
            />
          </div>

          <div className="mt-7 min-h-[740px] rounded-[1.5rem] bg-slate-50 p-4 sm:p-5">
            <h1 className="-mt-1 text-sm font-semibold text-slate-950">異常紀錄清單</h1>

            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-50">
              <div className="grid grid-cols-4 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 sm:grid-cols-[2fr_1.45fr_1fr_1fr]">
                <span>姓名</span>
                <span>日期時間</span>
                <span>類型</span>
                <span className="flex justify-end pr-8">狀態</span>
              </div>

              <div className="divide-y divide-slate-200">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const status = logStatuses[log.logId] ?? "pending";
                    const isResolved = status === "resolved";

                    return (
                      <button
                        type="button"
                        key={log.logId}
                        onClick={() => setSelectedLogId(log.logId)}
                        className="grid w-full grid-cols-4 items-center gap-4 px-6 py-4 text-left text-sm text-slate-700 transition hover:bg-white/70 focus:bg-white/70 focus:outline-none sm:grid-cols-[2fr_1.45fr_1fr_1fr]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold"
                            style={log.avatarStyle}
                            aria-hidden="true"
                          >
                            {getInitials(log.employeeName)}
                          </div>
                          <span className="truncate">{log.employeeName}</span>
                        </div>

                        <time className="truncate" dateTime={log.eventTime}>
                          {formatDateTime(log.eventTime)}
                        </time>

                        <span>{getAnomalyType(log)}</span>

                        <div className="flex justify-end">
                          <span
                            className={`inline-flex h-7 items-center rounded-full px-5 text-xs font-medium ${
                              isResolved
                                ? "bg-emerald-50 text-emerald-400"
                                : "bg-blue-50 text-blue-400"
                            }`}
                          >
                            {anomalyStatusLabels[status] ?? status}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-6 py-12 text-center text-sm text-slate-500">
                    {selectedDateRangeLabel}沒有異常紀錄
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <AnomalyDetailModal
        data={selectedPopupData}
        getAnomalyType={getAnomalyType}
        selectedStatus={selectedStatus}
        onClose={() => setSelectedLogId(null)}
        onStatusChange={updateSelectedStatus}
      />
    </main>
  );
}
