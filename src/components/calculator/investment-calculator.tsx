"use client";

import { useState } from "react";
import { calculateInvestment, type CalculatorInputs } from "@/lib/calculate";
import { formatCurrency, formatPercent } from "@/lib/format";
import { GrowthChart } from "@/components/calculator/growth-chart";
import { ProjectionTable } from "@/components/calculator/projection-table";

const DEFAULT_INPUTS: CalculatorInputs = {
  principal: 10_000,
  monthlyContribution: 500,
  annualRatePercent: 8,
  years: 20,
  annualContributionIncreasePercent: 0,
};

const RATE_PRESETS = [
  { label: "Conservative", value: 5 },
  { label: "Balanced", value: 8 },
  { label: "Growth", value: 10 },
];

const YEAR_PRESETS = [10, 20, 30, 40];

type FieldKey = keyof CalculatorInputs;

const FIELDS: {
  key: FieldKey;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}[] = [
  {
    key: "principal",
    label: "Starting amount",
    hint: "What you invest today",
    min: 0,
    max: 1_000_000,
    step: 500,
  },
  {
    key: "monthlyContribution",
    label: "Monthly contribution",
    hint: "Added at the start of each month",
    min: 0,
    max: 20_000,
    step: 50,
  },
  {
    key: "annualRatePercent",
    label: "Expected annual return",
    hint: "Nominal yearly rate, compounded monthly",
    min: 0,
    max: 20,
    step: 0.1,
  },
  {
    key: "years",
    label: "Time horizon",
    hint: "How long the money stays invested",
    min: 1,
    max: 50,
    step: 1,
  },
  {
    key: "annualContributionIncreasePercent",
    label: "Yearly contribution increase",
    hint: "Optional raise to monthly deposits each year",
    min: 0,
    max: 15,
    step: 0.5,
  },
];

export function InvestmentCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const result = calculateInvestment(inputs);

  const updateField = (key: FieldKey, rawValue: string) => {
    const parsed = Number(rawValue);
    setInputs((current) => ({
      ...current,
      [key]: Number.isFinite(parsed) ? parsed : 0,
    }));
  };

  const interestShare =
    result.futureValue > 0 ? (result.totalInterest / result.futureValue) * 100 : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <section className="rounded-3xl border border-mist bg-white p-6 shadow-[0_1px_0_rgba(12,31,46,0.04)] md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
              Your plan
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Adjust the inputs to project compound growth.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInputs(DEFAULT_INPUTS)}
            className="rounded-xl border border-mist px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-foam"
          >
            Reset
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {RATE_PRESETS.map((preset) => {
            const selected = inputs.annualRatePercent === preset.value;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  setInputs((current) => ({
                    ...current,
                    annualRatePercent: preset.value,
                  }))
                }
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-tide text-white"
                    : "bg-foam text-ink-soft hover:bg-mist"
                }`}
              >
                {preset.label} {preset.value}%
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {YEAR_PRESETS.map((years) => {
            const selected = inputs.years === years;
            return (
              <button
                key={years}
                type="button"
                onClick={() => setInputs((current) => ({ ...current, years }))}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-tide-deep text-white"
                    : "bg-foam text-ink-soft hover:bg-mist"
                }`}
              >
                {years} years
              </button>
            );
          })}
        </div>

        <form className="mt-8 space-y-6" onSubmit={(event) => event.preventDefault()}>
          {FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink">{field.label}</span>
                <span className="text-sm font-semibold text-tide-deep">
                  {field.key === "annualRatePercent" ||
                  field.key === "annualContributionIncreasePercent"
                    ? formatPercent(inputs[field.key])
                    : field.key === "years"
                      ? `${inputs[field.key]} yrs`
                      : formatCurrency(inputs[field.key])}
                </span>
              </span>
              <span className="mt-1 block text-xs text-ink-soft">{field.hint}</span>
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={inputs[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                className="mt-3 w-full accent-tide"
                aria-valuemin={field.min}
                aria-valuemax={field.max}
                aria-valuenow={inputs[field.key]}
              />
              <input
                type="number"
                inputMode="decimal"
                min={field.min}
                max={field.max}
                step={field.step}
                value={inputs[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                className="mt-2 w-full rounded-xl border border-mist bg-foam px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-tide"
              />
            </label>
          ))}
        </form>
      </section>

      <div className="space-y-6">
        <section
          aria-live="polite"
          className="rounded-3xl border border-mist bg-white p-6 shadow-[0_1px_0_rgba(12,31,46,0.04)] md:p-8"
        >
          <p className="text-sm font-medium text-tide">Projected value</p>
          <p className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            {formatCurrency(result.futureValue)}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            After {inputs.years} years at {formatPercent(inputs.annualRatePercent)} expected return.
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: "You invest", value: formatCurrency(result.totalContributed) },
              { label: "Interest earned", value: formatCurrency(result.totalInterest) },
              { label: "Growth share", value: `${interestShare.toFixed(0)}%` },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-foam px-4 py-3"
              >
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                  {item.label}
                </dt>
                <dd className="mt-1 font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-tide"
              style={{
                width: `${Math.min(100, (result.totalContributed / Math.max(result.futureValue, 1)) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            Teal is contributions. Sand is compound interest on top of what you put in.
          </p>
        </section>

        <section className="rounded-3xl border border-mist bg-white p-6 shadow-[0_1px_0_rgba(12,31,46,0.04)] md:p-8">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
            Growth over time
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Ending balance versus cumulative contributions.
          </p>
          <div className="mt-6">
            <GrowthChart years={result.years} />
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-mist bg-white p-6 shadow-[0_1px_0_rgba(12,31,46,0.04)] xl:col-span-2 md:p-8">
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-ink">
          Year-by-year projection
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Contributions are added monthly, then the balance compounds at the monthly rate.
        </p>
        <div className="mt-4">
          <ProjectionTable years={result.years} />
        </div>
      </section>
    </div>
  );
}
