import { activity } from "@/lib/dashboard-data";

const statusStyles = {
  success: "bg-emerald-500",
  pending: "bg-sun",
  warning: "bg-rose-500",
};

export function ActivityFeed() {
  return (
    <section className="rounded-2xl border border-mist bg-white p-5 shadow-[0_1px_0_rgba(12,31,46,0.04)]">
      <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-ink">
        Recent activity
      </h2>
      <ul className="mt-5 space-y-4">
        {activity.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 border-b border-mist pb-4 last:border-b-0 last:pb-0"
          >
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${statusStyles[item.status]}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <span className="shrink-0 text-xs text-ink-soft">{item.time}</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
