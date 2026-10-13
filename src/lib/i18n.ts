// UI strings. English is the default; Korean is opt-in via the language toggle,
// which stores the choice in the `lang` cookie.

import type { AiSentiment, StoreStatus, TopicKey } from "./types";

export type Locale = "en" | "ko";

export const LOCALES: { key: Locale; label: string }[] = [
  { key: "en", label: "EN" },
  { key: "ko", label: "KR" },
];

export const LOCALE_COOKIE = "lang";

export function parseLocale(value: unknown): Locale {
  return value === "ko" ? "ko" : "en";
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const en = {
  appTitle: "Google Review Dashboard",
  reviewDate: "Review Date",
  reviewPeriod: "Review Period",
  daysCount: (n: number) => `${n} days`,
  comparedWith: (r: string) => `Compared with ${r}`,
  generated: (t: string) => `Generated ${t}`,
  notGenerated: "Not generated yet",
  noActiveStores: "No active stores.",
  language: "Language",

  // Date navigator
  prevDay: "Previous day",
  prevPeriod: "Previous period",
  nextDay: "Next day",
  nextPeriod: "Next period",
  latest: "Latest",
  daysShort: (n: number) => `${n}d`,
  selectPeriod: "Select review period",
  quickSelect: "Quick select",
  presetLatestDay: "Latest day",
  presetLastDays: (n: number) => `Last ${n} days`,
  presetThisMonth: "This month",
  presetLastMonth: "Last month",
  customRange: "Custom range",
  from: "From",
  to: "To",
  errBothDates: "Choose both dates.",
  errOrder: "Start date must be on or before the end date.",
  errOutside: "Dates are outside the available data.",
  errTooLong: (max: number) => `Choose ${max} days or fewer.`,
  rangeHint: (n: number) =>
    `${n} ${plural(n, "day", "days")} · compared with the ${n === 1 ? "previous day" : "previous period of the same length"}`,
  cancel: "Cancel",
  apply: "Apply",

  // Store list
  stores: "Stores",
  brand: "Brand",
  allStoresCumulative: "All stores cumulative",
  brandCumulative: (brand: string) => `${brand} cumulative`,
  googleReviews: "Google reviews",
  newShort: "new",
  lowRatingCount: (n: number) => `1–2★ reviews: ${n}`,
  vsPrev: "vs prev",
  cumulativeGoogle: "Cumulative (Google)",
  newInPeriod: (r: string) => `New · ${r}`,
  reviewsCount: (n: string) => `${n} reviews`,
  noData: "No data",

  // Review feed
  positive: "Positive",
  negative: "Negative",
  noText: "No text — rating only",
  topic: "Topic",
  aiPrefix: "AI",

  // Review feed
  reviewFeed: "Review Feed",
  store: "Store",
  allStores: "All stores",
  reviewsShort: (n: number) => `${n} ${plural(n, "review", "reviews")}`,
  filterAll: "All",
  filterCritical: "1–2 Stars",
  allTopics: "All topics",
  noMatches: "No reviews match these filters.",
  pagination: "Review pages",
  prevPage: "Previous page",
  nextPage: "Next page",
  showingRange: (first: number, last: number, total: number) => `${first}–${last} of ${total}`,

  starsAria: (n: number) => `${n} out of 5 stars`,
  status: { good: "Good", watch: "Watch", critical: "Critical" } as Record<StoreStatus, string>,
  sentiment: { positive: "positive", neutral: "neutral", mixed: "mixed", negative: "negative" } as Record<AiSentiment, string>,
  topics: {
    food_quality: "Food Quality",
    flavor: "Flavor",
    meat_quality: "Meat Quality",
    service: "Service",
    staff: "Staff",
    waiting_time: "Waiting Time",
    cleanliness: "Cleanliness",
    price_value: "Price / Value",
    promotion: "Promotion",
    portion: "Portion",
    side_dishes: "Side Dishes",
    soup: "Soup",
    atmosphere: "Atmosphere",
    accessibility: "Accessibility",
    other: "Other",
  } as Record<TopicKey, string>,
};

export type Dictionary = typeof en;

const ko: Dictionary = {
  appTitle: "구글 리뷰 대시보드",
  reviewDate: "리뷰 날짜",
  reviewPeriod: "리뷰 기간",
  daysCount: (n) => `${n}일`,
  comparedWith: (r) => `비교 기준 ${r}`,
  generated: (t) => `생성 ${t}`,
  notGenerated: "아직 생성되지 않음",
  noActiveStores: "운영 중인 매장이 없습니다.",
  language: "언어",

  prevDay: "이전 날짜",
  prevPeriod: "이전 기간",
  nextDay: "다음 날짜",
  nextPeriod: "다음 기간",
  latest: "최신",
  daysShort: (n) => `${n}일`,
  selectPeriod: "리뷰 기간 선택",
  quickSelect: "빠른 선택",
  presetLatestDay: "최근 1일",
  presetLastDays: (n) => `최근 ${n}일`,
  presetThisMonth: "이번 달",
  presetLastMonth: "지난달",
  customRange: "직접 지정",
  from: "시작",
  to: "종료",
  errBothDates: "두 날짜를 모두 선택하세요.",
  errOrder: "시작일은 종료일보다 늦을 수 없습니다.",
  errOutside: "데이터가 없는 날짜입니다.",
  errTooLong: (max) => `${max}일 이하로 선택하세요.`,
  rangeHint: (n) => `${n}일 · ${n === 1 ? "전일" : "같은 길이의 이전 기간"}과 비교`,
  cancel: "취소",
  apply: "적용",

  stores: "매장",
  brand: "브랜드",
  allStoresCumulative: "전체 매장 누적",
  brandCumulative: (brand) => `${brand} 누적`,
  googleReviews: "Google 리뷰",
  newShort: "신규",
  lowRatingCount: (n) => `1–2★ 리뷰: ${n}건`,
  vsPrev: "이전 대비",
  cumulativeGoogle: "누적 (Google)",
  newInPeriod: (r) => `신규 · ${r}`,
  reviewsCount: (n) => `리뷰 ${n}건`,
  noData: "데이터 없음",

  positive: "긍정",
  negative: "부정",
  noText: "텍스트 없음 — 평점만 등록",
  topic: "주제",
  aiPrefix: "AI",

  reviewFeed: "리뷰 피드",
  store: "매장",
  allStores: "전체 매장",
  reviewsShort: (n) => `리뷰 ${n}건`,
  filterAll: "전체",
  filterCritical: "1–2점",
  allTopics: "전체 주제",
  noMatches: "조건에 맞는 리뷰가 없습니다.",
  pagination: "리뷰 페이지",
  prevPage: "이전 페이지",
  nextPage: "다음 페이지",
  showingRange: (first, last, total) => `전체 ${total}건 중 ${first}–${last}`,

  starsAria: (n) => `5점 만점에 ${n}점`,
  status: { good: "양호", watch: "주의", critical: "위험" },
  sentiment: { positive: "긍정", neutral: "중립", mixed: "혼합", negative: "부정" },
  topics: {
    food_quality: "음식 품질",
    flavor: "맛",
    meat_quality: "고기 품질",
    service: "서비스",
    staff: "직원",
    waiting_time: "대기 시간",
    cleanliness: "청결",
    price_value: "가격 / 가성비",
    promotion: "프로모션",
    portion: "양",
    side_dishes: "반찬",
    soup: "국 / 탕",
    atmosphere: "분위기",
    accessibility: "접근성",
    other: "기타",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, ko };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
