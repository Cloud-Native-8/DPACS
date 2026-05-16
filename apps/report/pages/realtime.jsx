import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { fetchAccessApi, getStoredToken } from "../src/lib/access-api-client.js";
import { createAvatarStyle, getInitials } from "../src/lib/avatar.js";

const formatCount = (value) => Number(value ?? 0).toLocaleString("en-US");

const formatUpdatedAt = (date) => {
  if (!date) return "尚未更新";

  return date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const mapPresenceEmployee = (employee) => ({
  id: employee.employeeId,
  name: employee.employeeName,
  department: employee.departmentName ?? "-",
  role: employee.jobTitle ?? employee.jobLevelName ?? "-",
  contact: employee.phone ?? employee.email ?? "-",
  avatarStyle: createAvatarStyle(employee.employeeName)
});

export default function RealTimePeoplePage() {
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({ insideCount: 0, outsideCount: 0 });
  const [people, setPeople] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPresenceData = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      setError("請先登入後再查看即時人員動態。");
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams();
    const keyword = search.trim();

    if (keyword) {
      params.set("keyword", keyword);
    }

    setIsLoading(true);
    setError("");

    try {
      const [summaryData, employeesData] = await Promise.all([
        fetchAccessApi("/api/manager/reports/presence/summary", token),
        fetchAccessApi(
          `/api/manager/reports/presence/employees${params.size ? `?${params}` : ""}`,
          token
        )
      ]);

      setSummary({
        insideCount: summaryData.insideCount ?? 0,
        outsideCount: summaryData.outsideCount ?? 0
      });
      setPeople((employeesData.employees ?? []).map(mapPresenceEmployee));
      setUpdatedAt(new Date());
    } catch (fetchError) {
      setError(fetchError.message);
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadPresenceData();

    const intervalId = window.setInterval(loadPresenceData, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadPresenceData]);

  const filteredPeople = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return people;
    return people.filter((person) =>
      [person.name, person.department, person.role, person.contact]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [people, search]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar activePage="即時人員動態" />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-semibold text-slate-950 sm:text-2xl">即時人員動態</h1>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">人數統計</p>
              </div>
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                最新更新：{formatUpdatedAt(updatedAt)}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] bg-slate-100 p-6 shadow-sm shadow-slate-900/5">
                <p className="text-sm font-medium text-slate-500">在辦公室人數</p>
                <p className="mt-4 text-4xl font-semibold text-slate-950">
                  {formatCount(summary.insideCount)}
                </p>
              </div>
              <div className="rounded-[1.75rem] bg-slate-200 p-6 shadow-sm shadow-slate-900/5">
                <p className="text-sm font-medium text-slate-500">不在辦公室人數</p>
                <p className="mt-4 text-4xl font-semibold text-slate-950">
                  {formatCount(summary.outsideCount)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">名單</p>
                <p className="mt-1 text-sm text-slate-500">搜尋即時在場人員名單</p>
              </div>
              <div className="relative w-full sm:w-80">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search"
                  className="w-full rounded-3xl border border-slate-200/80 bg-slate-100 px-5 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            {error && (
              <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-50">
              <div className="grid grid-cols-4 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 sm:grid-cols-[2fr_1fr_1fr_1fr]">
                <span>姓名</span>
                <span>部門</span>
                <span>職缺</span>
                <span>聯絡資訊</span>
              </div>
              <div className="divide-y divide-slate-200">
                {isLoading ? (
                  <p className="px-6 py-8 text-center text-sm text-slate-500">載入中</p>
                ) : filteredPeople.length ? (
                  filteredPeople.map((person) => (
                  <div key={person.id} className="grid items-center grid-cols-4 gap-4 px-6 py-4 text-sm text-slate-700 sm:grid-cols-[2fr_1fr_1fr_1fr]">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold"
                        style={person.avatarStyle}
                      >
                        {getInitials(person.name)}
                      </div>
                      <span>{person.name}</span>
                    </div>
                    <span className="text-slate-500">{person.department}</span>
                    <span className="text-slate-500">{person.role}</span>
                    <span className="text-slate-500">{person.contact}</span>
                  </div>
                  ))
                ) : (
                  <p className="px-6 py-8 text-center text-sm text-slate-500">
                    目前沒有在辦公室的人員
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
