import { useMemo, useState } from "react";
import EmployeeAccessRecordsModal from "../components/EmployeeAccessRecordsModal.jsx";
import Sidebar from "../components/Sidebar.jsx";
import YearMonthFilter from "../components/YearMonthFilter.jsx";

// 模擬員工數據
const employees = [
    { id: 1, name: "ByeWind", department: "ABC", contact: "0909123456" },
    { id: 2, name: "Natali Craig", department: "ABC", contact: "0909000000" },
    { id: 3, name: "Drew Cano", department: "XYZ", contact: "0909123456" },
    { id: 4, name: "Orlando Diggs", department: "XYZ", contact: "0909123456" },
    { id: 5, name: "Andi Lane", department: "ABC", contact: "0909123456" }
];

// 固定工時數據
const workHoursData = [
    { day: 1, workingHours: 7.5, overtimeHours: 0, overEightHours: false },
    { day: 2, workingHours: 8.0, overtimeHours: 0, overEightHours: false },
    { day: 3, workingHours: 9.2, overtimeHours: 1.2, overEightHours: true },
    { day: 4, workingHours: 7.8, overtimeHours: 0, overEightHours: false },
    { day: 5, workingHours: 8.0, overtimeHours: 0, overEightHours: false },
    { day: 8, workingHours: 8.0, overtimeHours: 0, overEightHours: false },
    { day: 9, workingHours: 6.0, overtimeHours: 0, overEightHours: false },
    { day: 10, workingHours: 11.2, overtimeHours: 3.2, overEightHours: true },
    { day: 11, workingHours: 7.2, overtimeHours: 0, overEightHours: false },
    { day: 12, workingHours: 8.0, overtimeHours: 0, overEightHours: false },
    { day: 15, workingHours: 7.5, overtimeHours: 0, overEightHours: false },
    { day: 16, workingHours: 8.0, overtimeHours: 0, overEightHours: false },
    { day: 17, workingHours: 8.0, overtimeHours: 0, overEightHours: false },
    { day: 18, workingHours: 7.0, overtimeHours: 0, overEightHours: false },
    { day: 19, workingHours: 7.0, overtimeHours: 0, overEightHours: false },
    { day: 22, workingHours: 8.0, overtimeHours: 0, overEightHours: false },
    { day: 23, workingHours: 10.5, overtimeHours: 2.5, overEightHours: true },
    { day: 24, workingHours: 7.8, overtimeHours: 0, overEightHours: false },
    { day: 25, workingHours: 8.5, overtimeHours: 0.5, overEightHours: true },
    { day: 26, workingHours: 9.2, overtimeHours: 1.2, overEightHours: true },
    { day: 29, workingHours: 8.0, overtimeHours: 0, overEightHours: false },
    { day: 30, workingHours: 7.0, overtimeHours: 0, overEightHours: false },
    { day: 31, workingHours: 8.0, overtimeHours: 0, overEightHours: false },
];

