import { useCallback, useEffect, useMemo, useState } from "react";
import EmployeeAccessRecordsModal from "../components/EmployeeAccessRecordsModal.jsx";
import Sidebar from "../components/Sidebar.jsx";
import YearMonthFilter from "../components/YearMonthFilter.jsx";
import { fetchAccessApi, getStoredToken } from "../src/lib/access-api-client.js";

const formatYearMonth = ({ year, month }) => `${year}-${String(month).padStart(2, "0")}`;

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const getDayOfMonth = (date) => Number(date.slice(-2));

const formatUpdatedAt = (date) => {
  if (!date) return "-";

  return date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const mapEmployee = (employee) => ({
  id: employee.employeeId,
  name: employee.employeeName,
  department: employee.department?.departmentName ?? "-",
  contact: employee.phone ?? employee.email ?? "-",
  jobTitle: employee.jobTitle ?? "-"
});

export default function EmployeeViewPage() {
  const currentDate = useMemo(() => new Date(), []);
  const initialPeriod = useMemo(
    () => ({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1
    }),
    [currentDate]
  );

  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [error, setError] = useState("");

  const chartDays = getDaysInMonth(selectedPeriod.year, selectedPeriod.month);
  const dailyRecords = monthlyReport?.dailyRecords ?? [];

  const loadEmployees = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      setError("請先登入後再查看員工資料。");
      setIsEmployeeLoading(false);
      return;
    }

    const params = new URLSearchParams();
    const keyword = search.trim();

    if (keyword) {
      params.set("keyword", keyword);
    }

    setIsEmployeeLoading(true);
    setError("");

    try {
      const employeeQuery = params.size ? `?${params}` : "";
      const data = await fetchAccessApi(`/api/employees${employeeQuery}`, token);
      const nextEmployees = (data.employees ?? []).map(mapEmployee);

      setEmployees(nextEmployees);
      setSelectedEmployee((current) => {
        if (current && nextEmployees.some((employee) => employee.id === current.id)) {
          return current;
        }

        return nextEmployees[0] ?? null;
      });
    } catch (fetchError) {
      setError(fetchError.message);
      setEmployees([]);
      setSelectedEmployee(null);
    } finally {
      setIsEmployeeLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    const token = getStoredToken();

    if (!token || !selectedEmployee) {
      setMonthlyReport(null);
      return undefined;
    }

    let isMounted = true;
    const yearMonth = formatYearMonth(selectedPeriod);

    setIsReportLoading(true);
    setError("");
    setSelectedRecord(null);

    fetchAccessApi(
      `/api/manager/reports/employees/${selectedEmployee.id}/monthly-attendance?yearMonth=${yearMonth}`,
      token
    )
      .then((data) => {
        if (!isMounted) return;
        setMonthlyReport(data);
        setUpdatedAt(new Date());
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError.message);
        setMonthlyReport(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsReportLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedEmployee, selectedPeriod]);

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return employees;

    return employees.filter((employee) =>
      [employee.name, employee.department, employee.contact, employee.jobTitle]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [employees, search]);

  const recordsByDay = useMemo(() => {
    return new Map(dailyRecords.map((record) => [getDayOfMonth(record.date), record]));
  }, [dailyRecords]);

  const stats = useMemo(() => {
    return {
      totalHours: (monthlyReport?.totalWorkingHours ?? 0).toFixed(1),
      averageDailyHours: (monthlyReport?.averageDailyWorkingHours ?? 0).toFixed(1),
      overtimeHours: (monthlyReport?.totalOvertimeHours ?? 0).toFixed(1),
      averageOvertimeHours: (monthlyReport?.averageDailyOvertimeHours ?? 0).toFixed(1)
    };
  }, [monthlyReport]);

  let employeeDropdownContent = (
    <p className="px-4 py-3 text-sm text-slate-500">查無符合員工</p>
  );

  if (isEmployeeLoading) {
    employeeDropdownContent = <p className="px-4 py-3 text-sm text-slate-500">搜尋中</p>;
  } else if (filteredEmployees.length > 0) {
    employeeDropdownContent = filteredEmployees.map((employee) => (
      <button
        key={employee.id}
        type="button"
        onClick={() => {
          setSelectedEmployee(employee);
          setSearch(employee.name);
          setIsDropdownOpen(false);
        }}
        className="w-full border-b border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-100 last:border-b-0"
      >
        <p className="font-medium text-slate-950">{employee.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {employee.department}・{employee.contact}
        </p>
      </button>
    ));
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar activePage="個別員工檢視" />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
              <div className="relative min-w-0 flex-1">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search employee by name, department"
                  className="w-full rounded-3xl border border-slate-200/80 bg-slate-100 px-5 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />

                {isDropdownOpen && search && (
                  <div className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                    {employeeDropdownContent}
                  </div>
                )}
              </div>

              <YearMonthFilter
                selectedYear={selectedPeriod.year}
                selectedMonth={selectedPeriod.month}
                currentDate={currentDate}
                onChange={setSelectedPeriod}
              />
            </div>

            {error && (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">姓名</p>
                <p className="mt-2 font-medium text-slate-950">
                  {selectedEmployee?.name ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">部門</p>
                <p className="mt-2 font-medium text-slate-950">
                  {selectedEmployee?.department ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">聯絡資訊</p>
                <p className="mt-2 font-medium text-slate-950">
                  {selectedEmployee?.contact ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">最新更新</p>
                <p className="mt-2 font-medium text-slate-950">{formatUpdatedAt(updatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Overview
              </p>
              {isReportLoading && <p className="text-sm text-slate-500">載入中</p>}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <div className="rounded-[1.75rem] bg-blue-50 p-6">
                <p className="text-sm font-medium text-slate-500">累積總時數</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{stats.totalHours}</p>
                <p className="mt-1 text-xs text-slate-500">小時</p>
              </div>

              <div className="rounded-[1.75rem] bg-slate-100 p-6">
                <p className="text-sm font-medium text-slate-500">平均每日工時</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {stats.averageDailyHours}
                </p>
                <p className="mt-1 text-xs text-slate-500">小時</p>
              </div>

              <div className="rounded-[1.75rem] bg-blue-50 p-6">
                <p className="text-sm font-medium text-slate-500">累積加班時數</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {stats.overtimeHours}
                </p>
                <p className="mt-1 text-xs text-slate-500">小時</p>
              </div>

              <div className="rounded-[1.75rem] bg-slate-100 p-6">
                <p className="text-sm font-medium text-slate-500">平均加班時數</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {stats.averageOvertimeHours}
                </p>
                <p className="mt-1 text-xs text-slate-500">小時</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              工時分布
            </p>

            <div className="mt-6 grid grid-cols-[48px_minmax(0,1fr)] gap-4">
              <div className="flex h-[300px] flex-col justify-between text-right text-xs text-slate-500">
                <span>10h</span>
                <span>8h</span>
                <span>6h</span>
                <span>4h</span>
                <span>2h</span>
                <span className="text-transparent">0h</span>
              </div>

              <div className="flex items-end justify-between gap-2" style={{ height: "300px" }}>
                {Array.from({ length: chartDays }, (_, i) => {
                  const day = i + 1;
                  const record = recordsByDay.get(day);
                  const height = record ? Math.max(4, Math.min(record.workingHours / 10, 1) * 270) : 0;

                  return (
                    <div key={day} className="flex flex-1 flex-col items-center">
                      {record ? (
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className={`w-full rounded-t-lg transition ${
                            record.overEightHours
                              ? "bg-red-400 hover:bg-red-500"
                              : "bg-blue-200 hover:bg-blue-300"
                          }`}
                          style={{ height: `${height}px` }}
                          title={`${record.date}: ${record.workingHours}h`}
                        />
                      ) : (
                        <div className="w-full" style={{ height: 0 }} />
                      )}

                      <p className="mt-3 text-xs text-slate-500">{day}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-6 border-t border-slate-200/80 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-blue-200" />
                <span className="text-sm text-slate-600">正常工時 (&le;8小時)</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-400" />
                <span className="text-sm text-slate-600">加班工時 ({">"}8小時)</span>
              </div>
            </div>
          </div>
        </section>
      </div>
      <EmployeeAccessRecordsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </main>
  );
}
