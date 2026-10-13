import type { DateRange } from "./date";

/** A single day keeps the short `?date=` form; longer periods use `?from=&to=`. */
export function dashboardHref(range: DateRange, storeSlug?: string): string {
  const params =
    range.from === range.to
      ? new URLSearchParams({ date: range.to })
      : new URLSearchParams({ from: range.from, to: range.to });
  if (storeSlug) params.set("store", storeSlug);
  return `/?${params.toString()}`;
}
