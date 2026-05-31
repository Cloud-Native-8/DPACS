import { useCallback, useEffect, useMemo, useState } from "react";
import AnomalyDetailModal from "../components/AnomalyDetailModal.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { anomalyStatusLabels, anomalyTypeLabels } from "../src/lib/access-labels.js";
import { fetchAccessApi, getApiUrl, getStoredToken } from "../src/lib/access-api-client.js";
import { createAvatarStyle, getInitials } from "../src/lib/avatar.js";
import { formatDateTime } from "../src/lib/date-format.js";

const formatMonthInput = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthRange = (yearMonth) => {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = `${yearMonth}-01`;
  const end = `${yearMonth}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;

  return { start, end };
};

const statusToLabelKey = (status) => (status ? "resolved" : "pending");

const getAnomalyType = (log) => anomalyTypeLabels[log.direction] ?? "-";

const mapAnomalyLog = (log) => ({
  ...log,
  avatarStyle: createAvatarStyle(log.employeeName ?? "")
});

async function patchAccessLogStatus(logId, status, token) {
  const response = await fetch(getApiUrl(`/api/manager/access-logs/${logId}/status`), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "狀態更新失敗");
  }

  return data;
}

export default function AnomaliesPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => formatMonthInput(new Date()));
  const [logs, setLogs] = useState([]);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [selectedPopupData, setSelectedPopupData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");

  const monthRange = useMemo(() => getMonthRange(selectedMonth), [selectedMonth]);
  const selectedLog = logs.find((log) => log.logId === selectedLogId) ?? null;

  const loadLogs = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      setError("請先登入後再查看異常紀錄。");
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams({
      startDate: monthRange.start,
      endDate: monthRange.end,
      sortBy: "eventTime",
      order: "DESC"
    });

    setIsLoading(true);
    setError("");
    setSelectedLogId(null);
    setSelectedPopupData(null);

    try {
      const data = await fetchAccessApi(`/api/manager/reports/denied-access-logs?${params}`, token);
      setLogs((data.logs ?? []).map(mapAnomalyLog));
    } catch (fetchError) {
      setError(fetchError.message);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [monthRange.end, monthRange.start]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const openStatusPopup = async (logId) => {
    const token = getStoredToken();

    if (!token) {
      setError("請先登入後再查看異常紀錄。");
      return;
    }

    setSelectedLogId(logId);
    setSelectedPopupData(null);
    setStatusError("");
    setIsDetailLoading(true);

    try {
      const data = await fetchAccessApi(`/api/manager/reports/denied-access-logs/${logId}`, token);
      setSelectedPopupData(data);
    } catch (fetchError) {
      setStatusError(fetchError.message);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const updateSelectedStatus = async (nextStatus) => {
    const token = getStoredToken();

    if (!token || !selectedLog) {
      setStatusError("請先登入後再更新狀態。");
      return;
    }

    setIsStatusUpdating(true);
    setStatusError("");

    try {
      const updatedLog = await patchAccessLogStatus(selectedLog.logId, nextStatus, token);

      setLogs((currentLogs) =>
        currentLogs.map((log) =>
          log.logId === updatedLog.logId ? mapAnomalyLog({ ...log, ...updatedLog }) : log
        )
      );
      setSelectedPopupData((currentData) => {
        if (!currentData) {
          return currentData;
        }

        return {
          ...currentData,
          deniedAccessLog: {
            ...currentData.deniedAccessLog,
            status: updatedLog.status
          }
        };
      });
    } catch (updateError) {
      setStatusError(updateError.message);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  let logsContent = (
    <div className="px-6 py-12 text-center text-sm text-slate-500">
      {monthRange.start} 至 {monthRange.end} 沒有異常紀錄
    </div>
  );

  if (isLoading) {
    logsContent = <div className="px-6 py-12 text-center text-sm text-slate-500">讀取中...</div>;
  } else if (logs.length > 0) {
    logsContent = logs.map((log) => {
      const statusKey = statusToLabelKey(log.status);
      const isResolved = log.status;

      return (
        <div
          key={log.logId}
          className="grid grid-cols-4 items-center gap-4 px-6 py-4 text-sm text-slate-700 transition hover:bg-white/70 sm:grid-cols-[1.3fr_1.3fr_1fr_0.8fr]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold"
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
            <button
              type="button"
              onClick={() => openStatusPopup(log.logId)}
              className={`inline-flex h-8 items-center rounded-full px-4 text-xs font-medium transition ${
                isResolved
                  ? "bg-emerald-50 text-emerald-400 hover:bg-emerald-100"
                  : "bg-blue-50 text-blue-400 hover:bg-blue-100"
              }`}
            >
              {anomalyStatusLabels[statusKey]}
            </button>
          </div>
        </div>
      );
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar activePage="異常出勤管理" />

        <section className="min-h-[calc(100vh-3rem)] rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8">
          <label className="inline-flex items-center rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            <span className="sr-only">選擇月份</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="border-0 bg-transparent text-sm font-medium text-slate-700 outline-none"
            />
          </label>

          <div className="mt-7 min-h-[740px] rounded-[1.5rem] bg-slate-50 p-4 sm:p-5">
            <h1 className="-mt-1 text-sm font-semibold text-slate-950">異常紀錄清單</h1>

            {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-50">
              <div className="grid grid-cols-4 gap-4 px-6 py-4 text-xs text-slate-500 sm:grid-cols-[1.3fr_1.3fr_1fr_0.8fr]">
                <span>姓名</span>
                <span>日期時間</span>
                <span>類型</span>
                <span className="flex justify-end pr-3">狀態</span>
              </div>

              <div className="divide-y divide-slate-100">
                {logsContent}
              </div>
            </div>
          </div>
        </section>
      </div>

      {(selectedPopupData || isDetailLoading || selectedLog) && (
        <AnomalyDetailModal
          data={
            selectedPopupData ?? {
              deniedAccessLog: selectedLog,
              dailyAccessSequence: []
            }
          }
          selectedStatus={Boolean(selectedPopupData?.deniedAccessLog?.status ?? selectedLog?.status)}
          isUpdating={isStatusUpdating || isDetailLoading}
          statusError={isDetailLoading ? "讀取明細中..." : statusError}
          onClose={() => {
            setSelectedLogId(null);
            setSelectedPopupData(null);
            setStatusError("");
          }}
          onStatusChange={updateSelectedStatus}
        />
      )}
    </main>
  );
}
