import type { StatCard } from "@/lib/dashboard-data";

const trendStyles = {
  up: "text-emerald-700 bg-emerald-50",
  down: "text-rose-700 bg-rose-50",
  neutral: "text-ink-soft bg-foam",
};

export function StatCardView({ stat }: { stat: StatCard }) {
  return (
    <article className="rounded-2xl border border-mist bg-white p-5 shadow-[0_1px_0_rgba(12,31,46,0.04)]">
      <p className="text-sm font-medium text-ink-soft">{stat.label}</p>
      <p className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight text-ink">
        {stat.value}
      </p>
      <span
        className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${trendStyles[stat.trend]}`}
      >
        {stat.change}
      </span>
    </article>
  );
}
