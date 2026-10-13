import { readTab } from "../../google/sheets";
import type { AiSentiment, AnalyzedReview, Brand, Review, Store, StoreSnapshot, TopicMention } from "../../types";
import { buildDashboard } from "../build";
import { latestReviewDate, type DataSource } from "../source";

const BRANDS: Brand[] = ["WOLHWA_GALBI", "KODOKODO"];
const SENTIMENTS: AiSentiment[] = ["positive", "neutral", "mixed", "negative"];
const CACHE_MS = 5 * 60_000;

/** Every row of the stores tab, including inactive ones; malformed rows are skipped. */
export function parseStores(rows: Record<string, string>[]): Store[] {
  return rows.flatMap((r) => {
    if (!r.id || !BRANDS.includes(r.brand as Brand)) return [];
    return [
      {
        id: r.id,
        slug: r.slug || r.id,
        brand: r.brand as Brand,
        storeName: r.store_name || r.short_name,
        shortName: r.short_name || r.store_name,
        googleLocationId: r.google_location_id || null,
        address: r.address,
        active: r.active.toUpperCase() !== "FALSE",
        sortOrder: Number(r.sort_order) || 0,
      },
    ];
  });
}

function parseReview(r: Record<string, string>): AnalyzedReview | null {
  const rating = Number(r.rating);
  if (!r.review_id || !(rating >= 1 && rating <= 5)) return null;
  const sentiment = SENTIMENTS.find((s) => s === r.sentiment);
  let topics: TopicMention[] = [];
  try {
    topics = r.topics ? JSON.parse(r.topics) : [];
  } catch {
    // Leave topics empty if the cell was edited into something that is not JSON.
  }
  return {
    id: r.review_id,
    googleReviewId: r.review_id,
    storeId: r.store_id,
    reviewerName: r.reviewer_name,
    rating: rating as Review["rating"],
    reviewText: r.review_text || null,
    googleCreatedAt: r.created_at,
    localReviewDate: r.local_date,
    updatedAt: r.created_at,
    // Filled in once AI analysis writes the sentiment column.
    analysis: sentiment
      ? {
          reviewId: r.review_id,
          sentiment,
          sentimentScore: 0,
          topics,
          summaryEn: r.summary_en || null,
          summaryKo: r.summary_ko || null,
          isCritical: rating <= 2,
          analyzedAt: "",
        }
      : null,
  };
}

/** Running totals per store by date, so the cumulative rating on any day is one lookup. */
interface Cumulative {
  dates: string[];
  counts: number[];
  sums: number[];
}

interface SheetData {
  stores: Store[];
  byStoreDate: Map<string, AnalyzedReview[]>;
  cumulative: Map<string, Cumulative>;
  minDate: string | null;
  syncedAt: string | null;
}

async function load(): Promise<SheetData> {
  const [storeRows, reviewRows, snapshotRows] = await Promise.all([
    readTab("stores"),
    readTab("reviews"),
    readTab("snapshots"),
  ]);

  const reviews = reviewRows.map(parseReview).filter((r): r is AnalyzedReview => r !== null);
  reviews.sort((a, b) => a.localReviewDate.localeCompare(b.localReviewDate));

  const byStoreDate = new Map<string, AnalyzedReview[]>();
  const cumulative = new Map<string, Cumulative>();
  for (const r of reviews) {
    const key = `${r.storeId}|${r.localReviewDate}`;
    byStoreDate.set(key, [...(byStoreDate.get(key) ?? []), r]);

    let c = cumulative.get(r.storeId);
    if (!c) cumulative.set(r.storeId, (c = { dates: [], counts: [], sums: [] }));
    const last = c.dates.length - 1;
    if (c.dates[last] === r.localReviewDate) {
      c.counts[last]++;
      c.sums[last] += r.rating;
    } else {
      c.dates.push(r.localReviewDate);
      c.counts.push((c.counts[last] ?? 0) + 1);
      c.sums.push((c.sums[last] ?? 0) + r.rating);
    }
  }

  const syncedAt = snapshotRows.map((s) => s.synced_at).filter(Boolean).sort().at(-1) ?? null;
  return {
    stores: parseStores(storeRows),
    byStoreDate,
    cumulative,
    minDate: reviews[0]?.localReviewDate ?? null,
    syncedAt,
  };
}

// Kept on globalThis: route handlers and pages can load separate copies of this
// module, and the sync route must be able to clear the cache the page reads.
const store = globalThis as typeof globalThis & {
  __sheetsCache?: { at: number; data: Promise<SheetData> } | null;
};

function sheetData(): Promise<SheetData> {
  const cached = store.__sheetsCache;
  if (cached && Date.now() - cached.at <= CACHE_MS) return cached.data;
  const data = load();
  store.__sheetsCache = { at: Date.now(), data };
  data.catch(() => (store.__sheetsCache = null)); // Do not keep a failed load around.
  return data;
}

/** Drops the cached sheet contents, e.g. right after a sync wrote new rows. */
export function invalidateSheetsCache(): void {
  store.__sheetsCache = null;
}

function snapshotFrom(c: Cumulative | undefined, storeId: string, date: string): StoreSnapshot | null {
  if (!c) return null;
  // Last index whose date is on or before `date`.
  let lo = 0;
  let hi = c.dates.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (c.dates[mid] <= date) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (found < 0) return null;
  return {
    date,
    storeId,
    googleAvgRating: c.sums[found] / c.counts[found],
    googleTotalReviews: c.counts[found],
  };
}

export const sheetsDataSource: DataSource = {
  async minDate() {
    return (await sheetData()).minDate ?? latestReviewDate();
  },

  async getDashboard(range, storeSlug, locale) {
    const data = await sheetData();
    return buildDashboard(
      {
        stores: data.stores.filter((s) => s.active).sort((a, b) => a.sortOrder - b.sortOrder),
        reviewsFor: (store, date) => data.byStoreDate.get(`${store.id}|${date}`) ?? [],
        snapshot: (store, date) => snapshotFrom(data.cumulative.get(store.id), store.id, date),
        minDate: data.minDate ?? latestReviewDate(),
        maxDate: latestReviewDate(),
        generatedAt: data.syncedAt,
      },
      range,
      storeSlug,
      locale,
    );
  },
};
