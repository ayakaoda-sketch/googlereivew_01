// Domain types. Shapes mirror the planned Supabase tables so the mock
// data source can be swapped for the real one without touching the UI.

import type { DateRange } from "./date";

export type Brand = "WOLHWA_GALBI" | "KODOKODO";

/** stores */
export interface Store {
  id: string;
  slug: string;
  brand: Brand;
  storeName: string;
  shortName: string;
  googleLocationId: string | null;
  address: string;
  active: boolean;
  sortOrder: number;
}

export type TopicKey =
  | "food_quality"
  | "flavor"
  | "meat_quality"
  | "service"
  | "staff"
  | "waiting_time"
  | "cleanliness"
  | "price_value"
  | "promotion"
  | "portion"
  | "side_dishes"
  | "soup"
  | "atmosphere"
  | "accessibility"
  | "other";

/** reviews */
export interface Review {
  id: string;
  googleReviewId: string;
  storeId: string;
  reviewerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  reviewText: string | null;
  googleCreatedAt: string; // ISO, UTC
  localReviewDate: string; // YYYY-MM-DD, Asia/Manila
  updatedAt: string;
}

export type AiSentiment = "positive" | "neutral" | "negative" | "mixed";
export type Polarity = "positive" | "negative";

/** review_topics — one review can carry several topic mentions */
export interface TopicMention {
  topic: TopicKey;
  polarity: Polarity;
  /** Short insight label, e.g. "Friendly staff", "Flavor too mild" */
  label: string;
  /** Korean version of `label`, e.g. "친절한 직원" */
  labelKo: string;
}

/** review_analysis */
export interface ReviewAnalysis {
  reviewId: string;
  sentiment: AiSentiment;
  sentimentScore: number; // -1..1
  topics: TopicMention[];
  summaryEn: string | null;
  summaryKo: string | null;
  isCritical: boolean;
  analyzedAt: string;
}

export interface AnalyzedReview extends Review {
  analysis: ReviewAnalysis | null; // null when there is no text to analyze
}

/** store_daily_snapshot — Google cumulative rating per day */
export interface StoreSnapshot {
  date: string;
  storeId: string;
  googleAvgRating: number;
  googleTotalReviews: number;
}

export type StoreStatus = "good" | "watch" | "critical";

export interface InsightItem {
  label: string;
  labelKo: string;
  topic: TopicKey;
  mentions: number; // in the selected period
  mentions7d: number; // selected period, widened to at least the last 7 days
}

/** daily_store_summary (aggregated over the period for multi-day ranges) */
export interface DailyStoreSummary {
  /** Last day of the summarized period. */
  date: string;
  storeId: string;
  newReviewCount: number;
  avgRating: number | null;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  criticalCount: number;
  status: StoreStatus;
  /** In the dashboard's requested locale. */
  aiSummary: string;
  positiveInsights: InsightItem[];
  negativeInsights: InsightItem[];
}

export interface TrendPoint {
  date: string;
  newReviews: number;
  avgRating: number | null;
}

export interface GlobalKpis {
  newReviews: number;
  prevNewReviews: number;
  avgRating: number | null;
  prevAvgRating: number | null;
  positive: number;
  neutral: number;
  negative: number;
}

export interface StoreRow {
  store: Store;
  today: DailyStoreSummary;
  prev: DailyStoreSummary;
  snapshot: StoreSnapshot | null;
  prevSnapshot: StoreSnapshot | null;
}

export interface StoreDetail {
  store: Store;
  today: DailyStoreSummary;
  prev: DailyStoreSummary;
  snapshot: StoreSnapshot | null;
  prevSnapshot: StoreSnapshot | null;
  reviews: AnalyzedReview[];
  criticalReviews: AnalyzedReview[];
  trend: TrendPoint[];
}

export interface DashboardData {
  /** Selected period; a single day has from === to. */
  range: DateRange;
  /** Same-length period right before `range`. */
  compareRange: DateRange;
  generatedAt: string | null; // ISO; null if the daily run has not completed
  minDate: string;
  maxDate: string;
  global: GlobalKpis;
  brief: string;
  stores: StoreRow[];
  selected: StoreDetail | null;
  /** All reviews of the period across stores, for the feed's "All stores" scope */
  allReviews: AnalyzedReview[];
}
