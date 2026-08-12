import { weeklyTraffic } from "@/lib/dashboard-data";

export function TrafficChart() {
  const max = Math.max(...weeklyTraffic.map((point) => point.value));

  return (
    <section
      id="analytics"
      className="rounded-2xl border border-mist bg-white p-5 shadow-[0_1px_0_rgba(12,31,46,0.04)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-ink">
            Weekly traffic
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Requests served across all edge regions
          </p>
        </div>
        <span className="rounded-full bg-tide/10 px-3 py-1 text-xs font-semibold text-tide-deep">
          +18.4%
        </span>
      </div>

      <div className="mt-8 grid grid-cols-7 items-end gap-3">
        {weeklyTraffic.map((point) => (
          <div key={point.day} className="flex flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end rounded-lg bg-foam px-1 py-1">
              <div
                className="w-full rounded-md bg-[linear-gradient(to_top,var(--tide-deep),var(--tide))]"
                style={{ height: `${(point.value / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-ink-soft">{point.day}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
