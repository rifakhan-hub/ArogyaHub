// Dates are stored in UTC and always shown in India Standard Time (architecture doc section 6).
const TIME_ZONE = "Asia/Kolkata";
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Splits a date into its IST parts: weekday "Tue", day "6", month "Oct", hour "10", ... */
function istParts(date: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(date));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    weekday: get("weekday"),
    day: get("day"),
    month: get("month"),
    year: get("year"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** "Tue, 6 Oct" */
export function formatDay(date: string | Date) {
  const p = istParts(date);
  return `${p.weekday}, ${p.day} ${p.month}`;
}

/** "6 Oct 2026" */
export function formatDate(date: string | Date) {
  const p = istParts(date);
  return `${p.day} ${p.month} ${p.year}`;
}

/** "10:30" (24-hour clock) */
export function formatTime(date: string | Date) {
  const p = istParts(date);
  return `${p.hour}:${p.minute}`;
}

/** "Tue, 6 Oct, 10:30" */
export function formatDateTime(date: string | Date) {
  return `${formatDay(date)}, ${formatTime(date)}`;
}

/** "6 Oct 2026, 10:30:12" (for the audit log) */
export function formatTimestamp(date: string | Date) {
  const p = istParts(date);
  return `${formatDate(date)}, ${p.hour}:${p.minute}:${p.second}`;
}

/** Today's date in IST as "2026-10-06". */
export function todayIST(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

/** The IST date `days` from today, as "2026-10-06". Negative for the past. */
export function daysFromToday(days: number) {
  return todayIST(new Date(Date.now() + days * DAY));
}

/** "Today", "Yesterday", "Tomorrow", or "Tue, 6 Oct" */
export function formatRelativeDay(date: string | Date) {
  const day = todayIST(new Date(date));
  if (day === daysFromToday(0)) return "Today";
  if (day === daysFromToday(-1)) return "Yesterday";
  if (day === daysFromToday(1)) return "Tomorrow";
  return formatDay(date);
}

/** "just now", "45m ago", "10h ago", "3d ago", "2mo ago" */
export function timeAgo(date: string | Date, now: Date = new Date()) {
  const minutes = Math.floor((now.getTime() - new Date(date).getTime()) / MINUTE);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/** Hours between a date and now. */
export function hoursSince(date: string, now: Date = new Date()) {
  return (now.getTime() - new Date(date).getTime()) / (60 * MINUTE);
}

/** "morning", "afternoon" or "evening", by the IST hour. */
export function partOfDay(now: Date = new Date()) {
  const hour = Number(istParts(now).hour);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/** "6 Oct" */
export function formatShortDate(date: string | Date) {
  const p = istParts(date);
  return `${p.day} ${p.month}`;
}