const mockAccessEventsByDay = {
    1: [
        {
            logId: 90001,
            employeeId: 1,
            employeeName: "ByeWind",
            siteId: 1,
            siteName: "Taipei Office",
            accessPointId: 501,
            accessPointName: "Main Entrance",
            direction: "IN",
            result: "ACCEPT",
            reason: "ACCESS_GRANTED",
            eventTime: "2026-05-01T09:00:00+08:00",
            note: "",
            createdAt: "2026-05-01T09:00:01+08:00"
        },
        {
            logId: 90002,
            employeeId: 1,
            employeeName: "ByeWind",
            siteId: 1,
            siteName: "Taipei Office",
            accessPointId: 501,
            accessPointName: "Main Entrance",
            direction: "OUT",
            result: "ACCEPT",
            reason: "ACCESS_GRANTED",
            eventTime: "2026-05-01T17:30:00+08:00",
            note: "",
            createdAt: "2026-05-01T17:30:01+08:00"
        }
    ],
    3: [
        {
            logId: 90003,
            employeeId: 1,
            employeeName: "ByeWind",
            siteId: 1,
            siteName: "Taipei Office",
            accessPointId: 501,
            accessPointName: "Main Entrance",
            direction: "IN",
            result: "ACCEPT",
            reason: "ACCESS_GRANTED",
            eventTime: "2026-05-03T08:40:00+08:00",
            note: "",
            createdAt: "2026-05-03T08:40:01+08:00"
        },
        {
            logId: 90004,
            employeeId: 1,
            employeeName: "ByeWind",
            siteId: 1,
            siteName: "Taipei Office",
            accessPointId: 502,
            accessPointName: "Office Exit",
            direction: "OUT",
            result: "ACCEPT",
            reason: "ACCESS_GRANTED",
            eventTime: "2026-05-03T18:10:00+08:00",
            note: "",
            createdAt: "2026-05-03T18:10:01+08:00"
        }
    ],
    10: [
        {
            logId: 90005,
            employeeId: 1,
            employeeName: "ByeWind",
            siteId: 1,
            siteName: "Taipei Office",
            accessPointId: 501,
            accessPointName: "Main Entrance",
            direction: "IN",
            result: "ACCEPT",
            reason: "ACCESS_GRANTED",
            eventTime: "2026-05-10T08:30:00+08:00",
            note: "",
            createdAt: "2026-05-10T08:30:01+08:00"
        },
        {
            logId: 90006,
            employeeId: 1,
            employeeName: "ByeWind",
            siteId: 1,
            siteName: "Taipei Office",
            accessPointId: 503,
            accessPointName: "Meeting Room A",
            direction: "IN",
            result: "DENY",
            reason: "-",
            eventTime: "2026-05-10T13:00:00+08:00",
            note: "Consecutive IN detected.",
            createdAt: "2026-05-10T13:00:01+08:00"
        },
        {
            logId: 90007,
            employeeId: 1,
            employeeName: "ByeWind",
            siteId: 1,
            siteName: "Taipei Office",
            accessPointId: 502,
            accessPointName: "Office Exit",
            direction: "OUT",
            result: "ACCEPT",
            reason: "ACCESS_GRANTED",
            eventTime: "2026-05-10T19:42:00+08:00",
            note: "",
            createdAt: "2026-05-10T19:42:01+08:00"
        }
    ],
    23: [
        {
            logId: 90008,
            employeeId: 1,
            employeeName: "ByeWind",
            siteId: 1,
            siteName: "Taipei Office",
            accessPointId: 501,
            accessPointName: "Main Entrance",
            direction: "IN",
            result: "ACCEPT",
            reason: "ACCESS_GRANTED",
            eventTime: "2026-05-23T08:55:00+08:00",
            note: "",
            createdAt: "2026-05-23T08:55:01+08:00"
        },
        {
            logId: 90009,
            employeeId: 1,
            employeeName: "ByeWind",
            siteId: 1,
            siteName: "Taipei Office",
            accessPointId: 502,
            accessPointName: "Office Exit",
            direction: "OUT",
            result: "ACCEPT",
            reason: "ACCESS_GRANTED",
            eventTime: "2026-05-23T19:25:00+08:00",
            note: "",
            createdAt: "2026-05-23T19:25:01+08:00"
        }
    ]
};

// const mockDeniedAccessLogsByDay = {
//     10: [
//         {
//             logId: 91001,
//             employeeId: 1,
//             employeeName: "ByeWind",
//             siteId: 1,
//             siteName: "Taipei Office",
//             accessPointId: 504,
//             accessPointName: "Server Room",
//             direction: "IN",
//             result: "DENY",
//             reason: "PERMISSION_DENIED",
//             eventTime: "2026-05-10T20:05:00+08:00",
//             note: "User does not have permission to access server room.",
//             createdAt: "2026-05-10T20:05:01+08:00"
//         }
//     ],
//     25: [
//         {
//             logId: 91002,
//             employeeId: 1,
//             employeeName: "ByeWind",
//             siteId: 1,
//             siteName: "Taipei Office",
//             accessPointId: 501,
//             accessPointName: "Main Entrance",
//             direction: "IN",
//             result: "DENY",
//             reason: "CARD_EXPIRED",
//             eventTime: "2026-05-25T08:50:00+08:00",
//             note: "Access card expired.",
//             createdAt: "2026-05-25T08:50:01+08:00"
//         }
//     ]
// };

