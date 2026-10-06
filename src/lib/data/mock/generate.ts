import { addDays } from "../../date";
import type { AnalyzedReview, Store } from "../../types";
import { REVIEWER_NAMES, TEMPLATES, templatePool, type TemplateId } from "./templates";

export const MOCK_START_DATE = "2026-09-01";

// The PRD's reference day (26 reviews, 3 critical) is written out by hand.
const SCRIPTED: Record<string, Record<string, TemplateId[]>> = {
  "2026-10-05": {
    st_maax: ["g_premium", "g_refill", "g_taglish", "g_wait_long", "g_promo", "g_atmos", "g_wait_mild", "x5"],
    st_greenhills: ["g_family", "g_soup", "g_value", "g_portion", "g_short"],
    st_fairview: ["g_family", "g_refill", "g_bland"],
    st_tomas: ["g_premium", "g_taglish", "g_parking", "g_promo", "g_short", "x4"],
    st_kodo_jazz: ["k_hot", "k_clean", "k_pricey", "k_cold"],
  },
};

// Recurring issues seeded into the week before, so 7-day repetition shows up.
const INJECTED: Record<string, Record<string, TemplateId>> = {
  st_fairview: { "2026-09-30": "g_flavor_mild", "2026-10-02": "g_flavor_mild", "2026-10-04": "g_flavor_mild" },
  st_maax: { "2026-10-01": "g_wait_mild", "2026-10-03": "g_wait_mild" },
};

const VOLUME: Record<string, [number, number]> = {
  st_maax: [4, 8],
  st_greenhills: [2, 6],
  st_fairview: [1, 4],
  st_tomas: [3, 7],
  st_kodo_jazz: [2, 5],
};

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: string): () => number {
  let a = hashString(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function pickTemplate(rand: () => number, pool: TemplateId[]): TemplateId {
  const roll = rand();
  if (roll < 0.12) return pick(rand, ["x5", "x4", "x5", "x3"] as TemplateId[]);
  const target = roll < 0.15 ? [1, 2] : roll < 0.23 ? [3] : roll < 0.45 ? [4] : [5];
  const candidates = pool.filter((id) => target.includes(TEMPLATES[id].rating));
  return pick(rand, candidates.length > 0 ? candidates : pool);
}

function templatesFor(store: Store, date: string): TemplateId[] {
  const scripted = SCRIPTED[date]?.[store.id];
  if (scripted) return scripted;

  const rand = seededRandom(`${store.id}|${date}|count`);
  if (rand() < 0.08) return [];
  const [min, max] = VOLUME[store.id] ?? [1, 4];
  const count = min + Math.floor(rand() * (max - min + 1));

  const pool = templatePool(store.brand);
  const ids = Array.from({ length: count }, () => pickTemplate(rand, pool));
  const injected = INJECTED[store.id]?.[date];
  if (injected) ids[0] = injected;
  return ids;
}

export function generateReviews(store: Store, date: string): AnalyzedReview[] {
  const rand = seededRandom(`${store.id}|${date}|detail`);
  return templatesFor(store, date).map((templateId, i) => {
    const t = TEMPLATES[templateId];
    const id = `${store.slug}-${date}-${i}`;
    // Manila local time between 10:00 and 22:59, stored as UTC.
    const hour = 10 + Math.floor(rand() * 13);
    const minute = Math.floor(rand() * 60);
    const local = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+08:00`);
    const createdAt = local.toISOString();
    const analyzedAt = `${addDays(date, 1)}T06:05:00+08:00`;

    return {
      id,
      googleReviewId: `mock_${id}`,
      storeId: store.id,
      reviewerName: pick(rand, REVIEWER_NAMES),
      rating: t.rating,
      reviewText: t.text,
      googleCreatedAt: createdAt,
      localReviewDate: date,
      updatedAt: createdAt,
      analysis:
        t.text === null
          ? null
          : {
              reviewId: id,
              sentiment: t.sentiment,
              sentimentScore: { positive: 0.8, mixed: 0.2, neutral: 0, negative: -0.7 }[t.sentiment],
              topics: t.mentions.map(([topic, polarity, label]) => ({ topic, polarity, label })),
              summaryKo: t.summaryKo,
              isCritical: t.rating <= 2,
              analyzedAt,
            },
    };
  });
}
