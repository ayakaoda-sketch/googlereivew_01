"use client";

import { useMemo, useState } from "react";
import { formatDateTime } from "@/lib/date";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import { TOPIC_KEYS, topicLabel } from "@/lib/topics";
import type { AiSentiment, AnalyzedReview, TopicKey } from "@/lib/types";
import { Card, SectionTitle, Stars } from "./ui";

type Filter = "all" | "positive" | "negative" | "critical";

const FILTERS: { key: Filter; label: (t: Dictionary) => string }[] = [
  { key: "all", label: (t) => t.filterAll },
  { key: "positive", label: (t) => t.positive },
  { key: "negative", label: (t) => t.negative },
  { key: "critical", label: (t) => t.filterCritical },
];

const SENTIMENT_STYLE: Record<AiSentiment, string> = {
  positive: "text-good",
  neutral: "text-ink-2",
  mixed: "text-warn",
  negative: "text-crit",
};

// Positive/Negative use the AI text sentiment (so a 5★ review that raises an
// issue shows under Negative as "mixed"); "1–2 Stars" uses the rating.
function matches(review: AnalyzedReview, filter: Filter): boolean {
  const s = review.analysis?.sentiment;
  switch (filter) {
    case "all":
      return true;
    case "positive":
      return s === "positive" || (!s && review.rating >= 4);
    case "negative":
      return s === "negative" || s === "mixed" || (!s && review.rating <= 2);
    case "critical":
      return review.rating <= 2;
  }
}

export function ReviewFeed({
  storeReviews,
  allReviews,
  storeNames,
  storeName,
  locale,
}: {
  storeReviews: AnalyzedReview[];
  allReviews: AnalyzedReview[];
  storeNames: Record<string, string>;
  storeName: string;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const [scope, setScope] = useState<"store" | "all">("store");
  const [filter, setFilter] = useState<Filter>("all");
  const [topic, setTopic] = useState<TopicKey | "">("");

  const source = scope === "store" ? storeReviews : allReviews;
  const visible = useMemo(
    () =>
      source.filter(
        (r) => matches(r, filter) && (!topic || r.analysis?.topics.some((m) => m.topic === topic)),
      ),
    [source, filter, topic],
  );

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium ${
      active ? "border-ink bg-ink text-surface" : "border-line text-ink-2 hover:bg-surface-2"
    }`;

  return (
    <Card>
      <SectionTitle right={<span className="text-xs text-muted">{t.reviewsShort(visible.length)}</span>}>
        {t.reviewFeed}
      </SectionTitle>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="mr-2 flex rounded-lg border border-line p-0.5 text-xs">
          {(["store", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-md px-2.5 py-1 font-medium ${scope === s ? "bg-surface-2 text-ink" : "text-muted"}`}
            >
              {s === "store" ? storeName : t.allStores}
            </button>
          ))}
        </div>
        {FILTERS.map((f) => (
          <button key={f.key} className={chip(filter === f.key)} onClick={() => setFilter(f.key)}>
            {f.label(t)}
          </button>
        ))}
        <select
          aria-label={t.topic}
          value={topic}
          onChange={(e) => setTopic(e.target.value as TopicKey | "")}
          className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-2"
        >
          <option value="">{t.allTopics}</option>
          {TOPIC_KEYS.map((key) => (
            <option key={key} value={key}>
              {topicLabel(key, locale)}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t.noMatches}</p>
      ) : (
        <ul className="divide-y divide-line">
          {visible.map((r) => {
            const summary = locale === "ko" ? r.analysis?.summaryKo : r.analysis?.summaryEn;
            return (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <Stars rating={r.rating} locale={locale} />
                  <span className="font-medium">{r.reviewerName}</span>
                  {scope === "all" && <span className="text-xs text-ink-2">{storeNames[r.storeId]}</span>}
                  <span className="text-xs text-muted">{formatDateTime(r.googleCreatedAt, locale)}</span>
                  {r.analysis && (
                    <span className={`text-xs font-medium capitalize ${SENTIMENT_STYLE[r.analysis.sentiment]}`}>
                      {t.aiPrefix}: {t.sentiment[r.analysis.sentiment]}
                    </span>
                  )}
                </div>
                <p className={`mt-1 text-sm leading-relaxed ${r.reviewText ? "" : "italic text-muted"}`}>
                  {r.reviewText ?? t.noText}
                </p>
                {r.analysis && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {[...new Set(r.analysis.topics.map((m) => m.topic))].map((key) => (
                      <span key={key} className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-2">
                        {topicLabel(key, locale)}
                      </span>
                    ))}
                    {summary && <span className="text-xs text-muted">· {summary}</span>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
