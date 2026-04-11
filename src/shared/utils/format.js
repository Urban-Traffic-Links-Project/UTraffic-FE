export function formatPercent(x, digits = 0) {
  if (x == null || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(digits)}%`;
}

export function formatNumber(x, digits = 0) {
  if (x == null || Number.isNaN(x)) return "—";
  return Number(x).toFixed(digits);
}
