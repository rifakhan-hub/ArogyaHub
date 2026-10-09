const DAY_MS = 24 * 60 * 60 * 1000;

const longDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

function toDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function weekdayIndex(key: string) {
  return (toDate(key).getUTCDay() + 6) % 7;
}

export function monthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const start = first.getTime() - ((first.getUTCDay() + 6) % 7) * DAY_MS;
  return Array.from({ length: 42 }, (_, i) => toKey(new Date(start + i * DAY_MS)));
}

export function shiftMonth(year: number, month: number, by: number) {
  const date = new Date(Date.UTC(year, month + by, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

export function formatLongDate(key: string) {
  return longDate.format(toDate(key));
}

export function formatMonth(year: number, month: number) {
  return monthName.format(new Date(Date.UTC(year, month, 1)));
}

export function dateKey(isoDateTime: string) {
  return isoDateTime.slice(0, 10);
}
