import type { ReactNode } from "react";
import { formatLong, formatRange, formatRangeShort, type DateRange } from "@/lib/date";
import { getDictionary, type Locale } from "@/lib/i18n";
import { topicLabel } from "@/lib/topics";
import type { AnalyzedReview, InsightItem, StoreDetail } from "@/lib/types";
import { ReviewFeed } from "./ReviewFeed";
import { TrendCharts } from "./TrendCharts";
import { BrandBadge, Card, Delta, SectionTitle, StatusBadge, Stars, formatRating } from "./ui";

function Kpi({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium text-muted">{label}</div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      {sub ? <div className="text-[11px]">{sub}</div> : null}
    </div>
  );
}

function InsightList({
  title,
  items,
  tone,
  empty,
  locale,
}: {
  title: string;
  items: InsightItem[];
  tone: "good" | "crit";
  empty: string;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.label} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone === "good" ? "bg-good" : "bg-crit-dot"}`}
                  />
                  <span className="font-medium">{locale === "ko" ? i.labelKo : i.label}</span>
                </div>
                <div className="pl-3.5 text-[11px] text-muted">{topicLabel(i.topic, locale)}</div>
              </div>
              <div className="shrink-0 text-right text-xs tabular-nums">
                <div className="text-ink-2">{t.mentions(i.mentions)}</div>
                {tone === "crit" && i.mentions7d > i.mentions && (
                  <div className="font-semibold text-crit">{t.mentionsIn7Days(i.mentions7d)}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CriticalReviews({
  reviews,
  storeName,
  single,
  locale,
}: {
  reviews: AnalyzedReview[];
  storeName: string;
  single: boolean;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  if (reviews.length === 0) {
    return (
      <Card>
        <SectionTitle>{t.criticalReviews}</SectionTitle>
        <p className="text-sm text-muted">{single ? t.noCriticalToday : t.noCriticalPeriod}</p>
      </Card>
    );
  }
  return (
    <section className="rounded-xl border border-crit-dot/40 bg-crit-soft p-4">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-crit">
        ■ {t.criticalHeading(reviews.length)}
      </h2>
      <ul className="space-y-3">
        {reviews.map((r) => {
          const summary = locale === "ko" ? r.analysis?.summaryKo : r.analysis?.summaryEn;
          return (
            <li key={r.id} className="rounded-lg bg-surface p-3">
              <div className="flex items-center gap-2 text-sm">
                <Stars rating={r.rating} locale={locale} />
                <span className="font-medium">{r.reviewerName}</span>
              </div>
              <blockquote className="mt-1 text-sm leading-relaxed">“{r.reviewText ?? t.noText}”</blockquote>
              <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-ink-2">
                <div>
                  <dt className="inline text-muted">{t.store} </dt>
                  <dd className="inline">{storeName}</dd>
                </div>
                <div>
                  <dt className="inline text-muted">{t.topic} </dt>
                  <dd className="inline">
                    {[
                      ...new Set(
                        r.analysis?.topics
                          .filter((m) => m.polarity === "negative")
                          .map((m) => topicLabel(m.topic, locale)),
                      ),
                    ].join(", ") || "–"}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-muted">{t.date} </dt>
                  <dd className="inline">{formatLong(r.localReviewDate, locale)}</dd>
                </div>
              </dl>
              {summary && (
                <p className="mt-1 text-xs text-ink-2">
                  {t.aiPrefix}: {summary}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function StoreAnalysis({
  detail,
  range,
  compareRange,
  allReviews,
  storeNames,
  locale,
}: {
  detail: StoreDetail;
  range: DateRange;
  compareRange: DateRange;
  allReviews: AnalyzedReview[];
  storeNames: Record<string, string>;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const { store, today, prev, snapshot, prevSnapshot } = detail;
  const single = range.from === range.to;
  const vs = t.vs(formatRangeShort(compareRange, locale));
  const newRatingDelta =
    today.avgRating !== null && prev.avgRating !== null ? today.avgRating - prev.avgRating : null;
  const googleDelta =
    snapshot && prevSnapshot ? snapshot.googleAvgRating - prevSnapshot.googleAvgRating : null;

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{store.shortName}</h2>
              <BrandBadge brand={store.brand} />
              <StatusBadge status={today.status} locale={locale} />
            </div>
            <p className="mt-0.5 text-xs text-muted">{t.storeAnalysis(formatRange(range, locale))}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
          <Kpi
            label={t.newReviews}
            value={`+${today.newReviewCount}`}
            sub={<Delta value={today.newReviewCount - prev.newReviewCount} suffix={vs} />}
          />
          <Kpi
            label={t.avgNewRating}
            value={`${formatRating(today.avgRating)} ★`}
            sub={<Delta value={newRatingDelta} digits={1} suffix={vs} goodWhenUp />}
          />
          <Kpi label={t.positive} value={<span className="text-good">{today.positiveCount}</span>} />
          <Kpi label={t.neutral} value={<span className="text-warn">{today.neutralCount}</span>} />
          <Kpi
            label={t.negative}
            value={<span className={today.negativeCount > 0 ? "text-crit" : ""}>{today.negativeCount}</span>}
          />
          <Kpi
            label={t.cumulativeRating}
            value={snapshot ? `${snapshot.googleAvgRating.toFixed(2)} ★` : "–"}
            sub={
              googleDelta !== null && Math.abs(googleDelta) >= 0.005 ? (
                <Delta value={googleDelta} digits={2} suffix={vs} goodWhenUp />
              ) : snapshot ? (
                <span className="text-ink-2">
                  {t.reviewsCount(snapshot.googleTotalReviews.toLocaleString("en-US"))}
                </span>
              ) : null
            }
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <Card>
            <SectionTitle right={<span className="text-[11px] text-muted">{t.aiTag}</span>}>
              {t.storeAiSummary}
            </SectionTitle>
            <p className="text-sm leading-relaxed">{today.aiSummary}</p>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <InsightList
              title={t.liked}
              items={today.positiveInsights}
              tone="good"
              empty={t.noPositiveMentions}
              locale={locale}
            />
            <InsightList
              title={t.needsAttention}
              items={today.negativeInsights}
              tone="crit"
              empty={t.noIssues}
              locale={locale}
            />
          </div>
        </div>

        <div className="space-y-3">
          <CriticalReviews
            reviews={detail.criticalReviews}
            storeName={store.shortName}
            single={single}
            locale={locale}
          />
          <Card>
            <SectionTitle>{t.trendTitle(detail.trend.length)}</SectionTitle>
            <TrendCharts trend={detail.trend} range={range} locale={locale} />
          </Card>
        </div>
      </div>

      <ReviewFeed
        key={`${store.id}-${range.from}-${range.to}`}
        storeReviews={detail.reviews}
        allReviews={allReviews}
        storeNames={storeNames}
        storeName={store.shortName}
        locale={locale}
      />
    </div>
  );
}
