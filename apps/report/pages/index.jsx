import Link from "next/link";
import { getReportData } from "../src/lib/report-data.js";

export async function getServerSideProps() {
  return {
    props: {
      report: await getReportData()
    }
  };
}

export default function HomePage({ report }) {
  const recentDenied = report.recentEvents.filter((event) => event.decision === "DENY").length;
  const monitoredFactories = new Set(report.recentEvents.map((event) => event.factoryId)).size;
  const lastEvent = report.recentEvents[0];
  const allowRate = report.recentEvents.length
    ? Math.round(((report.recentEvents.length - recentDenied) / report.recentEvents.length) * 100)
    : 0;
  const healthItems = [
    {
      label: "Access pipeline",
      value: "Healthy",
      tone: "bg-emerald-500",
      note: "Recent events available"
    },
    {
      label: "Denied event ratio",
      value: `${recentDenied}/${report.recentEvents.length || 0}`,
      tone: recentDenied > 3 ? "bg-amber-500" : "bg-emerald-500",
      note: "Based on latest 20 records"
    },
    {
      label: "Factory coverage",
      value: `${monitoredFactories} zones`,
      tone: "bg-sky-500",
      note: "Unique factories in stream"
    }
  ];

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-panel backdrop-blur sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pine">
              DPACS Admin Analytics
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Access operations overview
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Monitor active occupancy, entry throughput, denials, and recent access decisions from
              a single admin dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
              Updated {report.generatedAt}
            </div>
            <Link
              href="/report"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View full report
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {[
            {
              label: "Active employees",
              value: report.summary.activeEmployees,
              note: "Current unique users with allowed entry.",
              delta: `${monitoredFactories} factories`
            },
            {
              label: "Checked in today",
              value: report.summary.checkedInToday,
              note: "Successful entry events since midnight.",
              delta: `${allowRate}% allow rate`
            },
            {
              label: "Denied today",
              value: report.summary.pendingReviews,
              note: "Events requiring operator attention.",
              delta: `${recentDenied} in last 20`
            },
            {
              label: "Latest event",
              value: lastEvent ? lastEvent.time : "--:--",
              note: lastEvent ? `${lastEvent.userId} at ${lastEvent.doorId}` : "No recent events",
              delta: lastEvent ? lastEvent.decision : "N/A"
            }
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {item.label}
                </p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {item.delta}
                </span>
              </div>
              <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">{item.value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>
            </article>
          ))}
        </div>

        <aside className="rounded-[1.5rem] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                System Health
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Operational status</h2>
            </div>
            <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400" />
          </div>

          <div className="mt-6 space-y-4">
            {healthItems.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-200">{item.label}</p>
                  <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                </div>
                <p className="mt-3 text-xl font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-sm text-slate-400">{item.note}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <article className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-lg shadow-slate-900/5">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine">
                Recent Activity
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Latest access decisions</h2>
            </div>
            <p className="text-sm text-slate-500">Last 6 records from the event stream</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["User", "Door", "Factory", "Decision", "Direction", "Time"].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.recentEvents.slice(0, 6).map((event) => (
                  <tr key={event.eventId} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                      {event.userId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {event.doorId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {event.factoryId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          event.decision === "ALLOW"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {event.decision}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {event.direction}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {event.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine">
            Analytics Summary
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Key signals</h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">Approval rate</p>
                <span className="text-sm font-semibold text-emerald-700">{allowRate}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${allowRate}%` }} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-700">Denied in latest stream</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{recentDenied}</p>
                <p className="mt-2 text-sm text-slate-500">Out of the latest {report.recentEvents.length} rows</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-700">Factories observed</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{monitoredFactories}</p>
                <p className="mt-2 text-sm text-slate-500">Coverage across current event sample</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-700">Latest decision</p>
              <p className="mt-2 text-base text-slate-600">
                {lastEvent
                  ? `${lastEvent.userId} recorded ${lastEvent.decision} on ${lastEvent.direction} at ${lastEvent.doorId}.`
                  : "No recent event available."}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          "Occupancy and traffic metrics update from server-rendered event data.",
          "Denials remain visible as a first-class signal for access-control review.",
          "Detailed drill-down stays available in the report page without crowding the dashboard."
        ].map((item) => (
          <article
            key={item}
            className="rounded-[1.5rem] border border-slate-200/80 bg-white/70 p-5 text-sm leading-7 text-slate-600 shadow-lg shadow-slate-900/5"
          >
            {item}
          </article>
        ))}
      </section>
    </main>
  );
}
