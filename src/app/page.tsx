import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DeploymentsTable } from "@/components/dashboard/deployments-table";
import { InstagramConnect } from "@/components/dashboard/instagram-connect";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatCardView } from "@/components/dashboard/stat-card";
import { TrafficChart } from "@/components/dashboard/traffic-chart";
import { stats } from "@/lib/dashboard-data";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-mist bg-white px-6 py-5 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-tide">Dashboard</p>
              <h1
                id="overview"
                className="mt-1 font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight text-ink md:text-3xl"
              >
                Overview
              </h1>
              <p className="mt-2 text-sm text-ink-soft">
                Monitor deployments, traffic, and workspace health at a glance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="relative min-w-[220px] flex-1">
                <span className="sr-only">Search</span>
                <input
                  type="search"
                  placeholder="Search deployments..."
                  className="w-full rounded-xl border border-mist bg-foam px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/70 focus:border-tide"
                />
              </label>
              <button
                type="button"
                className="rounded-xl border border-mist bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-foam"
              >
                Export
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-[linear-gradient(180deg,#f8fbf9_0%,var(--foam)_100%)] px-6 py-6 md:px-8 md:py-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCardView key={stat.label} stat={stat} />
            ))}
          </section>

          <section className="mt-6">
            <InstagramConnect />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <TrafficChart />
            <ActivityFeed />
          </section>

          <section className="mt-6">
            <DeploymentsTable />
          </section>

          <section
            id="settings"
            className="mt-6 grid gap-4 md:grid-cols-3"
          >
            {[
              {
                title: "Edge regions",
                value: "12 active",
                detail: "All regions within latency targets",
              },
              {
                title: "Build cache",
                value: "94% hit rate",
                detail: "Dependencies cached from last deploy",
              },
              {
                title: "Uptime",
                value: "99.98%",
                detail: "Rolling 30-day production availability",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-mist bg-white p-5 shadow-[0_1px_0_rgba(12,31,46,0.04)]"
              >
                <p className="text-sm font-medium text-ink-soft">{item.title}</p>
                <p className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-semibold text-ink">
                  {item.value}
                </p>
                <p className="mt-2 text-sm text-ink-soft">{item.detail}</p>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
