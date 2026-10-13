// Spreadsheet layout. No imports, so the setup scripts can load this file too.

/** Tab name → header row (row 1, from column A). */
export const TABS = {
  stores: ["id", "slug", "brand", "store_name", "short_name", "google_location_id", "address", "active", "sort_order"],
  reviews: [
    "review_id", "store_id", "rating", "review_text", "reviewer_name", "created_at", "local_date",
    "sentiment", "topics", "summary_en", "summary_ko",
  ],
  snapshots: ["date", "store_id", "avg_rating", "total_reviews", "synced_at"],
} as const;

export type TabName = keyof typeof TABS;

/** Columns of `reviews` that come from Google; the rest are filled by AI analysis. */
export const REVIEW_SOURCE_COLUMNS = 7;

/** Spreadsheet column letter for a 0-based index (A–Z is enough here). */
export function columnLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
