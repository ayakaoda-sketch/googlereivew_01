// Assembles DashboardData from raw per-day reviews and cumulative snapshots.
// Shared by every data source, so mock and real data render identically.

import {
  buildGlobalKpis,
  buildInsights,
  buildTrend,
  countDay,
  deriveStatus,
  isCriticalRating,
  sortForFeed,
} from "../aggregate";
import { mockSummarizer } from "../ai/mock-summarizer";
import type { StoreSummaryInput } from "../ai/summarizer";
import { addDays, dateRange, datesIn, previousRange, rangeDays, type DateRange } from "../date";
import type { Locale } from "../i18n";
import type {
  AnalyzedReview,
  DailyStoreSummary,
  DashboardData,
  Store,
  StoreRow,
  StoreSnapshot,
} from "../types";

export interface DashboardInput {
  /** Active stores, in display order. */
  stores: Store[];
  reviewsFor(store: Store, date: string): AnalyzedReview[];
  /** Google cumulative rating as of the end of `date`. */
  snapshot(store: Store, date: string): StoreSnapshot | null;
  minDate: string;
  maxDate: string;
  generatedAt: string | null;
}

const summarizer = mockSummarizer;
const severity = { critical: 0, watch: 1, good: 2 } as const;

/** The period widened to at least the trailing 7 days, for recurring-issue detection. */
function insightWindow(range: DateRange): DateRange {
  const weekStart = addDays(range.to, -6);
  return { from: weekStart < range.from ? weekStart : range.from, to: range.to };
}

export function buildDashboard(
  input: DashboardInput,
  range: DateRange,
  storeSlug: string | undefined,
  locale: Locale,
): DashboardData {
  const { stores, reviewsFor, snapshot } = input;
  const reviewsIn = (store: Store, r: DateRange) => datesIn(r).flatMap((d) => reviewsFor(store, d));

  const summaryInput = (store: Store, r: DateRange): StoreSummaryInput => {
    const current = reviewsIn(store, r);
    const window = reviewsIn(store, insightWindow(r));
    const counts = countDay(current);
    const positiveInsights = buildInsights(current, window, "positive");
    const negativeInsights = buildInsights(current, window, "negative");
    return {
      store,
      range: r,
      counts,
      prevCount: reviewsIn(store, previousRange(r)).length,
      status: deriveStatus(counts, negativeInsights),
      positiveInsights,
      negativeInsights,
      criticalReviews: sortForFeed(current.filter((rv) => isCriticalRating(rv.rating))),
    };
  };

  const toDailySummary = (s: StoreSummaryInput): DailyStoreSummary => ({
    date: s.range.to,
    storeId: s.store.id,
    ...s.counts,
    status: s.status,
    aiSummary: summarizer.storeSummary(s, locale),
    positiveInsights: s.positiveInsights,
    negativeInsights: s.negativeInsights,
  });

  const compareRange = previousRange(range);
  const inputs = stores.map((s) => summaryInput(s, range));
  const rows: StoreRow[] = stores.map((store, i) => ({
    store,
    today: toDailySummary(inputs[i]),
    prev: toDailySummary(summaryInput(store, compareRange)),
    snapshot: snapshot(store, range.to),
    prevSnapshot: snapshot(store, compareRange.to),
  }));
  // Fixed order from the stores tab's sort_order, so cards don't move between days.
  rows.sort((a, b) => a.store.sortOrder - b.store.sortOrder);

  const allCurrent = stores.flatMap((s) => reviewsIn(s, range));
  const allPrev = stores.flatMap((s) => reviewsIn(s, compareRange));
  const global = buildGlobalKpis(allCurrent, allPrev);

  const defaultRow = [...rows].sort((a, b) => severity[a.today.status] - severity[b.today.status])[0];
  const selectedRow = rows.find((r) => r.store.slug === storeSlug) ?? defaultRow;

  let selected: DashboardData["selected"] = null;
  if (selectedRow) {
    const { store } = selectedRow;
    const reviews = sortForFeed(reviewsIn(store, range));
    // Show at least a week of context around a short period.
    const trendDates = dateRange(range.to, Math.max(7, rangeDays(range)));
    selected = {
      store,
      today: selectedRow.today,
      prev: selectedRow.prev,
      snapshot: selectedRow.snapshot,
      prevSnapshot: selectedRow.prevSnapshot,
      reviews,
      criticalReviews: reviews.filter((r) => isCriticalRating(r.rating)),
      trend: buildTrend(trendDates, reviewsIn(store, { from: trendDates[0], to: range.to })),
    };
  }

  return {
    range,
    compareRange,
    generatedAt: input.generatedAt,
    minDate: input.minDate,
    maxDate: input.maxDate,
    global,
    brief: summarizer.dailyBrief(
      { range, totalNew: global.newReviews, prevTotalNew: global.prevNewReviews, stores: inputs },
      locale,
    ),
    stores: rows,
    selected,
    allReviews: sortForFeed(allCurrent),
  };
}
