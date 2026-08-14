"use client";

import { useState } from "react";
import { calculateInvestment } from "@/lib/calculate";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ProjectionTable } from "@/components/calculator/projection-table";

const DEFAULT_MONTHLY = "5000";
const DEFAULT_YEARS = "10";
const DEFAULT_RATE = "8";

function parseAmount(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function InvestmentCalculator() {
  const [monthly, setMonthly] = useState(DEFAULT_MONTHLY);
  const [years, setYears] = useState(DEFAULT_YEARS);
  const [rate, setRate] = useState(DEFAULT_RATE);

  const result = calculateInvestment({
    principal: 0,
    monthlyContribution: parseAmount(monthly),
    annualRatePercent: parseAmount(rate),
    years: parseAmount(years),
    annualContributionIncreasePercent: 0,
  });

  const reset = () => {
    setMonthly(DEFAULT_MONTHLY);
    setYears(DEFAULT_YEARS);
    setRate(DEFAULT_RATE);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <section className="rounded-3xl border border-mist bg-white p-6 shadow-[0_1px_0_rgba(12,31,46,0.04)] md:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
              Enter your plan
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Type the monthly amount in rupees, years, and average return.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-mist px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-foam"
          >
            Reset
          </button>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <label htmlFor="monthly-input" className="text-sm font-medium text-ink">
              Monthly investment amount (Rupees)
            </label>
            <p className="mt-1 text-xs text-ink-soft">
              How much you will put in every month
            </p>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-soft">
                Rs.
              </span>
              <input
                id="monthly-input"
                type="number"
                inputMode="decimal"
                min={0}
                step={100}
                placeholder="5000"
                value={monthly}
                onChange={(event) => setMonthly(event.target.value)}
                className="w-full rounded-xl border border-mist bg-foam py-3 pl-12 pr-16 text-base text-ink outline-none transition-colors focus:border-tide"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
                rupees
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="years-input" className="text-sm font-medium text-ink">
              Time period
            </label>
            <p className="mt-1 text-xs text-ink-soft">
              How many years you will keep investing
            </p>
            <div className="relative mt-2">
              <input
                id="years-input"
                type="number"
                inputMode="numeric"
                min={1}
                max={60}
                step={1}
                placeholder="10"
                value={years}
                onChange={(event) => setYears(event.target.value)}
                className="w-full rounded-xl border border-mist bg-foam px-3 py-3 text-base text-ink outline-none transition-colors focus:border-tide"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
                years
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="rate-input" className="text-sm font-medium text-ink">
              Average return per year
            </label>
            <p className="mt-1 text-xs text-ink-soft">
              Expected yearly growth, compounded monthly
            </p>
            <div className="relative mt-2">
              <input
                id="rate-input"
                type="number"
                inputMode="decimal"
                min={0}
                max={50}
                step={0.1}
                placeholder="8"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                className="w-full rounded-xl border border-mist bg-foam px-3 py-3 pr-10 text-base text-ink outline-none transition-colors focus:border-tide"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
                %
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-live="polite"
        className="rounded-3xl border border-mist bg-white p-6 shadow-[0_1px_0_rgba(12,31,46,0.04)] md:p-8"
      >
        <p className="text-sm font-medium text-tide">Money you get (Rupees)</p>
        <p className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-semibold tracking-tight text-ink md:text-5xl">
          {formatCurrency(result.futureValue)}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          After {result.years.length} years at {formatPercent(parseAmount(rate))} average return.
        </p>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-foam px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              Total invested (Rupees)
            </dt>
            <dd className="mt-1 font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
              {formatCurrency(result.totalContributed)}
            </dd>
          </div>
          <div className="rounded-2xl bg-foam px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              Interest earned (Rupees)
            </dt>
            <dd className="mt-1 font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
              {formatCurrency(result.totalInterest)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl border border-mist bg-white p-6 shadow-[0_1px_0_rgba(12,31,46,0.04)] lg:col-span-2 md:p-8">
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
          Money you get after each year (Rupees)
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Each row shows how much you have put in and how much you have at the end of that year.
        </p>
        <div className="mt-4">
          <ProjectionTable years={result.years} />
        </div>
      </section>
    </div>
  );
}
