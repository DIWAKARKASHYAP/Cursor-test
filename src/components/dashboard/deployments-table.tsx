import { deployments } from "@/lib/dashboard-data";

const statusStyles = {
  live: "bg-emerald-50 text-emerald-700",
  building: "bg-amber-50 text-amber-700",
  failed: "bg-rose-50 text-rose-700",
};

export function DeploymentsTable() {
  return (
    <section
      id="deployments"
      className="rounded-2xl border border-mist bg-white p-5 shadow-[0_1px_0_rgba(12,31,46,0.04)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-ink">
            Deployments
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Latest releases across environments
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-tide-deep"
        >
          New deploy
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-mist text-ink-soft">
              <th className="pb-3 pr-4 font-medium">Deployment</th>
              <th className="pb-3 pr-4 font-medium">Environment</th>
              <th className="pb-3 pr-4 font-medium">Branch</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((row) => (
              <tr key={row.id} className="border-b border-mist last:border-b-0">
                <td className="py-4 pr-4 font-medium text-ink">{row.id}</td>
                <td className="py-4 pr-4 text-ink-soft">{row.environment}</td>
                <td className="py-4 pr-4 font-mono text-xs text-ink-soft">
                  {row.branch}
                </td>
                <td className="py-4 pr-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[row.status]}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="py-4 text-ink-soft">{row.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
