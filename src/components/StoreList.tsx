"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatRangeShort, type DateRange } from "@/lib/date";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { Brand, StoreRow } from "@/lib/types";
import { dashboardHref } from "@/lib/url";
import { BRAND_LABEL, Delta } from "./ui";

/** Card background per brand: light red for Wolhwa Galbi, light orange for KODOKODO. */
const CARD_BG: Record<Brand, string> = {
  WOLHWA_GALBI: "bg-brand-wolhwa hover:bg-brand-wolhwa-hover",
  KODOKODO: "bg-brand-kodo hover:bg-brand-kodo-hover",
};

/** New reviews of the period per star rating, 5★ first; filled stars show the rating. */
function StarBreakdown({
  counts,
  label,
}: {
  counts: [number, number, number, number, number];
  label: (stars: number) => string;
}) {
  return (
    <ul className="mt-1 space-y-px text-[11px] leading-tight">
      {[5, 4, 3, 2, 1].map((stars) => (
        <li key={stars} className="flex items-center justify-between gap-2">
          <span aria-label={label(stars)} className="tracking-tight">
            <span className={stars <= 2 ? "text-crit" : "text-warn-dot"}>{"★".repeat(stars)}</span>
            <span className="text-line">{"★".repeat(5 - stars)}</span>
          </span>
          <span className={`tabular-nums ${counts[stars - 1] > 0 ? "text-ink" : "text-muted"}`}>
            {counts[stars - 1]}
          </span>
        </li>
      ))}
    </ul>
  );
}

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
  range,
  selectedSlug,
  locale,
}: {
  rows: StoreRow[];
  range: DateRange;
  selectedSlug?: string;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  // The selected store lives in the URL (?store=), shared with the review feed's store picker.
  const shownRow = rows.find((r) => r.store.slug === selectedSlug);
  const visible = shownRow ? [shownRow] : rows;
  const overall = overallCumulative(visible);

  const tabs = [
    { key: "all", label: `${t.filterAll} ${rows.length}` },
    ...rows.map((r) => ({ key: r.store.slug, label: r.store.shortName })),
  ];
  const tabKey = shownRow ? shownRow.store.slug : "all";
  const choose = (key: string) =>
    router.replace(dashboardHref(range, key === "all" ? undefined : key), { scroll: false });

  return (
    <nav aria-label={t.stores}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{t.stores}</h2>
          <div
            role="group"
            aria-label={t.stores}
            className="flex flex-wrap gap-0.5 rounded-lg border border-line bg-surface p-0.5 text-xs"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-pressed={tabKey === tab.key}
                onClick={() => choose(tab.key)}
                className={`rounded-md px-2.5 py-1 font-medium ${
                  tabKey === tab.key ? "bg-ink text-surface" : "text-ink-2 hover:bg-surface-2"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {overall && (
          <p className="text-xs text-ink-2">
            {shownRow ? t.storeCumulative(shownRow.store.shortName) : t.allStoresCumulative}{" "}
            <span className="font-semibold tabular-nums text-ink">{overall.avg.toFixed(2)} ★</span>
            <span className="text-muted">
              {" "}
              · {overall.total.toLocaleString("en-US")} {t.googleReviews}
            </span>
          </p>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
        {visible.map(({ store, today, snapshot, prevSnapshot }) => {
          const selected = store.slug === selectedSlug;
          const cumulativeDelta =
            snapshot && prevSnapshot ? snapshot.googleAvgRating - prevSnapshot.googleAvgRating : null;
          return (
            <li key={store.id} className="min-w-0">
              <Link
                // Clicking the selected store again clears the review-feed filter.
                href={dashboardHref(range, selected ? undefined : store.slug)}
                scroll={false}
                aria-current={selected ? "true" : undefined}
                className={`flex h-full flex-col rounded-xl border p-2.5 transition-colors ${CARD_BG[store.brand]} ${
                  selected ? "border-accent-ring ring-2 ring-accent-ring/25" : "border-line"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-muted">
                    {BRAND_LABEL[store.brand]}
                  </div>
                  <div className="truncate text-sm font-bold">{store.shortName}</div>
                </div>

                <div className="mt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-semibold tabular-nums">
                      {snapshot ? snapshot.googleAvgRating.toFixed(2) : "–"}{" "}
                      <span className="text-muted">★</span>
                    </span>
                    {/* One day rarely moves a ~2,000-review average; hide a ±0.00 that says nothing. */}
                    {cumulativeDelta !== null && Math.abs(cumulativeDelta) >= 0.005 && (
                      <span className="text-xs text-muted">
                        (<Delta value={cumulativeDelta} digits={2} goodWhenUp />)
                      </span>
                    )}
                  </div>
                  <div className="text-xs tabular-nums text-ink-2">
                    {snapshot
                      ? `(${t.reviewsCount(snapshot.googleTotalReviews.toLocaleString("en-US"))})`
                      : t.noData}
                  </div>
                </div>

                <div className="mt-2 border-t border-line pt-1.5">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-muted">
                    {t.newInPeriod(formatRangeShort(range, locale))}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold tabular-nums">
                    +{today.newReviewCount}
                    <span className="ml-1 text-xs font-normal text-muted">{t.reviewsWord}</span>
                  </div>
                  <div className={`text-[11px] tabular-nums text-crit ${today.criticalCount > 0 ? "font-semibold" : ""}`}>
                    {t.lowRatingCount(today.criticalCount)}
                  </div>
                  <StarBreakdown counts={today.ratingCounts} label={t.starsAria} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
