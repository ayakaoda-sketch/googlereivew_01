import { addDays, isValidDate, todayManila } from "../date";
import type { DashboardData } from "../types";

export interface DataSource {
  /** Earliest date with collected data. */
  minDate(): Promise<string>;
  getDashboard(date: string, storeSlug: string | undefined): Promise<DashboardData>;
}

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
