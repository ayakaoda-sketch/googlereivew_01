import { RECURRING_THRESHOLD } from "../aggregate";
import { rangeDays, type DateRange } from "../date";
import type { Locale } from "../i18n";
import type { InsightItem } from "../types";
import type { Summarizer } from "./summarizer";

// The Philippines-wide brief only escalates issues seen this often in 7 days.
const BRIEF_RECURRING_THRESHOLD = 3;

// Surge =at least double the previous day and +3 or more reviews.
function isSurge(count: number, prev: number): boolean {
  return count - prev >= 3 && count >= prev * 2;
}

function signed(n: number): string {
  return `${n >= 0 ? "+" : ""}${n}`;
}

/** Sentence templates per locale. `single` = one-day range; `week` = mentions7d spans 7 days. */
const PHRASES = {
  en: {
    label: (i: InsightItem) => i.label,
    quote: (labels: string[]) => labels.map((l) => `'${l}'`).join(", "),
    noReviews: (name: string) => `No new reviews at ${name}.`,
    received: (name: string, n: number, avg: string) =>
      `${name} received ${n} new review${n === 1 ? "" : "s"} (avg ${avg}★).`,
    surge: (single: boolean, prev: number) =>
      `Reviews rose sharply compared with the previous ${single ? "day" : "period"} (${prev}).`,
    liked: (labels: string) => `Positive feedback on ${labels}.`,
    issues: (labels: string, n: number) =>
      `${n} comment${n === 1 ? "" : "s"} asked for improvement on ${labels}.`,
    recurring: (label: string, week: boolean, n: number) =>
      `'${label}' came up ${n} times ${week ? "in the last 7 days" : "in this period"}; the store operations team should check.`,
    critical: (stars: string[], n: number) =>
      `${n} low-rating review${n === 1 ? "" : "s"} (${stars.map((s) => `${s}★`).join(", ")}) need${n === 1 ? "s" : ""} immediate attention.`,
    total: (single: boolean, n: number, diff: number) =>
      `${n} new reviews in total (${signed(diff)} vs the previous ${single ? "day" : "period"}).`,
    briefCritical: (name: string, topic: string | undefined, rating: number) =>
      `${name}: one ${rating}★ review${topic ? ` about '${topic}'` : ""} needs attention.`,
    briefSurge: (single: boolean, list: string) =>
      `Reviews rose sharply vs the previous ${single ? "day" : "period"} at ${list}.`,
    briefRecurring: (name: string, label: string, week: boolean, n: number) =>
      `${name}: '${label}' keeps coming up (${n} times ${week ? "in the last 7 days" : "in this period"}).`,
    briefPraised: (list: string) => `Lots of positive feedback at ${list}.`,
    briefQuiet: (list: string) => `No new reviews at ${list}.`,
  },
  ko: {
    label: (i: InsightItem) => i.labelKo,
    quote: (labels: string[]) => labels.map((l) => `'${l}'`).join(", "),
    noReviews: (name: string) => `${name}에는 신규 리뷰가 없었습니다.`,
    received: (name: string, n: number, avg: string) =>
      `${name}에는 신규 리뷰가 ${n}건 등록되었습니다(평균 ${avg}점).`,
    surge: (single: boolean, prev: number) =>
      `${single ? "전일" : "이전 기간"}(${prev}건) 대비 리뷰가 크게 증가했습니다.`,
    liked: (labels: string) => `${labels} 관련 긍정적인 피드백이 확인되었습니다.`,
    issues: (labels: string, n: number) => `${labels} 관련 개선 의견이 ${n}건 있었습니다.`,
    recurring: (label: string, week: boolean, n: number) =>
      `'${label}' 의견이 ${week ? "최근 7일간" : "기간 중"} ${n}회 반복되고 있어 매장 운영팀 확인이 필요합니다.`,
    critical: (stars: string[], n: number) =>
      `저평점 리뷰(${stars.map((s) => `${s}점`).join(", ")})가 ${n}건 있어 즉시 확인이 필요합니다.`,
    total: (single: boolean, n: number, diff: number) =>
      `총 ${n}개의 신규 리뷰가 등록되었습니다(${single ? "전일" : "이전 기간"} 대비 ${signed(diff)}).`,
    briefCritical: (name: string, topic: string | undefined, rating: number) =>
      `${name}에서 ${topic ? `'${topic}' 관련 ` : ""}${rating}점 리뷰 1건이 있어 확인이 필요합니다.`,
    briefSurge: (single: boolean, list: string) =>
      `${list}에서 ${single ? "전일" : "이전 기간"} 대비 리뷰가 크게 늘었습니다.`,
    briefRecurring: (name: string, label: string, week: boolean, n: number) =>
      `${name}에서는 '${label}' 관련 의견이 ${week ? "최근 7일간" : "기간 중"} ${n}회 반복되고 있습니다.`,
    briefPraised: (list: string) => `${list}에서는 긍정적인 피드백이 많았습니다.`,
    briefQuiet: (list: string) => `${list}에는 신규 리뷰가 없었습니다.`,
  },
} satisfies Record<Locale, unknown>;

