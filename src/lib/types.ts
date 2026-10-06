// Domain types. Shapes mirror the planned Supabase tables so the mock
// data source can be swapped for the real one without touching the UI.

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
}

/** review_analysis */
export interface ReviewAnalysis {
  reviewId: string;
  sentiment: AiSentiment;
  sentimentScore: number; // -1..1
  topics: TopicMention[];
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
  topic: TopicKey;
  mentions: number; // on the selected date
  mentions7d: number; // last 7 days including the selected date
}

/** daily_store_summary */
export interface DailyStoreSummary {
  date: string;
  storeId: string;
  newReviewCount: number;
  avgRating: number | null;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  criticalCount: number;
  status: StoreStatus;
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
  date: string;
  compareDate: string;
  generatedAt: string | null; // ISO; null if the daily run has not completed
  minDate: string;
  maxDate: string;
  global: GlobalKpis;
  brief: string;
  stores: StoreRow[];
  selected: StoreDetail | null;
  /** All reviews of the date across stores, for the feed's "All stores" scope */
  allReviews: AnalyzedReview[];
}
