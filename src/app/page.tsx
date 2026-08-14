import { InvestmentCalculator } from "@/components/calculator/investment-calculator";

export default function Home() {
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f8fbf9_0%,var(--foam)_100%)]">
      <header className="border-b border-mist bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5 md:px-8">
          <div>
            <p className="text-sm font-semibold tracking-wide text-tide">
              invest_calculator
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              Investment calculator
            </h1>
          </div>
            <p className="hidden max-w-sm text-right text-sm text-ink-soft sm:block">
              Enter monthly amount, years, and average return to see money after each year.
            </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 md:px-8 md:py-10">
        <InvestmentCalculator />
      </main>
    </div>
  );
}