function context(range: DateRange) {
  // `mentions7d` spans the period widened to at least 7 days.
  return { single: range.from === range.to, week: rangeDays(range) <= 7 };
}

export const mockSummarizer: Summarizer = {
  storeSummary(
    { store, range, counts, prevCount, positiveInsights, negativeInsights, criticalReviews },
    locale,
  ) {
    const p = PHRASES[locale];
    const { single, week } = context(range);
    const name = store.shortName;
    if (counts.newReviewCount === 0) return p.noReviews(name);

    const lines: string[] = [p.received(name, counts.newReviewCount, counts.avgRating!.toFixed(1))];

    if (isSurge(counts.newReviewCount, prevCount)) {
      lines.push(p.surge(single, prevCount));
    }

    const liked = positiveInsights.slice(0, 2).map(p.label);
    if (liked.length > 0) {
      lines.push(p.liked(p.quote(liked)));
    }

    const issues = negativeInsights.slice(0, 2);
    if (issues.length > 0) {
      const total = issues.reduce((a, i) => a + i.mentions, 0);
      lines.push(p.issues(p.quote(issues.map(p.label)), total));
    }

    const recurring = negativeInsights.find((i) => i.mentions7d >= RECURRING_THRESHOLD);
    if (recurring) {
      lines.push(p.recurring(p.label(recurring), week, recurring.mentions7d));
    }

    if (criticalReviews.length > 0) {
      lines.push(p.critical(criticalReviews.map((r) => String(r.rating)), criticalReviews.length));
    }

    return lines.join(" ");
  },

  dailyBrief({ range, totalNew, prevTotalNew, stores }, locale) {
    const p = PHRASES[locale];
    const { single, week } = context(range);
    const lines: string[] = [p.total(single, totalNew, totalNew - prevTotalNew)];

    // 1. Low ratings
    for (const s of stores) {
      for (const r of s.criticalReviews) {
        const topic = r.analysis?.topics.find((t) => t.polarity === "negative");
        const label = topic && (locale === "ko" ? topic.labelKo : topic.label);
        lines.push(p.briefCritical(s.store.shortName, label, r.rating));
      }
    }

    // 2. Sudden increase
    const surging = stores.filter((s) => isSurge(s.counts.newReviewCount, s.prevCount));
    if (surging.length > 0) {
      lines.push(
        p.briefSurge(
          single,
          surging.map((s) => `${s.store.shortName}(+${s.counts.newReviewCount - s.prevCount})`).join(", "),
        ),
      );
    }

    // 3. Recurring negative keywords — only the strongest few, to keep the brief short
    const recurring = stores
      .flatMap((s) => {
        const top = s.negativeInsights[0];
        return top && top.mentions7d >= BRIEF_RECURRING_THRESHOLD ? [{ s, top }] : [];
      })
      .sort((a, b) => b.top.mentions7d - a.top.mentions7d)
      .slice(0, 3);
    for (const { s, top } of recurring) {
      lines.push(p.briefRecurring(s.store.shortName, p.label(top), week, top.mentions7d));
    }

    // 4. Recurring positive keywords
    const praised = stores
      .filter((s) => s.positiveInsights[0]?.mentions >= 2)
      .map((s) => `${s.store.shortName}('${p.label(s.positiveInsights[0])}')`);
    if (praised.length > 0) {
      lines.push(p.briefPraised(praised.join(", ")));
    }

    // 5. Other notes
    const quiet = stores.filter((s) => s.counts.newReviewCount === 0);
    if (quiet.length > 0) {
      lines.push(p.briefQuiet(quiet.map((s) => s.store.shortName).join(", ")));
    }

    return lines.join("\n");
  },
};
