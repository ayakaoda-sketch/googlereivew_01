import type { ReactNode } from "react";
import { formatRangeShort, type DateRange } from "@/lib/date";
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
}: {
  kpis: GlobalKpis;
  brief: string;
  range: DateRange;
  compareRange: DateRange;
}) {
  const single = range.from === range.to;
  const vs = `vs ${formatRangeShort(compareRange)}`;
  const ratingDelta =
    kpis.avgRating !== null && kpis.prevAvgRating !== null ? kpis.avgRating - kpis.prevAvgRating : null;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid grid-cols-2 gap-3">
        <Tile
          label="New Reviews"
          value={`+${kpis.newReviews}`}
          sub={<Delta value={kpis.newReviews - kpis.prevNewReviews} suffix={vs} />}
        />
        <Tile
          label="Avg New Review Rating"
          value={
            <>
              {formatRating(kpis.avgRating)} <span className="text-xl text-muted">★</span>
            </>
          }
          sub={<Delta value={ratingDelta} digits={1} suffix={vs} goodWhenUp />}
        />
        <Tile
          label="Positive (4–5★)"
          value={<span className="text-good">{kpis.positive}</span>}
          sub={<span className="text-ink-2">{kpis.neutral} neutral (3★)</span>}
        />
        <Tile
          label="Critical (1–2★)"
          value={<span className={kpis.negative > 0 ? "text-crit" : ""}>{kpis.negative}</span>}
          sub={
            <span className="text-ink-2">
              {kpis.negative > 0 ? (single ? "Needs review today" : "Needs review") : "No critical reviews"}
            </span>
          }
          tone={kpis.negative > 0 ? "!border-crit-dot/40 !bg-crit-soft" : ""}
        />
      </div>

      <Card className="flex flex-col">
        <SectionTitle right={<span className="text-[11px] text-muted">AI · 한국어</span>}>
          Philippines {single ? "Daily" : "Period"} AI Brief
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
