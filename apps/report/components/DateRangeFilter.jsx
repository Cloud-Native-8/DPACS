export default function DateRangeFilter({ dateRange, maxEndDate, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative inline-flex items-center">
        <span className="mr-2 text-sm font-medium text-slate-500">開始</span>
        <input
          type="date"
          value={dateRange.start}
          max={dateRange.end}
          onChange={(event) => onChange("start", event.target.value)}
          className="h-11 rounded-2xl border-0 bg-slate-100 px-4 text-sm font-medium text-slate-900 outline-none transition hover:bg-slate-200 focus:ring-2 focus:ring-slate-300"
        />
      </label>

      <label className="relative inline-flex items-center">
        <span className="mr-2 text-sm font-medium text-slate-500">結束</span>
        <input
          type="date"
          value={dateRange.end}
          min={dateRange.start}
          max={maxEndDate}
          onChange={(event) => onChange("end", event.target.value)}
          className="h-11 rounded-2xl border-0 bg-slate-100 px-4 text-sm font-medium text-slate-900 outline-none transition hover:bg-slate-200 focus:ring-2 focus:ring-slate-300"
        />
      </label>
    </div>
  );
}
