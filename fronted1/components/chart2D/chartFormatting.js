export function formatChartValue(value, currency = false) {
  if (!Number.isFinite(Number(value))) return String(value ?? "");
  return currency
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value))
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value));
}
