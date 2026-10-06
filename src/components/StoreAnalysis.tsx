import type { ReactNode } from "react";
import { formatLong, formatShort } from "@/lib/date";
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
}: {
  title: string;
  items: InsightItem[];
  tone: "good" | "crit";
  empty: string;
}) {
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
                  <span className="font-medium">{i.label}</span>
                </div>
                <div className="pl-3.5 text-[11px] text-muted">{topicLabel(i.topic)}</div>
              </div>
              <div className="shrink-0 text-right text-xs tabular-nums">
                <div className="text-ink-2">
                  {i.mentions} mention{i.mentions === 1 ? "" : "s"}
                </div>
                {tone === "crit" && i.mentions7d > i.mentions && (
                  <div className="font-semibold text-crit">{i.mentions7d}× in 7 days</div>
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
}: {
  reviews: AnalyzedReview[];
  storeName: string;
}) {
  if (reviews.length === 0) {
    return (
      <Card>
        <SectionTitle>Critical Reviews</SectionTitle>
        <p className="text-sm text-muted">No critical reviews today.</p>
      </Card>
    );
  }
  return (
    <section className="rounded-xl border border-crit-dot/40 bg-crit-soft p-4">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-crit">
        ■ Critical Review{reviews.length > 1 ? `s · ${reviews.length}` : ""}
      </h2>
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-lg bg-surface p-3">
            <div className="flex items-center gap-2 text-sm">
              <Stars rating={r.rating} />
              <span className="font-medium">{r.reviewerName}</span>
            </div>
            <blockquote className="mt-1 text-sm leading-relaxed">
              “{r.reviewText ?? "No text — rating only"}”
            </blockquote>
            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-ink-2">
              <div>
                <dt className="inline text-muted">Store </dt>
                <dd className="inline">{storeName}</dd>
              </div>
              <div>
                <dt className="inline text-muted">Topic </dt>
                <dd className="inline">
                  {[...new Set(r.analysis?.topics.filter((t) => t.polarity === "negative").map((t) => topicLabel(t.topic)))]
                    .join(", ") || "–"}
                </dd>
              </div>
              <div>
                <dt className="inline text-muted">Date </dt>
                <dd className="inline">{formatLong(r.localReviewDate)}</dd>
              </div>
            </dl>
            {r.analysis?.summaryKo && <p className="mt-1 text-xs text-ink-2">AI: {r.analysis.summaryKo}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StoreAnalysis({
  detail,
  date,
  allReviews,
  storeNames,
}: {
  detail: StoreDetail;
  date: string;
  allReviews: AnalyzedReview[];
  storeNames: Record<string, string>;
}) {
  const { store, today, prev, snapshot, prevSnapshot } = detail;
  const vs = `vs ${formatShort(prev.date)}`;
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
              <StatusBadge status={today.status} />
            </div>
            <p className="mt-0.5 text-xs text-muted">Store Analysis · {formatLong(date)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
          <Kpi
            label="New Reviews"
            value={`+${today.newReviewCount}`}
            sub={<Delta value={today.newReviewCount - prev.newReviewCount} suffix={vs} />}
          />
          <Kpi
            label="Avg New Rating"
            value={`${formatRating(today.avgRating)} ★`}
            sub={<Delta value={newRatingDelta} digits={1} suffix={vs} goodWhenUp />}
          />
          <Kpi label="Positive" value={<span className="text-good">{today.positiveCount}</span>} />
          <Kpi label="Neutral" value={<span className="text-warn">{today.neutralCount}</span>} />
          <Kpi
            label="Negative"
            value={<span className={today.negativeCount > 0 ? "text-crit" : ""}>{today.negativeCount}</span>}
          />
          <Kpi
            label="Cumulative Rating"
            value={snapshot ? `${snapshot.googleAvgRating.toFixed(2)} ★` : "–"}
            sub={
              googleDelta !== null && Math.abs(googleDelta) >= 0.005 ? (
                <Delta value={googleDelta} digits={2} suffix={vs} goodWhenUp />
              ) : snapshot ? (
                <span className="text-ink-2">
                  {snapshot.googleTotalReviews.toLocaleString("en-US")} reviews
                </span>
              ) : null
            }
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <Card>
            <SectionTitle right={<span className="text-[11px] text-muted">AI · 한국어</span>}>
              Store AI Summary
            </SectionTitle>
            <p className="text-sm leading-relaxed">{today.aiSummary}</p>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <InsightList
              title="What Customers Liked"
              items={today.positiveInsights}
              tone="good"
              empty="No positive mentions."
            />
            <InsightList
              title="Needs Attention"
              items={today.negativeInsights}
              tone="crit"
              empty="No issues mentioned."
            />
          </div>
        </div>

        <div className="space-y-3">
          <CriticalReviews reviews={detail.criticalReviews} storeName={store.shortName} />
          <Card>
            <SectionTitle>7-Day Trend</SectionTitle>
            <TrendCharts trend={detail.trend} selectedDate={date} />
          </Card>
        </div>
      </div>

      <ReviewFeed
        key={`${store.id}-${date}`}
        storeReviews={detail.reviews}
        allReviews={allReviews}
        storeNames={storeNames}
        storeName={store.shortName}
      />
    </div>
  );
}
