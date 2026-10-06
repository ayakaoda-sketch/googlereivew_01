import Link from "next/link";
import type { StoreRow } from "@/lib/types";
import { dashboardHref } from "@/lib/url";
import { BrandBadge, Delta, StatusBadge, formatRating } from "./ui";

/** Review-count-weighted Google rating across all stores. */
function overallCumulative(rows: StoreRow[]): { avg: number; total: number } | null {
  let sum = 0;
  let total = 0;
  for (const { snapshot } of rows) {
    if (!snapshot) continue;
    sum += snapshot.googleAvgRating * snapshot.googleTotalReviews;
    total += snapshot.googleTotalReviews;
  }
  return total > 0 ? { avg: sum / total, total } : null;
}

export function StoreList({
  rows,
  date,
  selectedSlug,
}: {
  rows: StoreRow[];
  date: string;
  selectedSlug?: string;
}) {
  const overall = overallCumulative(rows);

  return (
    <nav aria-label="Stores">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Stores · {rows.length}
        </h2>
        {overall && (
          <p className="text-xs text-ink-2">
            All stores cumulative{" "}
            <span className="font-semibold tabular-nums text-ink">{overall.avg.toFixed(2)} ★</span>
            <span className="text-muted"> · {overall.total.toLocaleString("en-US")} Google reviews</span>
          </p>
        )}
      </div>

      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] lg:overflow-visible lg:px-0">
        {rows.map(({ store, today, prev, snapshot, prevSnapshot }) => {
          const selected = store.slug === selectedSlug;
          const cumulativeDelta =
            snapshot && prevSnapshot ? snapshot.googleAvgRating - prevSnapshot.googleAvgRating : null;
          return (
            <li key={store.id} className="min-w-[220px] lg:min-w-0">
              <Link
                href={dashboardHref(date, store.slug)}
                aria-current={selected ? "true" : undefined}
                className={`flex h-full flex-col rounded-xl border p-3 transition-colors ${
                  selected
                    ? "border-accent-ring bg-surface ring-2 ring-accent-ring/25"
                    : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{store.shortName}</div>
                    <div className="mt-1">
                      <BrandBadge brand={store.brand} />
                    </div>
                  </div>
                  <StatusBadge status={today.status} />
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xl font-semibold tabular-nums">
                    +{today.newReviewCount}
                    <span className="ml-1 text-xs font-normal text-muted">new</span>
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {formatRating(today.avgRating)} <span className="text-muted">★</span>
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-ink-2">
                    <span className="text-good">{today.positiveCount} pos</span>
                    {" · "}
                    <span className={today.negativeCount > 0 ? "font-semibold text-crit" : ""}>
                      {today.negativeCount} neg
                    </span>
                  </span>
                  <Delta value={today.newReviewCount - prev.newReviewCount} suffix="vs prev" />
                </div>

                <div className="mt-3 border-t border-line pt-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Cumulative (Google)
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-2">
                    <span className="text-base font-semibold tabular-nums">
                      {snapshot ? snapshot.googleAvgRating.toFixed(2) : "–"}{" "}
                      <span className="text-muted">★</span>
                    </span>
                    {/* One day rarely moves a ~2,000-review average; hide a ±0.00 that says nothing. */}
                    {cumulativeDelta !== null && Math.abs(cumulativeDelta) >= 0.005 && (
                      <span className="text-xs">
                        <Delta value={cumulativeDelta} digits={2} goodWhenUp />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] tabular-nums text-ink-2">
                    {snapshot ? (
                      <>
                        {snapshot.googleTotalReviews.toLocaleString("en-US")} reviews
                        {prevSnapshot && (
                          <span className="text-muted">
                            {" "}
                            · +{snapshot.googleTotalReviews - prevSnapshot.googleTotalReviews}
                          </span>
                        )}
                      </>
                    ) : (
                      "No data"
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
