"use client";

import { useState } from "react";
import { calculateAnnualGrowth, calculateInvestment } from "@/lib/calculate";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ProjectionTable } from "@/components/calculator/projection-table";

const DEFAULT_MONTHLY = "5000";
const DEFAULT_YEARS = "10";
const DEFAULT_RATE = "8";
const DEFAULT_START = "100000";
const DEFAULT_END = "200000";
const DEFAULT_GROWTH_YEARS = "7";

type Mode = "future" | "rate";

function parseAmount(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function RupeeAmountField({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <p className="mt-1 text-xs text-ink-soft">{hint}</p>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-soft">
          Rs.
        </span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={100}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-mist bg-foam py-3 pl-12 pr-16 text-base text-ink outline-none transition-colors focus:border-tide"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
          rupees
        </span>
      </div>
    </div>
  );
}

export function InvestmentCalculator() {
  const [mode, setMode] = useState<Mode>("future");
  const [monthly, setMonthly] = useState(DEFAULT_MONTHLY);
  const [years, setYears] = useState(DEFAULT_YEARS);
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [startAmount, setStartAmount] = useState(DEFAULT_START);
  const [endAmount, setEndAmount] = useState(DEFAULT_END);
  const [growthYears, setGrowthYears] = useState(DEFAULT_GROWTH_YEARS);

  const futureResult = calculateInvestment({
    principal: 0,
    monthlyContribution: parseAmount(monthly),
    annualRatePercent: parseAmount(rate),
    years: parseAmount(years),
    annualContributionIncreasePercent: 0,
  });

  const growthResult = calculateAnnualGrowth({
    startAmount: parseAmount(startAmount),
    endAmount: parseAmount(endAmount),
    years: parseAmount(growthYears),
  });

  const reset = () => {
    if (mode === "future") {
      setMonthly(DEFAULT_MONTHLY);
      setYears(DEFAULT_YEARS);
      setRate(DEFAULT_RATE);
      return;
    }

    setStartAmount(DEFAULT_START);
    setEndAmount(DEFAULT_END);
    setGrowthYears(DEFAULT_GROWTH_YEARS);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("future")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            mode === "future"
              ? "bg-tide text-white"
              : "bg-white text-ink-soft ring-1 ring-mist hover:bg-foam"
          }`}
        >
          Find money you get
        </button>
        <button
          type="button"
          onClick={() => setMode("rate")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            mode === "rate"
              ? "bg-tide text-white"
              : "bg-white text-ink-soft ring-1 ring-mist hover:bg-foam"
          }`}
        >
          Find yearly return %
        </button>
      </div>

      {mode === "future" ? (
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
              <RupeeAmountField
                id="monthly-input"
                label="Monthly investment amount (Rupees)"
                hint="How much you will put in every month"
                value={monthly}
                onChange={setMonthly}
                placeholder="5000"
              />

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
                    className="w-full rounded-xl border border-mist bg-foam px-3 py-3 pr-16 text-base text-ink outline-none transition-colors focus:border-tide"
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
              {formatCurrency(futureResult.futureValue)}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              After {futureResult.years.length} years at{" "}
              {formatPercent(parseAmount(rate))} average return.
            </p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-foam px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Total invested (Rupees)
                </dt>
                <dd className="mt-1 font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
                  {formatCurrency(futureResult.totalContributed)}
                </dd>
              </div>
              <div className="rounded-2xl bg-foam px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Interest earned (Rupees)
                </dt>
                <dd className="mt-1 font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
                  {formatCurrency(futureResult.totalInterest)}
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
              <ProjectionTable years={futureResult.years} />
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <section className="rounded-3xl border border-mist bg-white p-6 shadow-[0_1px_0_rgba(12,31,46,0.04)] md:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
                  Find yearly return
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Type start amount, end amount, and duration to get growth per year.
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
              <RupeeAmountField
                id="start-amount-input"
                label="Start amount (Rupees)"
                hint="How much you had at the beginning"
                value={startAmount}
                onChange={setStartAmount}
                placeholder="100000"
              />
              <RupeeAmountField
                id="end-amount-input"
                label="End amount (Rupees)"
                hint="How much you have now, or will have"
                value={endAmount}
                onChange={setEndAmount}
                placeholder="200000"
              />
              <div>
                <label htmlFor="growth-years-input" className="text-sm font-medium text-ink">
                  Duration
                </label>
                <p className="mt-1 text-xs text-ink-soft">
                  How many years between start and end
                </p>
                <div className="relative mt-2">
                  <input
                    id="growth-years-input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={60}
                    step={1}
                    placeholder="7"
                    value={growthYears}
                    onChange={(event) => setGrowthYears(event.target.value)}
                    className="w-full rounded-xl border border-mist bg-foam px-3 py-3 pr-16 text-base text-ink outline-none transition-colors focus:border-tide"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
                    years
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section
            aria-live="polite"
            className="rounded-3xl border border-mist bg-white p-6 shadow-[0_1px_0_rgba(12,31,46,0.04)] md:p-8"
          >
            <p className="text-sm font-medium text-tide">Growth per year</p>
            {growthResult.error ? (
              <p className="mt-4 text-sm font-medium text-rose-700">{growthResult.error}</p>
            ) : (
              <>
                <p className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-semibold tracking-tight text-ink md:text-5xl">
                  {formatPercent(growthResult.annualGrowthPercent ?? 0, 2)}
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  Compound annual growth rate over {growthResult.years} years.
                </p>
              </>
            )}

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-foam px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Profit (Rupees)
                </dt>
                <dd className="mt-1 font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
                  {formatCurrency(growthResult.profit)}
                </dd>
              </div>
              <div className="rounded-2xl bg-foam px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Total growth
                </dt>
                <dd className="mt-1 font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
                  {growthResult.totalGrowthPercent == null
                    ? "—"
                    : formatPercent(growthResult.totalGrowthPercent, 2)}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
