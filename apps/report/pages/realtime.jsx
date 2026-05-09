import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { createAvatarStyle, getInitials } from "../src/lib/avatar.js";

const people = [
  { id: 1, name: "ByeWind", department: "ABC", role: "工程師", contact: "0909123456" },
  { id: 2, name: "Natali Craig", department: "ABC", role: "工程師", contact: "0909123456" },
  { id: 3, name: "Drew Cano", department: "ABC", role: "工程師", contact: "0909123456" },
  { id: 4, name: "Orlando Diggs", department: "ABC", role: "工程師", contact: "0909123456" },
  { id: 5, name: "Andi Lane", department: "ABC", role: "工程師", contact: "0909123456" }
];

export default function RealTimePeoplePage() {
  const [search, setSearch] = useState("");

  const peopleWithAvatarStyles = useMemo(
    () =>
      people.map((person) => ({
        ...person,
        avatarStyle: createAvatarStyle(person.name)
      })),
    []
  );

  const filteredPeople = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return peopleWithAvatarStyles;
    return peopleWithAvatarStyles.filter((person) =>
      [person.name, person.department, person.role, person.contact]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [peopleWithAvatarStyles, search]);

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
                最新更新：現在
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] bg-slate-100 p-6 shadow-sm shadow-slate-900/5">
                <p className="text-sm font-medium text-slate-500">在辦公室人數</p>
                <p className="mt-4 text-4xl font-semibold text-slate-950">7,265</p>
              </div>
              <div className="rounded-[1.75rem] bg-slate-200 p-6 shadow-sm shadow-slate-900/5">
                <p className="text-sm font-medium text-slate-500">不在辦公室人數</p>
                <p className="mt-4 text-4xl font-semibold text-slate-950">3,671</p>
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

            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-50">
              <div className="grid grid-cols-4 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 sm:grid-cols-[2fr_1fr_1fr_1fr]">
                <span>姓名</span>
                <span>部門</span>
                <span>職缺</span>
                <span>聯絡資訊</span>
              </div>
              <div className="divide-y divide-slate-200">
                {filteredPeople.map((person) => (
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
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
