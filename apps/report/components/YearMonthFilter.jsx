import { SelectChevron } from "./Icon.jsx";

const getYearOptions = (startYear, currentYear) => {
  return Array.from(
    { length: currentYear - startYear + 1 },
    (_, index) => currentYear - index
  );
};

const getMonthOptions = (year, currentYear, currentMonth) => {
  const maxMonth = year === currentYear ? currentMonth : 12;

  if (maxMonth < 1) return [];

  return Array.from({ length: maxMonth }, (_, index) => index + 1);
};

const SelectChevronContainer = () => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-slate-900"
  >
    <SelectChevron />
  </span>
);

export default function YearMonthFilter({
  startYear = 2020,
  selectedYear,
  selectedMonth,
  currentDate = new Date(),
  onChange
}) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const years = getYearOptions(startYear, currentYear).filter(
    (year) => getMonthOptions(year, currentYear, currentMonth).length > 0
  );
  const months = getMonthOptions(selectedYear, currentYear, currentMonth);

  const handleYearChange = (event) => {
    const nextYear = Number(event.target.value);
    const nextMonths = getMonthOptions(nextYear, currentYear, currentMonth);

    onChange({
      year: nextYear,
      month: nextMonths.includes(selectedMonth)
        ? selectedMonth
        : nextMonths[nextMonths.length - 1]
    });
  };

  const handleMonthChange = (event) => {
    onChange({
      year: selectedYear,
      month: Number(event.target.value)
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="inline-flex items-center">
        <span className="relative inline-flex items-center">
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="h-11 appearance-none rounded-2xl border-0 bg-slate-100 py-0 pl-6 pr-14 text-sm font-medium leading-none text-slate-900 outline-none transition hover:bg-slate-200 focus:ring-2 focus:ring-slate-300"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <SelectChevronContainer />
        </span>
        <span className="ml-2 text-sm font-medium text-slate-500">年</span>
      </label>

      <label className="inline-flex items-center">
        <span className="relative inline-flex items-center">
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className="h-11 appearance-none rounded-2xl border-0 bg-slate-100 py-0 pl-4 pr-14 text-sm font-medium leading-none text-slate-900 outline-none transition hover:bg-slate-200 focus:ring-2 focus:ring-slate-300"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
          <SelectChevronContainer />
        </span>
        <span className="ml-2 text-sm font-medium text-slate-500">月</span>
      </label>
    </div>
  );
}
