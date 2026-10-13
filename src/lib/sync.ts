// Pulls Google reviews of every active store into the spreadsheet.
// First run backfills all reviews; later runs stop at reviews already stored.

import { invalidateSheetsCache, parseStores } from "./data/sheets/sheets-source";
import { REVIEW_SOURCE_COLUMNS, TABS, columnLetter } from "./data/sheets/schema";
import { toManilaDate, todayManila } from "./date";
import { reviewPages, starsOf, type GbpReview } from "./google/business-profile";
import { appendRows, readTab, updateRanges } from "./google/sheets";

export interface StoreSyncResult {
  store: string;
  added: number;
  updated: number;
  googleTotal: number | null;
  googleAverage: number | null;
  error?: string;
}

export interface SyncResult {
  syncedAt: string;
  stores: StoreSyncResult[];
}

type Row = (string | number)[];

/** The Google-sourced columns of a reviews row (A–G); AI columns are left alone. */
function sourceRow(storeId: string, r: GbpReview, stars: number): Row {
  return [
    r.reviewId,
    storeId,
    stars,
    r.comment ?? "",
    r.reviewer?.displayName ?? "",
    r.createTime,
    toManilaDate(r.createTime),
  ];
}

export async function syncReviews(): Promise<SyncResult> {
  const syncedAt = new Date().toISOString();
  const [storeRows, reviewRows, snapshotRows] = await Promise.all([
    readTab("stores"),
    readTab("reviews"),
    readTab("snapshots"),
  ]);
  const stores = parseStores(storeRows).filter((s) => s.active && s.googleLocationId);

  // review_id → sheet row number (header is row 1) and the values we would compare.
  const known = new Map(
    reviewRows.map((r, i) => [r.review_id, { rowNumber: i + 2, rating: r.rating, text: r.review_text }]),
  );

  const appends: Row[] = [];
  const updates: { range: string; values: Row[] }[] = [];
  const lastSourceColumn = columnLetter(REVIEW_SOURCE_COLUMNS - 1);

  const results = await Promise.all(
    stores.map(async (store): Promise<StoreSyncResult> => {
      const result: StoreSyncResult = {
        store: store.shortName,
        added: 0,
        updated: 0,
        googleTotal: null,
        googleAverage: null,
      };
      try {
        for await (const page of reviewPages(store.googleLocationId!)) {
          result.googleTotal ??= page.totalReviewCount ?? 0;
          result.googleAverage ??= page.averageRating ?? null;

          let changedOnPage = 0;
          for (const review of page.reviews ?? []) {
            const stars = starsOf(review);
            if (stars === null) continue;
            const row = sourceRow(store.id, review, stars);
            const existing = known.get(review.reviewId);
            if (!existing) {
              appends.push([...row, ...Array(TABS.reviews.length - row.length).fill("")]);
              result.added++;
              changedOnPage++;
            } else if (existing.rating !== String(stars) || existing.text !== (review.comment ?? "")) {
              updates.push({
                range: `reviews!A${existing.rowNumber}:${lastSourceColumn}${existing.rowNumber}`,
                values: [row],
              });
              result.updated++;
              changedOnPage++;
            }
          }
          // Newest updates come first, so a page with nothing new means the rest is already stored.
          if (changedOnPage === 0) break;
        }
      } catch (err) {
        result.error = err instanceof Error ? err.message : String(err);
      }
      return result;
    }),
  );

  await appendRows("reviews", appends);
  await updateRanges(updates);

  // One snapshot row per store per day: Google's own figures, kept as a record.
  const today = todayManila();
  const snapshotRowNumber = new Map(snapshotRows.map((s, i) => [`${s.date}|${s.store_id}`, i + 2]));
  const snapshotAppends: Row[] = [];
  const snapshotUpdates: { range: string; values: Row[] }[] = [];
  stores.forEach((store, i) => {
    const r = results[i];
    if (r.error || r.googleTotal === null) return;
    const row: Row = [today, store.id, r.googleAverage ?? "", r.googleTotal, syncedAt];
    const existing = snapshotRowNumber.get(`${today}|${store.id}`);
    if (existing) snapshotUpdates.push({ range: `snapshots!A${existing}:E${existing}`, values: [row] });
    else snapshotAppends.push(row);
  });
  await appendRows("snapshots", snapshotAppends);
  await updateRanges(snapshotUpdates);

  invalidateSheetsCache();
  return { syncedAt, stores: results };
}
