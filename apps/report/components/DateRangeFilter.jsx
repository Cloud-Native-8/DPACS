export default function DateRangeFilter({ dateRange, maxEndDate, onChange }) {
  return (
    <label className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-200 focus-within:ring-2 focus-within:ring-slate-300">
      <input
        type="date"
        value={dateRange.start}
        max={dateRange.end}
        onChange={(event) => onChange("start", event.target.value)}
        className="border-0 bg-transparent p-0 text-sm font-medium outline-none"
      />
      <span className="text-slate-400">-</span>
      <input
        type="date"
        value={dateRange.end}
        min={dateRange.start}
        max={maxEndDate}
        onChange={(event) => onChange("end", event.target.value)}
        className="border-0 bg-transparent p-0 text-sm font-medium outline-none"
      />
    </label>
  );
}
