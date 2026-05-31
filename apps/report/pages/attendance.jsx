import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import DateRangeFilter from "../components/DateRangeFilter.jsx";
import Sidebar from "../components/Sidebar.jsx";
import {
  fetchAccessApi,
  getStoredToken,
} from "../src/lib/access-api-client.js";
import { formatTime } from "../src/lib/date-format.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const getDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

const getDefaultDateRange = (today = new Date()) => ({
  start: getDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)),
  end: getDateInputValue(today),
});

const toShortDate = (dateKey) => {
  const [, month, day] = dateKey.split("-");
  return `${month}/${day}`;
};

const toDisplayTime = (value) => {
  if (!value) return "";
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  return formatTime(value);
};

const formatHours = (value) => {
  if (value === undefined || value === null) return "-";
  return String(value);
};

const formatRemainingHours = (minutes) => {
  if (minutes === undefined || minutes === null) return "-";
  return String(Math.round((minutes / 60) * 10) / 10);
};

const formatAnomalyReason = (reason) => {
  if (!reason) return "";

  const text = String(reason);
  const normalized = text.toLowerCase().replaceAll("_", " ");

  if (normalized.includes("employee is not marked inside any site")) {
    return "沒有進入任何場域的紀錄";
  }

  const duplicateEntryMatch = /employee must exit site (\d+) before any new entry/.exec(
    normalized,
  );
  if (duplicateEntryMatch) {
    return `需先離開場域 ${duplicateEntryMatch[1]} 才能再次進入`;
  }

  const sameSiteExitMatch = /employee must exit the same site they entered \((\d+)\)/.exec(
    normalized,
  );
  if (sameSiteExitMatch) {
    return `需從原本進入的同一場域 ${sameSiteExitMatch[1]} 離開`;
  }

  return text;
};

const getLogDate = (log) => {
  const time = log.eventTime;
  if (!time) return null;
  if (typeof time === "string" && /^\d{4}-\d{2}-\d{2}/.test(time)) {
    return time.slice(0, 10);
  }
  return getDateInputValue(new Date(time));
};

const groupLogsByDate = (logs) => {
  const grouped = new Map();

  logs.forEach((log) => {
    const date = getLogDate(log);
    if (!date) return;

    grouped.set(date, [...(grouped.get(date) ?? []), log]);
  });

  return grouped;
};

const toDeniedRow = (log, date) => {
  const direction = String(log.direction).toUpperCase();
  const time = toDisplayTime(log.eventTime);

  return {
    key: `deny-${log.logId ?? log.eventTime}`,
    date,
    inTimes: direction === "IN" && time ? [time] : [],
    outTimes: direction === "OUT" && time ? [time] : [],
    anomaly: formatAnomalyReason(log.reason),
    isAnomaly: true,
  };
};

const buildAcceptedRows = (logs, date) => {
  const rows = [];
  let openRow = null;

  logs.forEach((log) => {
    const direction = String(log.direction).toUpperCase();
    const time = toDisplayTime(log.eventTime);

    if (!time) return;

    if (direction === "IN") {
      openRow = {
        key: `accept-${log.logId ?? log.eventTime}`,
        date,
        inTimes: [time],
        outTimes: [],
        anomaly: "",
        isAnomaly: false,
      };
      rows.push(openRow);
      return;
    }

    if (direction === "OUT" && openRow?.outTimes.length === 0) {
      openRow.outTimes = [time];
      openRow = null;
      return;
    }

    if (direction === "OUT") {
      rows.push({
        key: `accept-${log.logId ?? log.eventTime}`,
        date,
        inTimes: [],
        outTimes: [time],
        anomaly: "",
        isAnomaly: false,
      });
    }
  });

  return rows;
};

const toAttendanceRows = (summary, dateRange) => {
  const logsByDate = groupLogsByDate(summary?.accessLogs ?? []);
  const rows = [];
  const start = new Date(`${dateRange.start}T00:00:00`);
  const end = new Date(`${dateRange.end}T00:00:00`);

  for (let time = end.getTime(); time >= start.getTime(); time -= DAY_MS) {
    const date = getDateInputValue(new Date(time));
    const dateRows = [];
    const logs = [...(logsByDate.get(date) ?? [])].sort(
      (a, b) => new Date(a.eventTime) - new Date(b.eventTime),
    );
    const acceptedLogs = logs.filter(
      (log) => String(log.result).toUpperCase() === "ACCEPT",
    );
    const deniedLogs = logs.filter(
      (log) => String(log.result).toUpperCase() === "DENY",
    );
    const acceptedRows = buildAcceptedRows(acceptedLogs, date);

    if (acceptedRows.length > 0) {
      dateRows.push(...acceptedRows);
    } else if (logs.length === 0) {
      dateRows.push({
        key: `date-${date}`,
        date,
        inTimes: [],
        outTimes: [],
        anomaly: "",
        isAnomaly: false,
      });
    }

    dateRows.push(...deniedLogs.map((log) => toDeniedRow(log, date)));

    rows.push(
      ...dateRows.map((row, index) => ({
        ...row,
        isFirstDateRow: index === 0,
        dateRowSpan: dateRows.length,
        hasDateGap: rows.length > 0 && index === 0,
      })),
    );
  }

  return rows;
};

const getCellClassName = (row, extraClassName = "") =>
  [
    "px-4 align-top",
    row.isFirstDateRow ? "py-4" : "pt-1 pb-4",
    row.hasDateGap ? "border-t-[12px] border-white" : "",
    extraClassName,
  ]
    .filter(Boolean)
    .join(" ");

