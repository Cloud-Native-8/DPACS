import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { SelectChevron } from "../components/Icon.jsx";
import YearMonthFilter from "../components/YearMonthFilter.jsx";
import { fetchAccessApi, getStoredToken } from "../src/lib/access-api-client.js";
import {
  departmentShape,
  stayHourDistributionShape,
} from "../src/lib/prop-types.js";

const formatYearMonth = ({ year, month }) => {
  return `${year}-${String(month).padStart(2, "0")}`;
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const getHeatmapColorClass = (hours) => {
  if (!hours) return "bg-slate-50 text-slate-400";
  if (hours < 6) return "bg-blue-100 text-slate-700";
  if (hours < 8) return "bg-blue-200 text-slate-800";
  if (hours < 10) return "bg-blue-300 text-slate-900";
  if (hours < 12) return "bg-blue-400 text-white";
  return "bg-blue-700 text-white";
};

const buildCalendarCells = (dailyAverages = []) => {
  if (!dailyAverages.length) return [];

  const firstDate = parseDateKey(dailyAverages[0].date);
  const leadingEmptyCells = firstDate.getUTCDay();
  const emptyCells = Array.from({ length: leadingEmptyCells }, (_, index) => ({
    key: `empty-${index}`,
    isEmpty: true
  }));

  return [
    ...emptyCells,
    ...dailyAverages.map((record) => ({
      key: record.date,
      day: parseDateKey(record.date).getUTCDate(),
      averageStayHours: record.averageStayHours,
      activeEmployeeCount: record.activeEmployeeCount,
      employeeCount: record.employeeCount
    }))
  ];
};

const formatHourDiff = (value) => {
  if (value === 0) return "持平";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${Math.abs(value)} 小時`;
};

const formatMinuteDiff = (value) => {
  if (value === 0) return "持平";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${Math.abs(value)} 分鐘`;
};

const DepartmentSelect = ({ departments, value, onChange }) => {
  const selectableDepartments = departments.filter(
    (department) => department.departmentName !== "Company"
  );
  const hasDepartments = selectableDepartments.length > 0;

  return (
    <label className="relative inline-flex items-center">
      <select
        value={value}
        disabled={!hasDepartments}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-44 appearance-none rounded-2xl border-0 bg-slate-100 py-0 pl-5 pr-14 text-sm font-medium leading-none text-slate-900 outline-none transition hover:bg-slate-200 focus:ring-2 focus:ring-slate-300 disabled:text-slate-400"
      >
        <option value="company">All</option>
        {hasDepartments ? (
          selectableDepartments.map((department) => (
            <option key={department.departmentId} value={department.departmentId}>
              {department.departmentName}
            </option>
          ))
        ) : (
          <option value="">部門</option>
        )}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-slate-900"
      >
        <SelectChevron />
      </span>
    </label>
  );
};

DepartmentSelect.propTypes = {
  departments: PropTypes.arrayOf(departmentShape).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const KpiCard = ({ label, value, unit, diff }) => (
  <div className="rounded-[1.75rem] bg-blue-50 p-6 shadow-sm shadow-slate-900/5">
    <p className="text-sm font-medium text-slate-600">{label}</p>
    <div className="mt-5 flex items-baseline gap-2">
      <div className="flex min-w-0 items-baseline gap-2">
        <p className="text-3xl font-semibold leading-none text-slate-950">
          {value ?? "-"}
        </p>
        {unit && <p className="text-sm font-medium text-slate-600">{unit}</p>}
      </div>
      <p className="ml-auto whitespace-nowrap text-sm text-slate-500">
        相比上月 {diff}
      </p>
    </div>
  </div>
);

KpiCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  unit: PropTypes.string,
  diff: PropTypes.string.isRequired,
};

const MonthlyHeatmap = ({ distribution }) => {
  const cells = buildCalendarCells(distribution?.dailyAverages);
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const employeeCount = distribution?.employeeCount ?? 0;

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">月度日曆熱圖</p>
          <p className="mt-1 text-sm text-slate-500">
            色彩越深代表平均每日在場時數越高 · 團隊人數：{employeeCount} 人
          </p>
        </div>
        <div className="flex items-center gap-0.5 text-xs text-slate-500">
          <span className="mr-2">少</span>
          <span className="h-4 w-5 rounded-sm bg-blue-100" />
          <span className="h-4 w-5 rounded-sm bg-blue-200" />
          <span className="h-4 w-5 rounded-sm bg-blue-300" />
          <span className="h-4 w-5 rounded-sm bg-blue-500" />
          <span className="h-4 w-5 rounded-sm bg-blue-700" />
          <span className="ml-2">多</span>
        </div>
      </div>

      {cells.length ? (
        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-400">
              {weekdays.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {cells.map((cell) =>
                cell.isEmpty ? (
                  <div key={cell.key} className="aspect-[1.4] rounded-xl" />
                ) : (
                  <div
                    key={cell.key}
                    className={`aspect-[1.4] rounded-xl p-3 ${getHeatmapColorClass(
                      cell.averageStayHours
                    )}`}
                  >
                    <div className="flex h-full flex-col justify-between">
                      <p className="text-sm font-semibold leading-none">{cell.day}</p>
                      <div className="flex justify-between">
                        <p className="text-sm font-semibold leading-none">
                          {cell.averageStayHours}h
                        </p>
                        <p className="whitespace-nowrap text-xs opacity-75">
                          {cell.activeEmployeeCount ?? 0} 人
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          目前沒有可顯示的熱力圖資料
        </p>
      )}
    </div>
  );
};

MonthlyHeatmap.propTypes = {
  distribution: stayHourDistributionShape,
};

export default function TrendsPage() {
  const currentDate = useMemo(() => new Date(), []);
  const initialPeriod = useMemo(
    () => ({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1
    }),
    [currentDate]
  );

  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("company");
  const [statistics, setStatistics] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getStoredToken();

    fetchAccessApi("/api/departments", token)
      .then((data) => {
        const nextDepartments = data.departments ?? [];
        setDepartments(nextDepartments);
        setSelectedDepartmentId((current) => current || "company");
      })
      .catch((fetchError) => {
        setError(fetchError.message);
      });

    return undefined;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const token = getStoredToken();

    if (!token || !selectedDepartmentId) return undefined;

    setIsLoading(true);
    setError("");

    const params = new URLSearchParams({
      yearMonth: formatYearMonth(selectedPeriod),
      departmentId: selectedDepartmentId
    });

    if (selectedDepartmentId !== "company") {
      params.set("department_id", selectedDepartmentId);
    }

    Promise.all([
      fetchAccessApi(`/api/manager/reports/team/monthly-statistics?${params}`, token),
      fetchAccessApi(`/api/manager/reports/team/stay-hour-distribution?${params}`, token)
    ])
      .then(([statisticsData, distributionData]) => {
        if (!isMounted) return;
        setStatistics(statisticsData);
        setDistribution(distributionData);
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError.message);
        setStatistics(null);
        setDistribution(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPeriod, selectedDepartmentId]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar activePage="團隊趨勢分析" />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
            <div className="flex flex-wrap items-center gap-4">
              <YearMonthFilter
                selectedYear={selectedPeriod.year}
                selectedMonth={selectedPeriod.month}
                currentDate={currentDate}
                onChange={setSelectedPeriod}
              />

              <DepartmentSelect
                departments={departments}
                value={selectedDepartmentId}
                onChange={setSelectedDepartmentId}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">Overview</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  時數相關指標
                </p>
              </div>
              {isLoading && (
                <p className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-500">
                  載入中
                </p>
              )}
            </div>

            {error ? (
              <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </p>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <KpiCard
                  label="平均每日在場時數"
                  value={statistics?.averageDailyStayHours}
                  unit="小時"
                  diff={formatHourDiff(
                    statistics?.averageDailyStayHoursDiffFromPreviousMonth ?? 0
                  )}
                />
                <KpiCard
                  label="平均進場時間點"
                  value={statistics?.averageCheckInTime}
                  diff={formatMinuteDiff(statistics?.averageCheckInTimeDiffMinutes ?? 0)}
                />
                <KpiCard
                  label="平均離場時間點"
                  value={statistics?.averageCheckOutTime}
                  diff={formatMinuteDiff(statistics?.averageCheckOutTimeDiffMinutes ?? 0)}
                />
              </div>
            )}
          </div>

          {!error && <MonthlyHeatmap distribution={distribution} />}
        </section>
      </div>
    </main>
  );
}
