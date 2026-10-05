const TIME_ZONE = "Asia/Kolkata";
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

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

export function formatDay(date: string | Date) {
  const p = istParts(date);
  return `${p.weekday}, ${p.day} ${p.month}`;
}

export function formatDate(date: string | Date) {
  const p = istParts(date);
  return `${p.day} ${p.month} ${p.year}`;
}

export function formatTime(date: string | Date) {
  const p = istParts(date);
  return `${p.hour}:${p.minute}`;
}

export function formatDateTime(date: string | Date) {
  return `${formatDay(date)}, ${formatTime(date)}`;
}

export function formatTimestamp(date: string | Date) {
  const p = istParts(date);
  return `${formatDate(date)}, ${p.hour}:${p.minute}:${p.second}`;
}

export function todayIST(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

export function daysFromToday(days: number) {
  return todayIST(new Date(Date.now() + days * DAY));
}

export function formatRelativeDay(date: string | Date) {
  const day = todayIST(new Date(date));
  if (day === daysFromToday(0)) return "Today";
  if (day === daysFromToday(-1)) return "Yesterday";
  if (day === daysFromToday(1)) return "Tomorrow";
  return formatDay(date);
}

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

export function hoursSince(date: string, now: Date = new Date()) {
  return (now.getTime() - new Date(date).getTime()) / (60 * MINUTE);
}

export function partOfDay(now: Date = new Date()) {
  const hour = Number(istParts(now).hour);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function formatShortDate(date: string | Date) {
  const p = istParts(date);
  return `${p.day} ${p.month}`;
}
