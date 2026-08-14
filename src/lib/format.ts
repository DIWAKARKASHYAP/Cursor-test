const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currencyPreciseFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number, precise = false): string {
  if (!Number.isFinite(value)) {
    return "$0";
  }

  const formatter = precise && Math.abs(value) < 1000 ? currencyPreciseFormatter : currencyFormatter;
  return formatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return "$0";
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_000_000) {
    return `${sign}$${trimDecimal(abs / 1_000_000)}M`;
  }

  if (abs >= 1_000) {
    return `${sign}$${trimDecimal(abs / 1_000)}K`;
  }

  return formatCurrency(value);
}

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}
