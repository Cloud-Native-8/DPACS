import { useEffect, useMemo, useState } from "react";
import DateRangeFilter from "../components/DateRangeFilter.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { fetchAccessApi, getStoredToken } from "../src/lib/access-api-client.js";
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
  end: getDateInputValue(today)
});

// Preview data for UI checks. Uncomment buildPreviewSummary usage below when needed.
// const toIsoAt = (dateKey, time) => `${dateKey}T${time}:00+08:00`;

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
  return Number.isInteger(value) ? String(value) : String(value);
};

const formatRemainingHours = (minutes) => {
  if (minutes === undefined || minutes === null) return "-";
  return String(Math.round((minutes / 60) * 10) / 10);
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

const pickEvents = (logs, direction) => {
  return logs
    .filter(
      (log) =>
        String(log.result).toUpperCase() === "ACCEPT" &&
        String(log.direction).toUpperCase() === direction
    )
    .map((log) => log.eventTime)
    .filter(Boolean);
};

const toDeniedRow = (log, date) => {
  const direction = String(log.direction).toUpperCase();
  const time = toDisplayTime(log.eventTime);

  return {
    key: `deny-${log.logId ?? log.eventTime}`,
    date,
    inTimes: direction === "IN" && time ? [time] : [],
    outTimes: direction === "OUT" && time ? [time] : [],
    anomaly: log.reason ?? "DENY",
    isAnomaly: true
  };
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
      (a, b) => new Date(a.eventTime) - new Date(b.eventTime)
    );
    const acceptedLogs = logs.filter((log) => String(log.result).toUpperCase() === "ACCEPT");
    const deniedLogs = logs.filter((log) => String(log.result).toUpperCase() === "DENY");
    const inTimes = pickEvents(acceptedLogs, "IN");
    const outTimes = pickEvents(acceptedLogs, "OUT");

    if (acceptedLogs.length > 0 || logs.length === 0) {
      dateRows.push({
        key: `date-${date}`,
        date,
        inTimes: inTimes.map(toDisplayTime).filter(Boolean),
        outTimes: outTimes.map(toDisplayTime).filter(Boolean),
        anomaly: "",
        isAnomaly: false
      });
    }

    dateRows.push(...deniedLogs.map((log) => toDeniedRow(log, date)));

    rows.push(
      ...dateRows.map((row, index) => ({
        ...row,
        isFirstDateRow: index === 0,
        dateRowSpan: dateRows.length,
        hasDateGap: rows.length > 0 && index === 0
      }))
    );
  }

  return rows;
};

const getCellClassName = (row, extraClassName = "") =>
  [
    "px-4 align-top",
    row.isFirstDateRow ? "py-4" : "pt-1 pb-4",
    row.hasDateGap ? "border-t-[12px] border-white" : "",
    extraClassName
  ]
    .filter(Boolean)
    .join(" ");

// const buildPreviewSummary = (dateRange) => {
//   const end = new Date(`${dateRange.end}T00:00:00`);
//   const firstDate = getDateInputValue(addDays(end, -2));
//   const secondDate = getDateInputValue(addDays(end, -1));
//   const thirdDate = dateRange.end;
//
//   return {
//     totalWorkingHours: 22.5,
//     totalOvertimeHours: 1.5,
//     accessLogs: [
//       {
//         logId: "preview-1",
//         direction: "IN",
//         result: "ACCEPT",
//         reason: "ACCESS_GRANTED",
//         eventTime: toIsoAt(firstDate, "09:00"),
//         note: ""
//       },
//       {
//         logId: "preview-2",
//         direction: "IN",
//         result: "DENY",
//         reason: "ACCESS_LEVEL_DENIED",
//         eventTime: toIsoAt(firstDate, "09:01"),
//         note: "Access level denied."
//       },
//       {
//         logId: "preview-3",
//         direction: "OUT",
//         result: "ACCEPT",
//         reason: "ACCESS_GRANTED",
//         eventTime: toIsoAt(firstDate, "18:00"),
//         note: ""
//       },
//       {
//         logId: "preview-4",
//         direction: "IN",
//         result: "ACCEPT",
//         reason: "ACCESS_GRANTED",
//         eventTime: toIsoAt(secondDate, "08:30"),
//         note: ""
//       },
//       {
//         logId: "preview-5",
//         direction: "OUT",
//         result: "ACCEPT",
//         reason: "ACCESS_GRANTED",
//         eventTime: toIsoAt(secondDate, "17:30"),
//         note: ""
//       },
//       {
//         logId: "preview-6",
//         direction: "IN",
//         result: "ACCEPT",
//         reason: "ACCESS_GRANTED",
//         eventTime: toIsoAt(thirdDate, "09:00"),
//         note: ""
//       },
//       {
//         logId: "preview-8",
//         direction: "OUT",
//         result: "ACCEPT",
//         reason: "ACCESS_GRANTED",
//         eventTime: toIsoAt(thirdDate, "18:10"),
//         note: ""
//       }
//     ]
//   };
// };

