// Deterministic aggregation. Every number shown on the dashboard comes from
// here (later: SQL), never from the AI.

import type {
  AnalyzedReview,
  GlobalKpis,
  InsightItem,
  Polarity,
  StoreStatus,
  TopicKey,
  TrendPoint,
} from "./types";

export type RatingBucket = "positive" | "neutral" | "negative";

/** KPI sentiment is rating-based: 4–5 positive, 3 neutral, 1–2 negative. */
export function ratingBucket(rating: number): RatingBucket {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

export function isCriticalRating(rating: number): boolean {
  return rating <= 2;
}

export interface DayCounts {
  newReviewCount: number;
  avgRating: number | null;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  criticalCount: number;
  /** Reviews per star rating: index 0 is 1★, index 4 is 5★. */
  ratingCounts: [number, number, number, number, number];
}

export function countDay(reviews: AnalyzedReview[]): DayCounts {
  const counts: DayCounts = {
    newReviewCount: reviews.length,
    avgRating: average(reviews.map((r) => r.rating)),
    positiveCount: 0,
    neutralCount: 0,
    negativeCount: 0,
    criticalCount: 0,
    ratingCounts: [0, 0, 0, 0, 0],
  };
  for (const r of reviews) {
    counts[`${ratingBucket(r.rating)}Count`]++;
    counts.ratingCounts[r.rating - 1]++;
    if (isCriticalRating(r.rating)) counts.criticalCount++;
  }
  return counts;
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Groups topic mentions by insight label. `mentions` counts the selected day,
 * `mentions7d` the trailing week. Negative items that keep recurring float up.
 */
export function buildInsights(
  today: AnalyzedReview[],
  week: AnalyzedReview[],
  polarity: Polarity,
): InsightItem[] {
  const tally = (reviews: AnalyzedReview[]) => {
    const map = new Map<string, { topic: TopicKey; labelKo: string; count: number }>();
    for (const r of reviews) {
      for (const m of r.analysis?.topics ?? []) {
        if (m.polarity !== polarity) continue;
        const entry = map.get(m.label) ?? { topic: m.topic, labelKo: m.labelKo, count: 0 };
        entry.count++;
        map.set(m.label, entry);
      }
    }
    return map;
  };

  const todayMap = tally(today);
  const weekMap = tally(week);

  const items: InsightItem[] = [...todayMap.entries()].map(([label, v]) => ({
    label,
    labelKo: v.labelKo,
    topic: v.topic,
    mentions: v.count,
    mentions7d: weekMap.get(label)?.count ?? v.count,
  }));

  items.sort((a, b) =>
    polarity === "negative"
      ? b.mentions7d - a.mentions7d || b.mentions - a.mentions
      : b.mentions - a.mentions || b.mentions7d - a.mentions7d,
  );
  return items;
}

/** A negative label seen this many times in 7 days counts as recurring. */
export const RECURRING_THRESHOLD = 2;

export function deriveStatus(counts: DayCounts, negativeInsights: InsightItem[]): StoreStatus {
  if (counts.criticalCount > 0) return "critical";
  if (counts.neutralCount > 0) return "watch";
  if (negativeInsights.some((i) => i.mentions7d >= RECURRING_THRESHOLD)) return "watch";
  return "good";
}

export function buildTrend(dates: string[], reviews: AnalyzedReview[]): TrendPoint[] {
  return dates.map((date) => {
    const day = reviews.filter((r) => r.localReviewDate === date);
    return { date, newReviews: day.length, avgRating: average(day.map((r) => r.rating)) };
  });
}

export function buildGlobalKpis(today: AnalyzedReview[], prev: AnalyzedReview[]): GlobalKpis {
  const t = countDay(today);
  const p = countDay(prev);
  return {
    newReviews: t.newReviewCount,
    prevNewReviews: p.newReviewCount,
    avgRating: t.avgRating,
    prevAvgRating: p.avgRating,
    positive: t.positiveCount,
    neutral: t.neutralCount,
    negative: t.negativeCount,
  };
}

/** Feed order: lowest rating first, then newest. */
export function sortForFeed(reviews: AnalyzedReview[]): AnalyzedReview[] {
  return [...reviews].sort(
    (a, b) => a.rating - b.rating || b.googleCreatedAt.localeCompare(a.googleCreatedAt),
  );
}
