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

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}
