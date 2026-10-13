import type { ReactNode } from "react";
import { formatRangeShort, type DateRange } from "@/lib/date";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { GlobalKpis } from "@/lib/types";
import { Card, Delta, SectionTitle, formatRating } from "./ui";

function Tile({
  label,
  value,
  sub,
  tone = "",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`rounded-xl border border-line bg-surface p-4 ${tone}`}>
      <div className="text-xs font-medium text-ink-2">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-xs">{sub}</div> : null}
    </div>
  );
}

export function GlobalSummary({
  kpis,
  brief,
  range,
  compareRange,
  locale,
}: {
  kpis: GlobalKpis;
  brief: string;
  range: DateRange;
  compareRange: DateRange;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const single = range.from === range.to;
  const vs = t.vs(formatRangeShort(compareRange, locale));
  const ratingDelta =
    kpis.avgRating !== null && kpis.prevAvgRating !== null ? kpis.avgRating - kpis.prevAvgRating : null;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid grid-cols-2 gap-3">
        <Tile
          label={t.newReviews}
          value={`+${kpis.newReviews}`}
          sub={<Delta value={kpis.newReviews - kpis.prevNewReviews} suffix={vs} />}
        />
        <Tile
          label={t.avgNewReviewRating}
          value={
            <>
              {formatRating(kpis.avgRating)} <span className="text-xl text-muted">★</span>
            </>
          }
          sub={<Delta value={ratingDelta} digits={1} suffix={vs} goodWhenUp />}
        />
        <Tile
          label={t.positiveTile}
          value={<span className="text-good">{kpis.positive}</span>}
          sub={<span className="text-ink-2">{t.neutralSub(kpis.neutral)}</span>}
        />
        <Tile
          label={t.criticalTile}
          value={<span className={kpis.negative > 0 ? "text-crit" : ""}>{kpis.negative}</span>}
          sub={
            <span className="text-ink-2">
              {kpis.negative > 0 ? (single ? t.needsReviewToday : t.needsReview) : t.noCriticalReviews}
            </span>
          }
          tone={kpis.negative > 0 ? "!border-crit-dot/40 !bg-crit-soft" : ""}
        />
      </div>

      <Card className="flex flex-col">
        <SectionTitle right={<span className="text-[11px] text-muted">{t.aiTag}</span>}>
          {t.briefTitle(single)}
        </SectionTitle>
        <ul className="space-y-1.5 text-sm leading-relaxed">
          {brief.split("\n").map((line, i) => (
            <li key={i} className={i === 0 ? "font-medium" : "text-ink-2"}>
              {line}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
