// AI layer boundary. Phase 1 uses a template-based mock; Phase 4 swaps in an
// LLM-backed implementation behind the same interface.

import type { AnalyzedReview, InsightItem, Store, StoreStatus } from "../types";
import type { DayCounts } from "../aggregate";
import type { DateRange } from "../date";
import type { Locale } from "../i18n";

export interface StoreSummaryInput {
  store: Store;
  /** A single day has from === to; `prevCount` covers the same-length period before. */
  range: DateRange;
  counts: DayCounts;
  prevCount: number;
  status: StoreStatus;
  positiveInsights: InsightItem[];
  negativeInsights: InsightItem[];
  criticalReviews: AnalyzedReview[];
}

export interface DailyBriefInput {
  range: DateRange;
  totalNew: number;
  prevTotalNew: number;
  stores: StoreSummaryInput[];
}

export interface Summarizer {
  /** Operations-oriented summary for one store over the period. */
  storeSummary(input: StoreSummaryInput, locale: Locale): string;
  /** Philippines-wide brief for the period, ordered by the PRD priority rules. */
  dailyBrief(input: DailyBriefInput, locale: Locale): string;
}
