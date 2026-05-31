import PropTypes from "prop-types";
import { accessDirectionLabels } from "../src/lib/access-labels.js";
import { formatTime } from "../src/lib/date-format.js";
import { employeeAccessRecordShape } from "../src/lib/prop-types.js";
import ModalShell from "./ModalShell.jsx";

export default function EmployeeAccessRecordsModal({ record, onClose }) {
  if (!record) return null;

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Access Records
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {record.date} 進出紀錄
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            工時 {record.workingHours} 小時，加班 {record.overtimeHours} 小時
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
        >
          關閉
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">進出紀錄</h3>

          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
            {(record.accessEvents ?? []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">時間</th>
                      <th className="px-4 py-3 font-medium">方向</th>
                      <th className="px-4 py-3 font-medium">地點</th>
                      <th className="px-4 py-3 font-medium">結果</th>
                      <th className="px-4 py-3 font-medium">備註</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {record.accessEvents.map((event) => (
                      <tr key={event.logId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-950">
                          {formatTime(event.eventTime)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {accessDirectionLabels[event.direction] ?? event.direction}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {event.siteName} / {event.accessPointName}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{event.result}</td>
                        <td className="px-4 py-3 text-slate-500">{event.note || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-4 text-sm text-slate-500">當日沒有進出紀錄</p>
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

EmployeeAccessRecordsModal.propTypes = {
  record: employeeAccessRecordShape,
  onClose: PropTypes.func.isRequired,
};
