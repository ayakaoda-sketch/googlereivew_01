"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { formatDateTime, type DateRange } from "@/lib/date";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import { TOPIC_KEYS, topicLabel } from "@/lib/topics";
import type { AiSentiment, AnalyzedReview, Brand, TopicKey } from "@/lib/types";
import { dashboardHref } from "@/lib/url";
import { Card, SectionTitle, Stars } from "./ui";

type Filter = "all" | "critical";
type Sort = "highest" | "lowest" | "newest";

const PAGE_SIZE = 15;

const FILTERS: { key: Filter; label: (t: Dictionary) => string }[] = [
  { key: "all", label: (t) => t.filterAll },
  { key: "critical", label: (t) => t.filterCritical },
];

const SORTS: { key: Sort; label: (t: Dictionary) => string }[] = [
  { key: "highest", label: (t) => t.sortHighest },
  { key: "lowest", label: (t) => t.sortLowest },
  { key: "newest", label: (t) => t.sortNewest },
];

const newestFirst = (a: AnalyzedReview, b: AnalyzedReview) => b.googleCreatedAt.localeCompare(a.googleCreatedAt);

/** Rating sorts break ties by date, newest first. */
const SORT_COMPARE: Record<Sort, (a: AnalyzedReview, b: AnalyzedReview) => number> = {
  highest: (a, b) => b.rating - a.rating || newestFirst(a, b),
  lowest: (a, b) => a.rating - b.rating || newestFirst(a, b),
  newest: newestFirst,
};

/** Google Translate page with the text pre-filled, translated to Korean. */
function googleTranslateUrl(text: string): string {
  return `https://translate.google.com/?${new URLSearchParams({ sl: "auto", tl: "ko", text, op: "translate" })}`;
}

/** Store-name chip in the brand's color (same hues as the store cards, stronger). */
const STORE_CHIP: Record<Brand, string> = {
  WOLHWA_GALBI: "bg-crit-soft text-crit",
  KODOKODO: "bg-warn-soft text-warn",
};

const SENTIMENT_STYLE: Record<AiSentiment, string> = {
  positive: "text-good",
  neutral: "text-ink-2",
  mixed: "text-warn",
  negative: "text-crit",
};

function matches(review: AnalyzedReview, filter: Filter): boolean {
  return filter === "all" || review.rating <= 2;
}

export function ReviewFeed({
  reviews,
  stores,
  selectedSlug,
  range,
  locale,
}: {
  /** Reviews of every store; narrowed here by `selectedSlug`. */
  reviews: AnalyzedReview[];
  stores: { id: string; slug: string; name: string; brand: Brand }[];
  /** From `?store=`; undefined shows all stores. */
  selectedSlug?: string;
  range: DateRange;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [topic, setTopic] = useState<TopicKey | "">("");
  const [sort, setSort] = useState<Sort>("highest");

  const storeById = Object.fromEntries(stores.map((s) => [s.id, s]));
  const selectedId = stores.find((s) => s.slug === selectedSlug)?.id;

  const visible = useMemo(() => {
    const list = reviews.filter(
      (r) =>
        (!selectedId || r.storeId === selectedId) &&
        matches(r, filter) &&
        (!topic || r.analysis?.topics.some((m) => m.topic === topic)),
    );
    return [...list].sort(SORT_COMPARE[sort]);
  }, [reviews, selectedId, filter, topic, sort]);

  // Back to page 1 whenever what is being listed changes (store comes from the URL).
  const listKey = `${selectedSlug}|${filter}|${topic}|${sort}`;
  const [paging, setPaging] = useState({ key: listKey, page: 1 });
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = paging.key === listKey ? Math.min(paging.page, pageCount) : 1;
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const topRef = useRef<HTMLDivElement>(null);
  const goTo = (p: number) => {
    setPaging({ key: listKey, page: p });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium ${
      active ? "border-ink bg-ink text-surface" : "border-line text-ink-2 hover:bg-surface-2"
    }`;

  return (
    <Card>
      <div ref={topRef} className="scroll-mt-24" />
      <SectionTitle right={<span className="text-xs text-muted">{t.reviewsShort(visible.length)}</span>}>
        {t.reviewFeed}
      </SectionTitle>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* The store lives in the URL so the highlighted store card stays in sync. */}
        <select
          aria-label={t.store}
          value={selectedSlug ?? ""}
          onChange={(e) =>
            router.replace(dashboardHref(range, e.target.value || undefined), { scroll: false })
          }
          className="mr-2 rounded-lg border border-line bg-surface px-3 py-1 text-xs font-medium text-ink"
        >
          <option value="">{t.allStores}</option>
          {stores.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
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
        <select
          aria-label={t.sortBy}
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-2 sm:ml-auto"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label(t)}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t.noMatches}</p>
      ) : (
        <ul className="divide-y divide-line">
          {pageItems.map((r) => {
            const summary = locale === "ko" ? r.analysis?.summaryKo : r.analysis?.summaryEn;
            return (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <Stars rating={r.rating} locale={locale} />
                  <span className="font-medium">{r.reviewerName}</span>
                  {!selectedId && storeById[r.storeId] && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STORE_CHIP[storeById[r.storeId].brand]}`}
                    >
                      {storeById[r.storeId].name}
                    </span>
                  )}
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
                {/* Korean view only: free hand-off to Google Translate in a new tab (no API key). */}
                {locale === "ko" && r.reviewText && (
                  <a
                    href={googleTranslateUrl(r.reviewText)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-medium text-series hover:underline"
                  >
                    {t.viewInGoogleTranslate} ↗
                  </a>
                )}
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

      {pageCount > 1 && (
        <Pagination
          page={page}
          pageCount={pageCount}
          total={visible.length}
          onChange={goTo}
          t={t}
        />
      )}
    </Card>
  );
}

/** Page numbers to show: first, last, and the neighbours of the current page, with gaps. */
function pageList(page: number, pageCount: number): (number | "gap")[] {
  const shown = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  return shown.flatMap((p, i) => (i > 0 && p - shown[i - 1] > 1 ? ["gap" as const, p] : [p]));
}

function Pagination({
  page,
  pageCount,
  total,
  onChange,
  t,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
  t: Dictionary;
}) {
  const btn = "grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-medium tabular-nums";
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);
  return (
    <nav aria-label={t.pagination} className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
      <span className="text-xs text-muted tabular-nums">{t.showingRange(first, last, total)}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label={t.prevPage}
          className={`${btn} border border-line text-ink-2 hover:bg-surface-2 disabled:opacity-40`}
        >
          ‹
        </button>
        {pageList(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onChange(p)}
              className={`${btn} ${p === page ? "bg-ink text-surface" : "text-ink-2 hover:bg-surface-2"}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page === pageCount}
          onClick={() => onChange(page + 1)}
          aria-label={t.nextPage}
          className={`${btn} border border-line text-ink-2 hover:bg-surface-2 disabled:opacity-40`}
        >
          ›
        </button>
      </div>
    </nav>
  );
}