const formatDate = (year, month, day) => {
    const paddedMonth = String(month).padStart(2, "0");
    const paddedDay = String(day).padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
};

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const generateDailyRecords = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);

    return workHoursData.filter((data) => data.day <= daysInMonth).map((data) => ({
        date: formatDate(year, month, data.day),
        day: data.day,
        workingHours: data.workingHours,
        overtimeHours: data.overtimeHours,
        overEightHours: data.overEightHours,
        isComplete: true,
        accessEvents: mockAccessEventsByDay[data.day] ?? [],
        // deniedAccessLogs: mockDeniedAccessLogsByDay[data.day] ?? []
    }));
};

export default function EmployeeViewPage() {
    const currentDate = useMemo(() => new Date(), []);
    const initialPeriod = useMemo(() => ({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1
    }), [currentDate]);

    const [search, setSearch] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState(employees[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
    const chartDays = getDaysInMonth(selectedPeriod.year, selectedPeriod.month);
    const dailyRecords = useMemo(
        () => generateDailyRecords(selectedPeriod.year, selectedPeriod.month),
        [selectedPeriod]
    );

    const filteredEmployees = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return employees;

        return employees.filter((employee) =>
            [employee.name, employee.department]
                .join(" ")
                .toLowerCase()
                .includes(keyword)
        );
    }, [search]);

    const stats = useMemo(() => {
        const totalHours = dailyRecords.reduce((sum, r) => sum + r.workingHours, 0);
        const averageDailyHours = (totalHours / dailyRecords.length).toFixed(1);

        const overtimeHoursNumber = dailyRecords.reduce(
            (sum, r) => sum + r.overtimeHours,
            0
        );

        const overtimeHours = overtimeHoursNumber.toFixed(1);
        const averageOvertimeHours = (
            overtimeHoursNumber / dailyRecords.length
        ).toFixed(1);

        return {
            totalHours: Math.round(totalHours),
            averageDailyHours,
            overtimeHours,
            averageOvertimeHours
        };
    }, [dailyRecords]);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
            <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <Sidebar activePage="個別員工檢視" />
                
                <section className="space-y-6">
                    {/* 員工資料卡片 */}
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
                                        {filteredEmployees.length > 0 ? (
                                            filteredEmployees.map((employee) => (
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
                                                    <p className="font-medium text-slate-950">
                                                        {employee.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {employee.department}・{employee.contact}
                                                    </p>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="px-4 py-3 text-sm text-slate-500">
                                                查無符合員工
                                            </p>
                                        )}
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
                                <p className="mt-2 font-medium text-slate-950">現在</p>
                            </div>
                        </div>
                    </div>

                    {/* Overview 統計卡片 */}
                    <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Overview
                        </p>

                        <div className="mt-6 grid gap-4 sm:grid-cols-4">
                            <div className="rounded-[1.75rem] bg-blue-50 p-6">
                                <p className="text-sm font-medium text-slate-500">累積總時數</p>
                                <p className="mt-3 text-3xl font-semibold text-slate-950">
                                    {stats.totalHours}
                                </p>
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

                    {/* 工時分布圖表 */}
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

                            <div
                                className="flex items-end justify-between gap-2"
                                style={{ height: "300px" }}
                            >
                                {Array.from({ length: chartDays }, (_, i) => {
                                    const day = i + 1;
                                    const record = dailyRecords.find((r) => r.day === day);

                                    return (
                                        <div
                                            key={day}
                                            className="flex flex-1 flex-col items-center"
                                        >
                                            {record ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedRecord(record)}
                                                    className={`w-full rounded-t-lg transition ${record.overEightHours
                                                        ? "bg-red-400 hover:bg-red-500"
                                                        : "bg-blue-200 hover:bg-blue-300"
                                                        }`}
                                                    style={{ height: `${(record.workingHours / 10) * 270}px` }}
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
                                <span className="text-sm text-slate-600">
                                    正常工時 (&le;8小時)
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded bg-red-400" />
                                <span className="text-sm text-slate-600">
                                    加班工時 ({">"}8小時)
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            <EmployeeAccessRecordsModal
                record={selectedRecord}
                onClose={() => setSelectedRecord(null)}
            />
        </main>
    );
}