const KpiCard = ({ label, value, tone = "blue" }) => {
  const toneClass = tone === "violet" ? "bg-violet-50" : "bg-sky-50";

  return (
    <article className={`min-h-28 rounded-2xl ${toneClass} px-6 py-5`}>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-4 text-3xl font-semibold leading-none text-slate-950">{value}</p>
    </article>
  );
};

export default function AttendanceQueryPage() {
  const today = useMemo(() => new Date(), []);
  const defaultRange = useMemo(() => getDefaultDateRange(today), [today]);
  const [dateRange, setDateRange] = useState(defaultRange);
  const [summary, setSummary] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [error, setError] = useState("");
  const displaySummary = summary;
  // const previewSummary = useMemo(() => buildPreviewSummary(dateRange), [dateRange]);
  // const displaySummary = summary?.accessLogs?.length ? summary : previewSummary;

  useEffect(() => {
    let isMounted = true;
    const token = getStoredToken();

    const params = new URLSearchParams({
      startDate: dateRange.start,
      endDate: dateRange.end
    });

    setError("");

    Promise.all([
      fetchAccessApi("/api/me/attendance/today-status", token),
      fetchAccessApi(`/api/me/attendance/summary?${params}`, token)
    ])
      .then(([todayData, summaryData]) => {
        if (!isMounted) return;
        console.log("/api/me/attendance/today-status", todayData);
        console.log("/api/me/attendance/summary", summaryData);
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
    [displaySummary, dateRange]
  );

  const setRangePreset = (preset) => {
    if (preset === "week") {
      setDateRange({
        start: getDateInputValue(addDays(today, -6)),
        end: getDateInputValue(today)
      });
      return;
    }

    setDateRange(getDefaultDateRange(today));
  };

  const handleDateChange = (field, value) => {
    setDateRange((current) => {
      if (field === "start") {
        return { start: value, end: value > current.end ? value : current.end };
      }
      return { start: value < current.start ? value : current.start, end: value };
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
                className="h-11 rounded-2xl bg-slate-100 px-5 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
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
                  <p className="mb-4 text-sm font-semibold text-slate-950">累積狀態</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <KpiCard label="總時數" value={formatHours(displaySummary?.totalWorkingHours)} />
                    <KpiCard label="累積加班時數" value={formatHours(displaySummary?.totalOvertimeHours)} />
                  </div>
                </div>

                <div>
                  <p className="mb-4 text-sm font-semibold text-slate-950">當日出勤狀態</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <KpiCard
                      label="預估下班時間"
                      value={toDisplayTime(todayStatus?.estimatedOffWorkTime) || "-"}
                      tone="violet"
                    />
                    <KpiCard
                      label="剩餘時數"
                      value={formatRemainingHours(todayStatus?.remainingMinutes)}
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
                <table className="min-w-full border-separate border-spacing-y-0">
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
                      <tr key={row.key} className="bg-slate-50/80 text-sm text-slate-950">
                        {row.isFirstDateRow && (
                          <td
                            rowSpan={row.dateRowSpan}
                            className={getCellClassName(row, "rounded-l-2xl font-medium")}
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
                            <span className="text-red-400">{row.anomaly}</span>
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