const KpiCard = ({ label, value, tone = "blue" }) => {
  const toneClass = tone === "violet" ? "bg-violet-50" : "bg-sky-50";

  return (
    <article className={`min-h-28 rounded-2xl ${toneClass} px-6 py-5`}>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-4 text-3xl font-semibold leading-none text-slate-950">
        {value}
      </p>
    </article>
  );
};

KpiCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  tone: PropTypes.string,
};

export default function AttendanceQueryPage() {
  const today = useMemo(() => new Date(), []);
  const defaultRange = useMemo(() => getDefaultDateRange(today), [today]);
  const [dateRange, setDateRange] = useState(defaultRange);
  const [summary, setSummary] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [error, setError] = useState("");
  const displaySummary = summary;

  useEffect(() => {
    let isMounted = true;
    const token = getStoredToken();

    const params = new URLSearchParams({
      startDate: dateRange.start,
      endDate: dateRange.end,
    });

    setError("");

    Promise.all([
      fetchAccessApi("/api/me/attendance/today-status", token),
      fetchAccessApi(`/api/me/attendance/summary?${params}`, token),
    ])
      .then(([todayData, summaryData]) => {
        if (!isMounted) return;
        setTodayStatus(todayData);
        setSummary(summaryData);
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError.message);
        setTodayStatus(null);
        setSummary(null);
      });

    return () => {
      isMounted = false;
    };
  }, [dateRange]);

  const rows = useMemo(
    () => toAttendanceRows(displaySummary, dateRange),
    [displaySummary, dateRange],
  );
  const hasNoRemainingTime = todayStatus?.remainingMinutes === 0;

  const setRangePreset = (preset) => {
    if (preset === "week") {
      setDateRange({
        start: getDateInputValue(addDays(today, -6)),
        end: getDateInputValue(today),
      });
      return;
    }

    setDateRange(getDefaultDateRange(today));
  };

  const handleDateChange = (field, value) => {
    setDateRange((current) => {
      if (field === "start") {
        const end = value > current.end ? value : current.end;
        return { start: value, end };
      }

      const start = value < current.start ? value : current.start;
      return {
        start,
        end: value,
      };
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar activePage="出勤查詢" />

        <section className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
            <div className="flex flex-wrap items-center gap-3">
              <DateRangeFilter
                dateRange={dateRange}
                maxEndDate={getDateInputValue(today)}
                onChange={handleDateChange}
              />
              <button
                type="button"
                onClick={() => setRangePreset("week")}
                className="h-11 rounded-2xl bg-slate-100 px-5 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
              >
                本週
              </button>
              <button
                type="button"
                onClick={() => setRangePreset("month")}
                className="h-11 rounded-2xl bg-slate-100 px-5 text-sm font-medium text-slate-900 transition hover:bg-slate-200 mr-5"
              >
                本月
              </button>
            </div>

            {error && (
              <p className="mt-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <p className="mb-4 text-sm font-semibold text-slate-950">
                  累積狀態
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <KpiCard
                    label="總時數"
                    value={formatHours(displaySummary?.totalWorkingHours)}
                  />
                  <KpiCard
                    label="累積加班時數"
                    value={formatHours(displaySummary?.totalOvertimeHours)}
                  />
                </div>
              </div>

              <div>
                <p className="mb-4 text-sm font-semibold text-slate-950">
                  當日出勤狀態
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <KpiCard
                    label="預估下班時間"
                    value={
                      hasNoRemainingTime
                        ? "-"
                        : toDisplayTime(todayStatus?.estimatedOffWorkTime) ||
                          "-"
                    }
                    tone="violet"
                  />
                  <KpiCard
                    label="剩餘時數"
                    value={
                      hasNoRemainingTime
                        ? "-"
                        : formatRemainingHours(todayStatus?.remainingMinutes)
                    }
                    tone="violet"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-lg shadow-slate-900/5">
            <div className="px-6 py-6">
              <p className="text-sm font-semibold text-slate-950">出勤紀錄</p>
            </div>

            <div className="overflow-x-auto px-6 pb-8">
              <table className="w-full min-w-[760px] table-fixed border-separate border-spacing-y-0">
                <colgroup>
                  <col className="w-[16%]" />
                  <col className="w-[22%]" />
                  <col className="w-[22%]" />
                  <col className="w-[40%]" />
                </colgroup>
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-500">
                    <th className="px-4 py-2">日期</th>
                    <th className="px-4 py-2">進入時間</th>
                    <th className="px-4 py-2">離開時間</th>
                    <th className="px-4 py-2">異常狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.key}
                      className="bg-slate-50/80 text-sm text-slate-950"
                    >
                      {row.isFirstDateRow && (
                        <td
                          rowSpan={row.dateRowSpan}
                          className={getCellClassName(
                            row,
                            "rounded-l-2xl font-medium",
                          )}
                        >
                          {toShortDate(row.date)}
                        </td>
                      )}
                      <td className={getCellClassName(row)}>
                        {row.inTimes.length ? (
                          <div className="space-y-1">
                            {row.inTimes.map((time, index) => (
                              <p
                                key={`${row.key}-in-${index}`}
                                className={row.isAnomaly ? "text-red-400" : ""}
                              >
                                {time}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className={getCellClassName(row)}>
                        {row.outTimes.length ? (
                          <div className="space-y-1">
                            {row.outTimes.map((time, index) => (
                              <p
                                key={`${row.key}-out-${index}`}
                                className={row.isAnomaly ? "text-red-400" : ""}
                              >
                                {time}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className={getCellClassName(row, "rounded-r-2xl")}>
                        {row.anomaly ? (
                          <span className="break-words text-red-400">
                            {row.anomaly}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
