import Link from "next/link";
import { useEffect, useState } from "react";
import { getInitials } from "../src/lib/avatar.js";
import Icon from "./Icon.jsx";

const navItems = [
  {
    label: "即時人員動態",
    href: "/realtime",
    icon: "real-time-people",
    active: false
  },
  {
    label: "個別員工檢視",
    href: "/employee",
    icon: "employee-view",
    active: false
  },
  {
    label: "團隊趨勢分析",
    href: "/trends",
    icon: "trends",
    active: false
  },
  {
    label: "異常出勤管理",
    href: "/anomalies",
    icon: "anomalies",
    active: false
  }
];

const pageItems = [
  {
    label: "出勤查詢",
    href: "/attendance",
    icon: "attendance",
    active: false
  }
];

const NavButton = ({ item }) => (
  <Link href={item.href}>
    <button
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
        item.active
          ? "bg-slate-950 text-white shadow-lg shadow-slate-900/10"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center">
        <Icon name={item.icon} className={item.active ? "text-white" : "text-slate-600"} />
      </span>
      {item.label}
    </button>
  </Link>
);

export default function Sidebar({ activePage }) {
  const [employee, setEmployee] = useState(null);
  const updatedNavItems = navItems.map((item) => ({
    ...item,
    active: item.label === activePage
  }));
  const updatedPageItems = pageItems.map((item) => ({
    ...item,
    active: item.label === activePage
  }));
  const employeeName = employee?.employeeName ?? "Mandu";
  const employeeTitle = employee?.jobTitle ?? "管理員";
  const employeeInitial = getInitials(employeeName);

  useEffect(() => {
    const storedEmployee = localStorage.getItem("employee");
    if (!storedEmployee) return;

    try {
      setEmployee(JSON.parse(storedEmployee));
    } catch {
      setEmployee(null);
    }
  }, []);

  return (
    <aside className="hidden min-h-[calc(100vh-3rem)] rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-lg shadow-slate-900/5 lg:block">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
          {employeeInitial}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">{employeeName}</p>
          <p className="text-xs text-slate-500">{employeeTitle}</p>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Dashboards</p>
        <div className="space-y-2">
          {updatedNavItems.map((item) => (
            <NavButton key={item.label} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-10 border-t border-slate-200/80 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Pages</p>
        <div className="mt-4 space-y-2">
          {updatedPageItems.map((item) => (
            <NavButton key={item.label} item={item} />
          ))}
        </div>
      </div>
    </aside>
  );
}
