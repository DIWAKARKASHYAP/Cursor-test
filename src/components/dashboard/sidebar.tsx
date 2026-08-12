import { navItems } from "@/lib/dashboard-data";

export function Sidebar() {
  return (
    <aside className="flex w-full flex-col border-b border-mist bg-white md:w-64 md:border-b-0 md:border-r">
      <div className="border-b border-mist px-6 py-5">
        <p className="font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-ink">
          Tideway
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-tide">
          Operations
        </p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 py-4 md:flex-col md:overflow-visible">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              item.active
                ? "bg-tide/10 text-tide-deep"
                : "text-ink-soft hover:bg-foam hover:text-ink"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-auto hidden border-t border-mist p-4 md:block">
        <div className="rounded-xl bg-foam p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tide">
            Workspace
          </p>
          <p className="mt-2 text-sm font-medium text-ink">Cursor-test</p>
          <p className="mt-1 text-xs text-ink-soft">Production healthy</p>
        </div>
      </div>
    </aside>
  );
}
