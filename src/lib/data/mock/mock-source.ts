import {
  buildGlobalKpis,
  buildInsights,
  buildTrend,
  countDay,
  deriveStatus,
  isCriticalRating,
  sortForFeed,
} from "../../aggregate";
import { mockSummarizer } from "../../ai/mock-summarizer";
import type { StoreSummaryInput } from "../../ai/summarizer";
import { addDays, dateRange, datesIn, previousRange, rangeDays, type DateRange } from "../../date";
import type { Locale } from "../../i18n";
import type {
  AnalyzedReview,
  DailyStoreSummary,
  DashboardData,
  Store,
  StoreRow,
  StoreSnapshot,
} from "../../types";
import { latestReviewDate, type DataSource } from "../source";
import { MOCK_START_DATE, generateReviews } from "./generate";
import { BASELINE, MOCK_STORES } from "./stores";

const summarizer = mockSummarizer;
const reviewCache = new Map<string, AnalyzedReview[]>();

function activeStores(): Store[] {
  return MOCK_STORES.filter((s) => s.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

function reviewsFor(store: Store, date: string): AnalyzedReview[] {
  if (date < MOCK_START_DATE || date > latestReviewDate()) return [];
  const key = `${store.id}|${date}`;
  let reviews = reviewCache.get(key);
  if (!reviews) {
    reviews = generateReviews(store, date);
    reviewCache.set(key, reviews);
  }
  return reviews;
}

function reviewsIn(store: Store, range: DateRange): AnalyzedReview[] {
  return datesIn(range).flatMap((d) => reviewsFor(store, d));
}

/** The period widened to at least the trailing 7 days, for recurring-issue detection. */
function insightWindow(range: DateRange): DateRange {
  const weekStart = addDays(range.to, -6);
  return { from: weekStart < range.from ? weekStart : range.from, to: range.to };
}

function summaryInput(store: Store, range: DateRange): StoreSummaryInput {
  const current = reviewsIn(store, range);
  const window = reviewsIn(store, insightWindow(range));
  const counts = countDay(current);
  const positiveInsights = buildInsights(current, window, "positive");
  const negativeInsights = buildInsights(current, window, "negative");
  return {
    store,
    range,
    counts,
    prevCount: reviewsIn(store, previousRange(range)).length,
    status: deriveStatus(counts, negativeInsights),
    positiveInsights,
    negativeInsights,
    criticalReviews: sortForFeed(current.filter((r) => isCriticalRating(r.rating))),
  };
}

function toDailySummary(input: StoreSummaryInput, locale: Locale): DailyStoreSummary {
  return {
    date: input.range.to,
    storeId: input.store.id,
    ...input.counts,
    status: input.status,
    aiSummary: summarizer.storeSummary(input, locale),
    positiveInsights: input.positiveInsights,
    negativeInsights: input.negativeInsights,
  };
}

function snapshot(store: Store, date: string): StoreSnapshot | null {
  if (date < MOCK_START_DATE) return null;
  const base = BASELINE[store.id] ?? { avg: 0, count: 0 };
  let sum = base.avg * base.count;
  let count = base.count;
  for (let d = MOCK_START_DATE; d <= date; d = addDays(d, 1)) {
    for (const r of reviewsFor(store, d)) {
      sum += r.rating;
      count++;
    }
  }
  return {
    date,
    storeId: store.id,
    googleAvgRating: count ? sum / count : 0,
    googleTotalReviews: count,
  };
}

const severity = { critical: 0, watch: 1, good: 2 } as const;

export const mockDataSource: DataSource = {
  async minDate() {
    return MOCK_START_DATE;
  },

  async getDashboard(range, storeSlug, locale) {
    const compareRange = previousRange(range);
    const stores = activeStores();

    const inputs = stores.map((s) => summaryInput(s, range));
    const rows: StoreRow[] = stores.map((store, i) => ({
      store,
      today: toDailySummary(inputs[i], locale),
      prev: toDailySummary(summaryInput(store, compareRange), locale),
      snapshot: snapshot(store, range.to),
      prevSnapshot: snapshot(store, compareRange.to),
    }));
    rows.sort(
      (a, b) =>
        b.today.newReviewCount - a.today.newReviewCount || a.store.sortOrder - b.store.sortOrder,
    );

    const allCurrent = stores.flatMap((s) => reviewsIn(s, range));
    const allPrev = stores.flatMap((s) => reviewsIn(s, compareRange));
    const global = buildGlobalKpis(allCurrent, allPrev);

    const defaultRow = [...rows].sort(
      (a, b) => severity[a.today.status] - severity[b.today.status],
    )[0];
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
      generatedAt: new Date(`${addDays(range.to, 1)}T06:12:00+08:00`).toISOString(),
      minDate: MOCK_START_DATE,
      maxDate: latestReviewDate(),
      global,
      brief: summarizer.dailyBrief(
        {
          range,
          totalNew: global.newReviews,
          prevTotalNew: global.prevNewReviews,
          stores: inputs,
        },
        locale,
      ),
      stores: rows,
      selected,
      allReviews: sortForFeed(allCurrent),
    };
  },
};
