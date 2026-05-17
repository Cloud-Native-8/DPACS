import { getReportData } from "../src/server/report-service.js";

export async function getServerSideProps() {
  return {
    props: {
      report: await getReportData()
    }
  };
}

export default function ReportPage({ report }) {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-panel backdrop-blur sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pine">Report</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl leading-none text-ink sm:text-5xl">
              Recent Access Events
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Detailed event stream for operators who need to inspect door, decision, direction,
              and factory scope in one place.
            </p>
          </div>
          <p className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
            Generated {report.generatedAt}
          </p>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/90">
              <tr>
                {["User", "Door", "Factory", "Decision", "Direction", "Time"].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.recentEvents.map((event) => (
                <tr key={event.eventId} className="transition hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-ink">
                    {event.userId}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {event.doorId}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {event.factoryId}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        event.decision === "ALLOW"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {event.decision}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {event.direction}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {event.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
