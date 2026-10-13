import { addDays } from "../../date";
import type { AnalyzedReview, Store, StoreSnapshot } from "../../types";
import { buildDashboard } from "../build";
import { latestReviewDate, type DataSource } from "../source";
import { MOCK_START_DATE, generateReviews } from "./generate";
import { BASELINE, MOCK_STORES } from "./stores";

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

export const mockDataSource: DataSource = {
  async minDate() {
    return MOCK_START_DATE;
  },

  async getDashboard(range, storeSlug, locale) {
    return buildDashboard(
      {
        stores: activeStores(),
        reviewsFor,
        snapshot,
        minDate: MOCK_START_DATE,
        maxDate: latestReviewDate(),
        generatedAt: new Date(`${addDays(range.to, 1)}T06:12:00+08:00`).toISOString(),
      },
      range,
      storeSlug,
      locale,
    );
  },
};
