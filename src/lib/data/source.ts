import { addDays, isValidDate, rangeDays, todayManila, type DateRange } from "../date";
import type { Locale } from "../i18n";
import type { DashboardData } from "../types";

export interface DataSource {
  /** Earliest date with collected data. */
  minDate(): Promise<string>;
  /** `locale` picks the language of AI-written text (summaries, brief). */
  getDashboard(range: DateRange, storeSlug: string | undefined, locale: Locale): Promise<DashboardData>;
}

/** Longest selectable period, in days. */
export const MAX_RANGE_DAYS = 92;

/** The latest selectable date is always "yesterday" in Manila — the last complete day. */
export function latestReviewDate(now: Date = new Date()): string {
  return addDays(todayManila(now), -1);
}

/** Falls back to the latest date for missing/invalid input, and clamps to range. */
export function resolveDate(requested: unknown, min: string, max: string): string {
  if (!isValidDate(requested)) return max;
  if (requested > max) return max;
  if (requested < min) return min;
  return requested;
}

/**
 * Reads `?from=&to=` (a period) or `?date=` (a single day). Invalid parts fall
 * back to the latest date; the result is clamped to [min, max] and MAX_RANGE_DAYS.
 */
export function resolveRange(
  params: { date?: unknown; from?: unknown; to?: unknown },
  min: string,
  max: string,
): DateRange {
  if (!isValidDate(params.from) && !isValidDate(params.to)) {
    const date = resolveDate(params.date, min, max);
    return { from: date, to: date };
  }
  let to = resolveDate(params.to, min, max);
  let from = isValidDate(params.from) ? resolveDate(params.from, min, max) : to;
  if (from > to) [from, to] = [to, from];
  if (rangeDays({ from, to }) > MAX_RANGE_DAYS) from = addDays(to, -(MAX_RANGE_DAYS - 1));
  return { from, to };
}
