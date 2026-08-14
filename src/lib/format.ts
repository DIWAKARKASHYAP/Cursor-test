const rupeeFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return "Rs. 0";
  }

  return `Rs. ${rupeeFormatter.format(Math.round(value))}`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}
