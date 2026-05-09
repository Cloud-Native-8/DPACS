import { accessDirectionLabels, anomalyStatusOptions } from "../src/lib/access-labels.js";
import { formatDateTime, formatTime } from "../src/lib/date-format.js";
import ModalShell from "./ModalShell.jsx";

export default function AnomalyDetailModal({
  data,
  getAnomalyType,
  onClose,
  onStatusChange,
  selectedStatus
}) {
  if (!data) return null;

  const { deniedAccessLog, dailyAccessSequence } = data;

  return (
    <ModalShell onClose={onClose}>
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            異常紀錄
          </p>
          <h2 className="mt-3 truncate text-2xl font-semibold text-slate-950">
            {deniedAccessLog.employeeName}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {formatDateTime(deniedAccessLog.eventTime)}・{getAnomalyType(deniedAccessLog)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1">
            {anomalyStatusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onStatusChange(option.value)}
                className={`h-9 rounded-xl px-4 text-sm font-medium transition ${
                  selectedStatus === option.value
                    ? "bg-white text-slate-950 shadow-sm shadow-slate-900/10"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-2xl bg-slate-100 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
          >
            關閉
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-950">當天進出紀錄</h3>

        <div className="mt-3 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-50">
          <div className="grid grid-cols-4 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 sm:grid-cols-[0.8fr_0.8fr_1.5fr_1fr]">
            <span>時間</span>
            <span>方向</span>
            <span>地點</span>
            <span>備註</span>
          </div>

          <div className="divide-y divide-slate-200">
            {dailyAccessSequence.length > 0 ? (
              dailyAccessSequence.map((record) => {
                const isCurrentRecord = record.logId === deniedAccessLog.logId;

                return (
                  <div
                    key={record.logId}
                    className={`grid grid-cols-4 items-center gap-4 px-6 py-4 text-sm sm:grid-cols-[0.8fr_0.8fr_1.5fr_1fr] ${
                      isCurrentRecord ? "bg-blue-50/80 text-slate-950" : "text-slate-700"
                    }`}
                  >
                    <time dateTime={record.eventTime}>{formatTime(record.eventTime)}</time>
                    <span>{accessDirectionLabels[record.direction] ?? record.direction}</span>
                    <span className="truncate text-slate-500">
                      {record.siteName} / {record.accessPointName}
                    </span>
                    <span className="truncate text-slate-500">{record.note || "-"}</span>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                當天沒有進出紀錄
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
