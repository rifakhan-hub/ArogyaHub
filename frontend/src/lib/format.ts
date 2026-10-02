// Numbers, rupees and file sizes, with Indian digit grouping (design doc 3.3).
const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const numbers = new Intl.NumberFormat("en-IN");

/** 150000 -> "₹1,50,000" */
export const formatINR = (amount: number) => rupees.format(amount);

/** 150000 -> "1,50,000" */
export const formatNumber = (n: number) => numbers.format(n);

/** 2048 -> "2 KB" */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Change from `previous` to `current` in whole percent, or null when previous is 0. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** 1 -> "1 report", 3 -> "3 reports" */
export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
