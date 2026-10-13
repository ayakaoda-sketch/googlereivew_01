import { RECURRING_THRESHOLD } from "../aggregate";
import { rangeDays, type DateRange } from "../date";
import type { Summarizer } from "./summarizer";

/** What the comparison period is called: the previous day, or the previous same-length period. */
function prevLabel(range: DateRange): string {
  return range.from === range.to ? "전일" : "이전 기간";
}

/** `mentions7d` spans the period widened to at least 7 days. */
function windowLabel(range: DateRange): string {
  return rangeDays(range) <= 7 ? "최근 7일간" : "기간 중";
}

// The Philippines-wide brief only escalates issues seen this often in 7 days.
const BRIEF_RECURRING_THRESHOLD = 3;

// Surge =at least double the previous day and +3 or more reviews.
function isSurge(count: number, prev: number): boolean {
  return count - prev >= 3 && count >= prev * 2;
}

function joinLabels(labels: string[]): string {
  return labels.map((l) => `'${l}'`).join(", ");
}

export const mockSummarizer: Summarizer = {
  storeSummary({ store, range, counts, prevCount, positiveInsights, negativeInsights, criticalReviews }) {
    const name = store.shortName;
    if (counts.newReviewCount === 0) {
      return `${name}에는 신규 리뷰가 없었습니다.`;
    }

    const lines: string[] = [
      `${name}에는 신규 리뷰가 ${counts.newReviewCount}건 등록되었습니다(평균 ${counts.avgRating!.toFixed(1)}점).`,
    ];

    if (isSurge(counts.newReviewCount, prevCount)) {
      lines.push(`${prevLabel(range)}(${prevCount}건) 대비 리뷰가 크게 증가했습니다.`);
    }

    const liked = positiveInsights.slice(0, 2).map((i) => i.label);
    if (liked.length > 0) {
      lines.push(`${joinLabels(liked)} 관련 긍정적인 피드백이 확인되었습니다.`);
    }

    const issues = negativeInsights.slice(0, 2);
    if (issues.length > 0) {
      const total = issues.reduce((a, i) => a + i.mentions, 0);
      lines.push(`${joinLabels(issues.map((i) => i.label))} 관련 개선 의견이 ${total}건 있었습니다.`);
    }

    const recurring = negativeInsights.find((i) => i.mentions7d >= RECURRING_THRESHOLD);
    if (recurring) {
      lines.push(
        `'${recurring.label}' 의견이 ${windowLabel(range)} ${recurring.mentions7d}회 반복되고 있어 매장 운영팀 확인이 필요합니다.`,
      );
    }

    if (criticalReviews.length > 0) {
      const stars = criticalReviews.map((r) => `${r.rating}점`).join(", ");
      lines.push(`저평점 리뷰(${stars})가 ${criticalReviews.length}건 있어 즉시 확인이 필요합니다.`);
    }

    return lines.join(" ");
  },

  dailyBrief({ range, totalNew, prevTotalNew, stores }) {
    const diff = totalNew - prevTotalNew;
    const lines: string[] = [
      `총 ${totalNew}개의 신규 리뷰가 등록되었습니다(${prevLabel(range)} 대비 ${diff >= 0 ? "+" : ""}${diff}).`,
    ];

    // 1. Low ratings
    for (const s of stores) {
      for (const r of s.criticalReviews) {
        const topic = r.analysis?.topics.find((t) => t.polarity === "negative")?.label;
        lines.push(
          `${s.store.shortName}에서 ${topic ? `'${topic}' 관련 ` : ""}${r.rating}점 리뷰 1건이 있어 확인이 필요합니다.`,
        );
      }
    }

    // 2. Sudden increase
    const surging = stores.filter((s) => isSurge(s.counts.newReviewCount, s.prevCount));
    if (surging.length > 0) {
      lines.push(
        `${surging.map((s) => `${s.store.shortName}(+${s.counts.newReviewCount - s.prevCount})`).join(", ")}에서 ${prevLabel(range)} 대비 리뷰가 크게 늘었습니다.`,
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
      lines.push(
        `${s.store.shortName}에서는 '${top.label}' 관련 의견이 ${windowLabel(range)} ${top.mentions7d}회 반복되고 있습니다.`,
      );
    }

    // 4. Recurring positive keywords
    const praised = stores
      .filter((s) => s.positiveInsights[0]?.mentions >= 2)
      .map((s) => `${s.store.shortName}('${s.positiveInsights[0].label}')`);
    if (praised.length > 0) {
      lines.push(`${praised.join(", ")}에서는 긍정적인 피드백이 많았습니다.`);
    }

    // 5. Other notes
    const quiet = stores.filter((s) => s.counts.newReviewCount === 0);
    if (quiet.length > 0) {
      lines.push(`${quiet.map((s) => s.store.shortName).join(", ")}에는 신규 리뷰가 없었습니다.`);
    }

    return lines.join("\n");
  },
};
