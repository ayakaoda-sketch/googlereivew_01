// Dates are passed around as "YYYY-MM-DD" strings in Asia/Manila local time.

export const TIMEZONE = "Asia/Manila";

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toManilaDate(instant: Date | string): string {
  return ymdFormatter.format(typeof instant === "string" ? new Date(instant) : instant);
}

export function todayManila(now: Date = new Date()): string {
  return toManilaDate(now);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

/** Inclusive list of dates, oldest first. */
export function dateRange(end: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => addDays(end, i - days + 1));
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return addDays(value, 0) === value;
}

function utcNoon(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/** "Oct 5, 2026" */
export function formatLong(date: string): string {
  return utcNoon(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Oct 5" */
export function formatShort(date: string): string {
  return utcNoon(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

/** "Oct 6, 2026 · 06:12" in Manila time */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    timeZone: TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

/** Inclusive period of "YYYY-MM-DD" dates; a single day has from === to. */
export interface DateRange {
  from: string;
  to: string;
}

export function rangeDays({ from, to }: DateRange): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

/** Every date in the range, oldest first. */
export function datesIn(range: DateRange): string[] {
  return dateRange(range.to, rangeDays(range));
}

/** The same-length period immediately before `range`. */
export function previousRange(range: DateRange): DateRange {
  const n = rangeDays(range);
  return { from: addDays(range.from, -n), to: addDays(range.from, -1) };
}

/** "Oct 5, 2026" · "Oct 6 – Oct 12, 2026" · "Dec 29, 2025 – Jan 4, 2026" */
export function formatRange({ from, to }: DateRange): string {
  if (from === to) return formatLong(from);
  if (from.slice(0, 4) === to.slice(0, 4)) return `${formatShort(from)} – ${formatLong(to)}`;
  return `${formatLong(from)} – ${formatLong(to)}`;
}

/** "Oct 5" · "Sep 29 – Oct 5" */
export function formatRangeShort({ from, to }: DateRange): string {
  return from === to ? formatShort(from) : `${formatShort(from)} – ${formatShort(to)}`;
}
