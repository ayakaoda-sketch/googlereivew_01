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
import { addDays, dateRange } from "../../date";
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

function weekOf(store: Store, date: string): AnalyzedReview[] {
  return dateRange(date, 7).flatMap((d) => reviewsFor(store, d));
}

function summaryInput(store: Store, date: string): StoreSummaryInput {
  const today = reviewsFor(store, date);
  const week = weekOf(store, date);
  const counts = countDay(today);
  const positiveInsights = buildInsights(today, week, "positive");
  const negativeInsights = buildInsights(today, week, "negative");
  return {
    store,
    date,
    counts,
    prevCount: reviewsFor(store, addDays(date, -1)).length,
    status: deriveStatus(counts, negativeInsights),
    positiveInsights,
    negativeInsights,
    criticalReviews: sortForFeed(today.filter((r) => isCriticalRating(r.rating))),
  };
}

function toDailySummary(input: StoreSummaryInput): DailyStoreSummary {
  return {
    date: input.date,
    storeId: input.store.id,
    ...input.counts,
    status: input.status,
    aiSummary: summarizer.storeSummary(input),
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

  async getDashboard(date, storeSlug) {
    const compareDate = addDays(date, -1);
    const stores = activeStores();

    const inputs = stores.map((s) => summaryInput(s, date));
    const rows: StoreRow[] = stores.map((store, i) => ({
      store,
      today: toDailySummary(inputs[i]),
      prev: toDailySummary(summaryInput(store, compareDate)),
      snapshot: snapshot(store, date),
      prevSnapshot: snapshot(store, compareDate),
    }));
    rows.sort(
      (a, b) =>
        b.today.newReviewCount - a.today.newReviewCount || a.store.sortOrder - b.store.sortOrder,
    );

    const allToday = stores.flatMap((s) => reviewsFor(s, date));
    const allPrev = stores.flatMap((s) => reviewsFor(s, compareDate));
    const global = buildGlobalKpis(allToday, allPrev);

    const defaultRow = [...rows].sort(
      (a, b) => severity[a.today.status] - severity[b.today.status],
    )[0];
    const selectedRow = rows.find((r) => r.store.slug === storeSlug) ?? defaultRow;

    let selected: DashboardData["selected"] = null;
    if (selectedRow) {
      const { store } = selectedRow;
      const reviews = sortForFeed(reviewsFor(store, date));
      selected = {
        store,
        today: selectedRow.today,
        prev: selectedRow.prev,
        snapshot: selectedRow.snapshot,
        prevSnapshot: selectedRow.prevSnapshot,
        reviews,
        criticalReviews: reviews.filter((r) => isCriticalRating(r.rating)),
        trend: buildTrend(dateRange(date, 7), weekOf(store, date)),
      };
    }

    return {
      date,
      compareDate,
      generatedAt: new Date(`${addDays(date, 1)}T06:12:00+08:00`).toISOString(),
      minDate: MOCK_START_DATE,
      maxDate: latestReviewDate(),
      global,
      brief: summarizer.dailyBrief({
        date,
        totalNew: global.newReviews,
        prevTotalNew: global.prevNewReviews,
        stores: inputs,
      }),
      stores: rows,
      selected,
      allReviews: sortForFeed(allToday),
    };
  },
};
