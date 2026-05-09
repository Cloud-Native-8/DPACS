import Link from "next/link";
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

export default function Sidebar({ activePage }) {
  const updatedNavItems = navItems.map((item) => ({
    ...item,
    active: item.label === activePage
  }));

  return (
    <aside className="hidden rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-lg shadow-slate-900/5 lg:block">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
          M
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Mandu</p>
          <p className="text-xs text-slate-500">管理員</p>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Dashboards</p>
        <div className="space-y-2">
          {updatedNavItems.map((item) => (
            <Link key={item.label} href={item.href}>
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
          ))}
        </div>
      </div>

      <div className="mt-10 border-t border-slate-200/80 pt-5">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Pages</p>
        <Link href="/attendance-query">
          <button className="mt-3 flex w-full items-center gap-3 rounded-3xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-500">▶</span>
            出勤查詢
          </button>
        </Link>
      </div>
    </aside>
  );
}
