"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatShort, type DateRange } from "@/lib/date";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { TrendPoint } from "@/lib/types";

const axisTick = { fill: "var(--muted)", fontSize: 11 };

function TrendTooltip({
  active,
  payload,
  kind,
  locale,
}: {
  active?: boolean;
  payload?: { payload: TrendPoint }[];
  kind: "count" | "rating";
  locale: Locale;
}) {
  if (!active || !payload?.length) return null;
  const t = getDictionary(locale);
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-sm">
      <div className="text-muted">{formatShort(p.date, locale)}</div>
      <div className="font-semibold tabular-nums text-ink">
        {kind === "count"
          ? t.newReviewsCount(p.newReviews)
          : p.avgRating === null
            ? t.noReviews
            : t.avgStars(p.avgRating.toFixed(2))}
      </div>
    </div>
  );
}

export function TrendCharts({
  trend,
  range,
  locale,
}: {
  trend: TrendPoint[];
  range: DateRange;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  // Compact "9/29" ticks so 7 labels fit narrow chart widths; tooltips show the full date.
  const data = trend.map((p) => ({ ...p, label: `${Number(p.date.slice(5, 7))}/${Number(p.date.slice(8))}` }));
  const inRange = (date: string) => date >= range.from && date <= range.to;
  // Long periods: let recharts thin the ticks and drop the per-point dots.
  const dense = data.length > 14;
  const tickInterval = dense ? "preserveStartEnd" : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <figure>
        <figcaption className="mb-1 text-xs font-medium text-ink-2">{t.dailyNewReviews}</figcaption>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--line)" }} interval={tickInterval} minTickGap={8} />
              <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={40} />
              <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<TrendTooltip kind="count" locale={locale} />} />
              <Bar dataKey="newReviews" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.date} fill={inRange(d.date) ? "var(--series)" : "var(--series-soft)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <figure>
        <figcaption className="mb-1 text-xs font-medium text-ink-2">{t.avgRatingOfNew}</figcaption>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--line)" }} interval={tickInterval} minTickGap={8} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={axisTick} tickLine={false} axisLine={false} width={40} />
              <Tooltip cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} content={<TrendTooltip kind="rating" locale={locale} />} />
              <Line
                type="linear"
                dataKey="avgRating"
                stroke="var(--series)"
                strokeWidth={2}
                connectNulls
                dot={dense ? false : { r: 4, fill: "var(--series)", stroke: "var(--surface)", strokeWidth: 2 }}
                activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <table className="sr-only">
        <caption>{t.lastDays(trend.length)}</caption>
        <thead>
          <tr>
            <th>{t.date}</th>
            <th>{t.newReviews}</th>
            <th>{t.averageRating}</th>
          </tr>
        </thead>
        <tbody>
          {trend.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{p.newReviews}</td>
              <td>{p.avgRating?.toFixed(2) ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
