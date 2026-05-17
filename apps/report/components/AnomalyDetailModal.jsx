import { formatTime, getDateKeyFromTimestamp } from "../src/lib/date-format.js";
import ModalShell from "./ModalShell.jsx";

export default function AnomalyDetailModal({
  data,
  isUpdating,
  onClose,
  onStatusChange,
  selectedStatus,
  statusError
}) {
  if (!data) return null;

  const { deniedAccessLog, dailyAccessSequence } = data;
  const accessRows = buildAccessRows(dailyAccessSequence);
  const eventDate = getDateKeyFromTimestamp(deniedAccessLog.eventTime);

  return (
    <ModalShell maxWidth="max-w-xl" onClose={onClose}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-slate-950">日期</span>
            <span className="text-sm text-slate-600">{eventDate.slice(5).replace("-", "/")}</span>
          </div>

          <fieldset className="flex items-center gap-3">
            <legend className="sr-only">狀態</legend>
            <span className="text-base font-semibold text-slate-950">狀態</span>
            <label className="inline-flex items-center gap-1 text-sm text-slate-950">
              <input
                type="checkbox"
                checked={!selectedStatus}
                disabled={isUpdating}
                onChange={() => onStatusChange(false)}
                className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-200"
              />
              待處理
            </label>
            <label className="inline-flex items-center gap-1 text-sm text-slate-950">
              <input
                type="checkbox"
                checked={selectedStatus}
                disabled={isUpdating}
                onChange={() => onStatusChange(true)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-200"
              />
              已確認
            </label>
          </fieldset>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-2xl bg-slate-100 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
        >
          關閉
        </button>
      </div>

      <div className="mt-4">
        <h2 className="truncate text-xl font-semibold text-slate-950">{deniedAccessLog.employeeName}</h2>
        {statusError ? <p className="mt-2 text-sm text-red-500">{statusError}</p> : null}
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-950">當天進出紀錄</h3>

        <div className="mt-3 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-5">
          <div className="grid grid-cols-2 gap-4 px-4 py-3 text-xs text-slate-400">
            <span>進入時間</span>
            <span>離開時間</span>
          </div>

          <div className="space-y-2">
            {accessRows.length > 0 ? (
              accessRows.map((row) => (
                <div
                  key={row.key}
                  className={`grid grid-cols-2 gap-4 rounded-2xl px-4 py-3 text-sm text-slate-950 ${
                    row.hasDeniedLog ? "bg-blue-50" : "bg-white/70"
                  }`}
                >
                  <span>{row.inTime ?? "-"}</span>
                  <span>{row.outTime ?? "-"}</span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
                當天沒有進出紀錄
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function buildAccessRows(records) {
  const rows = [];
  let openRow = null;

  records.forEach((record) => {
    const isDeniedLog = String(record.result).toUpperCase() === "DENY";
    const direction = String(record.direction).toUpperCase();

    if (direction === "IN") {
      openRow = {
        key: String(record.logId),
        inTime: formatTime(record.eventTime),
        outTime: null,
        hasDeniedLog: isDeniedLog
      };
      rows.push(openRow);
      return;
    }

    if (openRow && !openRow.outTime) {
      openRow.outTime = formatTime(record.eventTime);
      openRow.hasDeniedLog = openRow.hasDeniedLog || isDeniedLog;
      openRow = null;
      return;
    }

    rows.push({
      key: String(record.logId),
      inTime: null,
      outTime: formatTime(record.eventTime),
      hasDeniedLog: isDeniedLog
    });
  });

  return rows;
}
