import { formatCompactCurrency } from "@/lib/format";
import type { YearProjection } from "@/lib/calculate";

type GrowthChartProps = {
  years: YearProjection[];
};

const WIDTH = 640;
const HEIGHT = 260;
const PAD = { top: 16, right: 16, bottom: 36, left: 56 };

export function GrowthChart({ years }: GrowthChartProps) {
  if (years.length === 0) {
    return null;
  }

  const maxBalance = Math.max(...years.map((row) => row.endingBalance), 1);
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;

  const xForIndex = (index: number) => {
    if (years.length === 1) {
      return PAD.left + innerWidth / 2;
    }

    return PAD.left + (index / (years.length - 1)) * innerWidth;
  };

  const yForValue = (value: number) =>
    PAD.top + innerHeight - (value / maxBalance) * innerHeight;

  const balancePath = years
    .map((row, index) => `${index === 0 ? "M" : "L"} ${xForIndex(index)} ${yForValue(row.endingBalance)}`)
    .join(" ");

  const contributionPath = years
    .map((row, index) => `${index === 0 ? "M" : "L"} ${xForIndex(index)} ${yForValue(row.totalContributed)}`)
    .join(" ");

  const areaPath = [
    `M ${xForIndex(0)} ${yForValue(0)}`,
    ...years.map((row, index) => `L ${xForIndex(index)} ${yForValue(row.endingBalance)}`),
    `L ${xForIndex(years.length - 1)} ${yForValue(0)} Z`,
  ].join(" ");

  const ticks = [0, 0.5, 1].map((ratio) => ratio * maxBalance);
  const yearTicks = years.filter((_, index) => {
    if (years.length <= 8) {
      return true;
    }

    const step = Math.ceil(years.length / 6);
    return index === 0 || index === years.length - 1 || (index + 1) % step === 0;
  });

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label="Investment growth chart showing balance and contributions over time"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id="balanceFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1f6f6a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#1f6f6a" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yForValue(tick)}
              y2={yForValue(tick)}
              stroke="#d7e8e2"
              strokeDasharray="4 6"
            />
            <text
              x={PAD.left - 8}
              y={yForValue(tick) + 4}
              textAnchor="end"
              className="fill-ink-soft"
              fontSize="11"
            >
              {formatCompactCurrency(tick)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#balanceFill)" />
        <path d={contributionPath} fill="none" stroke="#e8d5b5" strokeWidth="2.5" />
        <path d={balancePath} fill="none" stroke="#1f6f6a" strokeWidth="2.75" />

        {yearTicks.map((row) => (
          <text
            key={row.year}
            x={xForIndex(row.year - 1)}
            y={HEIGHT - 10}
            textAnchor="middle"
            className="fill-ink-soft"
            fontSize="11"
          >
            Y{row.year}
          </text>
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 rounded bg-tide" />
          Ending balance
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 rounded bg-sand" />
          Total contributed
        </span>
      </div>
    </div>
  );
}
