// AI layer boundary. Phase 1 uses a template-based mock; Phase 4 swaps in an
// LLM-backed implementation behind the same interface.

import type { AnalyzedReview, InsightItem, Store, StoreStatus } from "../types";
import type { DayCounts } from "../aggregate";

export interface StoreSummaryInput {
  store: Store;
  date: string;
  counts: DayCounts;
  prevCount: number;
  status: StoreStatus;
  positiveInsights: InsightItem[];
  negativeInsights: InsightItem[];
  criticalReviews: AnalyzedReview[];
}

export interface DailyBriefInput {
  date: string;
  totalNew: number;
  prevTotalNew: number;
  stores: StoreSummaryInput[];
}

export interface Summarizer {
  /** Korean, operations-oriented summary for one store/day. */
  storeSummary(input: StoreSummaryInput): string;
  /** Korean Philippines-wide brief, ordered by the PRD priority rules. */
  dailyBrief(input: DailyBriefInput): string;
}
