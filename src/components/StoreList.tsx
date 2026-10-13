"use client";

import Link from "next/link";
import { useState } from "react";
import { formatRangeShort, type DateRange } from "@/lib/date";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { Brand, StoreRow } from "@/lib/types";
import { dashboardHref } from "@/lib/url";
import { BRAND_LABEL, BrandBadge, Delta, StatusBadge, formatRating } from "./ui";

const BRANDS: Brand[] = ["WOLHWA_GALBI", "KODOKODO"];

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
  // Client state, so it survives the soft navigation when a store card is clicked.
  const [brand, setBrand] = useState<Brand | "all">("all");
  const visible = brand === "all" ? rows : rows.filter((r) => r.store.brand === brand);
  const overall = overallCumulative(visible);

  const tabs = [
    { key: "all" as const, label: t.filterAll, count: rows.length },
    ...BRANDS.map((b) => ({
      key: b,
      label: BRAND_LABEL[b],
      count: rows.filter((r) => r.store.brand === b).length,
    })).filter((tab) => tab.count > 0),
  ];

  return (
    <nav aria-label={t.stores}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{t.stores}</h2>
          <div role="group" aria-label={t.brand} className="flex rounded-lg border border-line bg-surface p-0.5 text-xs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-pressed={brand === tab.key}
                onClick={() => setBrand(tab.key)}
                className={`rounded-md px-2.5 py-1 font-medium ${
                  brand === tab.key ? "bg-ink text-surface" : "text-ink-2 hover:bg-surface-2"
                }`}
              >
                {tab.label} <span className="tabular-nums opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
        {overall && (
          <p className="text-xs text-ink-2">
            {brand === "all" ? t.allStoresCumulative : t.brandCumulative(BRAND_LABEL[brand])}{" "}
            <span className="font-semibold tabular-nums text-ink">{overall.avg.toFixed(2)} ★</span>
            <span className="text-muted">
              {" "}
              · {overall.total.toLocaleString("en-US")} {t.googleReviews}
            </span>
          </p>
        )}
      </div>

      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] lg:overflow-visible lg:px-0">
        {visible.map(({ store, today, prev, snapshot, prevSnapshot }) => {
          const selected = store.slug === selectedSlug;
          const cumulativeDelta =
            snapshot && prevSnapshot ? snapshot.googleAvgRating - prevSnapshot.googleAvgRating : null;
          return (
            <li key={store.id} className="min-w-[220px] lg:min-w-0">
              <Link
                // Clicking the selected store again clears the review-feed filter.
                href={dashboardHref(range, selected ? undefined : store.slug)}
                scroll={false}
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
                  <StatusBadge status={today.status} locale={locale} />
                </div>

                <div className="mt-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {t.cumulativeGoogle}
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-2">
                    <span className="text-xl font-semibold tabular-nums">
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
                  <div className="text-xs tabular-nums text-ink-2">
                    {snapshot
                      ? t.reviewsCount(snapshot.googleTotalReviews.toLocaleString("en-US"))
                      : t.noData}
                  </div>
                </div>

                <div className="mt-3 border-t border-line pt-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {t.newInPeriod(formatRangeShort(range, locale))}
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="text-base font-semibold tabular-nums">
                      +{today.newReviewCount}
                      <span className="ml-1 text-xs font-normal text-muted">{t.newShort}</span>
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatRating(today.avgRating)} <span className="text-muted">★</span>
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className={`tabular-nums text-crit ${today.criticalCount > 0 ? "font-semibold" : ""}`}>
                      {t.lowRatingCount(today.criticalCount)}
                    </span>
                    <Delta value={today.newReviewCount - prev.newReviewCount} suffix={t.vsPrev} />
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
