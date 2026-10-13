import type { AiSentiment, Polarity, TopicKey } from "../../types";

// Review text + the analysis an AI would plausibly return for it.
export interface ReviewTemplate {
  rating: 1 | 2 | 3 | 4 | 5;
  text: string | null;
  sentiment: AiSentiment;
  summaryEn: string | null;
  summaryKo: string | null;
  mentions: [TopicKey, Polarity, string][];
}

const P = "positive" as const;
const N = "negative" as const;

export const TEMPLATES = {
  // ---- Wolhwa Galbi (Korean BBQ) ----
  g_premium: {
    rating: 5,
    text: "The Premium Galbi was so tender and juicy! Our server grilled everything for us and kept checking on our table.",
    sentiment: "positive",
    summaryEn: "Tender Premium Galbi; staff grilled for the table",
    summaryKo: "프리미엄 갈비가 부드럽고 직원이 직접 구워줘 만족",
    mentions: [["meat_quality", P, "Premium Galbi quality"], ["staff", P, "Friendly staff"]],
  },
  g_refill: {
    rating: 5,
    text: "Unlimited side dishes and they refill super fast. The kimchi and japchae are the best.",
    sentiment: "positive",
    summaryEn: "Tasty side dishes with fast refills",
    summaryKo: "반찬이 맛있고 리필이 빨라 만족",
    mentions: [["side_dishes", P, "Great side dishes"], ["service", P, "Fast refill service"]],
  },
  g_family: {
    rating: 5,
    text: "Celebrated my mom's birthday here. Staff were very accommodating and the place is spotless.",
    sentiment: "positive",
    summaryEn: "Accommodating staff and a spotless store for a birthday",
    summaryKo: "생일 모임에 직원 응대가 좋고 매장이 깨끗했음",
    mentions: [["staff", P, "Friendly staff"], ["cleanliness", P, "Clean dining area"]],
  },
  g_taglish: {
    rating: 5,
    text: "Sobrang sarap ng galbi! Ang bait pa ng mga staff, babalik kami dito.",
    sentiment: "positive",
    summaryEn: "Delicious galbi and kind staff; plans to return",
    summaryKo: "갈비가 매우 맛있고 직원이 친절해 재방문 의사",
    mentions: [["meat_quality", P, "Premium Galbi quality"], ["staff", P, "Friendly staff"]],
  },
  g_value: {
    rating: 4,
    text: "Good food and reasonable price for the quality. A bit crowded during dinner.",
    sentiment: "positive",
    summaryEn: "Good quality for the price, but crowded at dinner",
    summaryKo: "가격 대비 품질은 좋으나 저녁 시간 혼잡",
    mentions: [["food_quality", P, "Delicious food"], ["price_value", P, "Good value for money"], ["atmosphere", N, "Crowded at peak hours"]],
  },
  g_soup: {
    rating: 4,
    text: "Loved the galbitang, very comforting. Service was okay.",
    sentiment: "positive",
    summaryEn: "Enjoyed the galbitang; service was average",
    summaryKo: "갈비탕 만족, 서비스는 보통",
    mentions: [["soup", P, "Tasty soup"]],
  },
  g_promo: {
    rating: 5,
    text: "Availed the weekday lunch promo, sulit! Meat quality is great for the price.",
    sentiment: "positive",
    summaryEn: "Weekday lunch promo is great value",
    summaryKo: "평일 런치 프로모션이 가성비 좋음",
    mentions: [["promotion", P, "Great promo deal"], ["price_value", P, "Good value for money"], ["meat_quality", P, "Premium Galbi quality"]],
  },
  g_wait_mild: {
    rating: 4,
    text: "Food was really good but we waited about 30 minutes for a table.",
    sentiment: "mixed",
    summaryEn: "Good food, but a 30-minute wait for a table",
    summaryKo: "음식은 좋았으나 입장까지 30분 대기",
    mentions: [["food_quality", P, "Delicious food"], ["waiting_time", N, "Long waiting time"]],
  },
  g_flavor_mild: {
    rating: 3,
    text: "Meat was good quality but the marinade tasted a bit mild for us. We expected a stronger flavor.",
    sentiment: "mixed",
    summaryEn: "Good meat quality, but the marinade was too mild",
    summaryKo: "고기 품질은 좋으나 양념 맛이 약하다는 의견",
    mentions: [["meat_quality", P, "Premium Galbi quality"], ["flavor", N, "Flavor too mild"]],
  },
  g_bland: {
    rating: 2,
    text: "The meat tasted a little bland and the soup was lukewarm when served. Not the same as our last visit.",
    sentiment: "negative",
    summaryEn: "Complaint: bland meat and lukewarm soup",
    summaryKo: "고기 맛이 싱겁고 국이 미지근하게 나왔다는 불만",
    mentions: [["flavor", N, "Flavor too mild"], ["soup", N, "Soup served lukewarm"]],
  },
  g_wait_long: {
    rating: 2,
    text: "The meat was good but we waited almost 40 minutes even with a reservation. Staff seemed overwhelmed.",
    sentiment: "negative",
    summaryEn: "40-minute wait despite a reservation; staff overwhelmed",
    summaryKo: "예약했음에도 40분 대기, 직원 응대 지연",
    mentions: [["meat_quality", P, "Premium Galbi quality"], ["waiting_time", N, "Long waiting time"], ["staff", N, "Staff overwhelmed"]],
  },
  g_cleaning: {
    rating: 4,
    text: "Great galbi, but our table took a while to be cleaned after the previous guests left.",
    sentiment: "mixed",
    summaryEn: "Great galbi, but slow table cleaning",
    summaryKo: "갈비는 좋았으나 테이블 정리가 늦음",
    mentions: [["meat_quality", P, "Premium Galbi quality"], ["cleanliness", N, "Slow table cleaning"]],
  },
  g_smoky: {
    rating: 4,
    text: "Delicious, but the dining area gets very smoky and our clothes smelled after.",
    sentiment: "mixed",
    summaryEn: "Tasty, but the dining area is very smoky",
    summaryKo: "맛은 좋으나 매장 내 연기가 많음",
    mentions: [["food_quality", P, "Delicious food"], ["atmosphere", N, "Smoky dining area"]],
  },
  g_slow: {
    rating: 3,
    text: "Food is okay. Service was slow, we had to call the staff several times for refills.",
    sentiment: "negative",
    summaryEn: "Slow service; had to ask for refills several times",
    summaryKo: "리필 요청을 여러 번 해야 할 만큼 서비스가 느림",
    mentions: [["service", N, "Slow service"], ["staff", N, "Inattentive staff"]],
  },
  g_pricey: {
    rating: 3,
    text: "Tasty but quite pricey for the portion size.",
    sentiment: "neutral",
    summaryEn: "Tasty, but pricey for the portion size",
    summaryKo: "맛은 있으나 양 대비 가격이 비쌈",
    mentions: [["price_value", N, "Pricey"], ["portion", N, "Small portions"]],
  },
  g_parking: {
    rating: 4,
    text: "Food is great. Parking is hard to find around the area on weekends though.",
    sentiment: "mixed",
    summaryEn: "Great food, but parking is hard on weekends",
    summaryKo: "음식은 좋으나 주말 주차가 어려움",
    mentions: [["food_quality", P, "Delicious food"], ["accessibility", N, "Hard to find parking"]],
  },
  g_short: {
    rating: 5,
    text: "Best Korean BBQ in the metro!",
    sentiment: "positive",
    summaryEn: "Praised as the best Korean BBQ in the metro",
    summaryKo: "최고의 한식 BBQ라는 호평",
    mentions: [["food_quality", P, "Delicious food"]],
  },
  g_rude: {
    rating: 1,
    text: "Very disappointing. Staff ignored us for a long time and the meat was tough. Will not come back.",
    sentiment: "negative",
    summaryEn: "Strong complaint about inattentive staff and tough meat",
    summaryKo: "직원 무관심과 질긴 고기에 대한 강한 불만",
    mentions: [["staff", N, "Inattentive staff"], ["meat_quality", N, "Tough meat"]],
  },
  g_portion: {
    rating: 5,
    text: "Generous portions — the set for 4 was enough for 5 of us.",
    sentiment: "positive",
    summaryEn: "Generous set portions",
    summaryKo: "세트 양이 넉넉함",
    mentions: [["portion", P, "Generous portions"], ["price_value", P, "Good value for money"]],
  },
  g_atmos: {
    rating: 5,
    text: "Nice ambiance, clean and spacious. Great for groups.",
    sentiment: "positive",
    summaryEn: "Spacious and clean; good for groups",
    summaryKo: "넓고 깨끗해 단체 방문에 적합",
    mentions: [["atmosphere", P, "Cozy atmosphere"], ["cleanliness", P, "Clean dining area"]],
  },

  // ---- Generic / KODOKODO ----
  k_hot: {
    rating: 5,
    text: "Food was delicious and served hot. The crew were cheerful!",
    sentiment: "positive",
    summaryEn: "Hot, delicious food and cheerful crew",
    summaryKo: "음식이 따뜻하고 맛있으며 직원이 밝음",
    mentions: [["food_quality", P, "Delicious food"], ["staff", P, "Friendly staff"]],
  },
  k_quick: {
    rating: 5,
    text: "Sarap! Perfect for lunch break, mabilis ang serve.",
    sentiment: "positive",
    summaryEn: "Tasty and quick; good for a lunch break",
    summaryKo: "맛있고 빠른 서빙으로 점심에 적합",
    mentions: [["food_quality", P, "Delicious food"], ["service", P, "Quick service"]],
  },
  k_pricey: {
    rating: 4,
    text: "Good Korean food here. A bit pricey but worth it.",
    sentiment: "positive",
    summaryEn: "A bit pricey but worth it",
    summaryKo: "가격은 다소 높지만 만족",
    mentions: [["food_quality", P, "Delicious food"], ["price_value", N, "Pricey"]],
  },
  k_noisy: {
    rating: 4,
    text: "Tasty food, but the place was noisy and crowded at lunch.",
    sentiment: "mixed",
    summaryEn: "Tasty, but noisy and crowded at lunch",
    summaryKo: "맛은 좋으나 점심 시간 혼잡",
    mentions: [["food_quality", P, "Delicious food"], ["atmosphere", N, "Crowded at peak hours"]],
  },
  k_cold: {
    rating: 2,
    text: "Our order took 35 minutes and the food arrived cold.",
    sentiment: "negative",
    summaryEn: "35-minute wait and the food arrived cold",
    summaryKo: "주문 후 35분 대기, 음식이 식어서 나옴",
    mentions: [["waiting_time", N, "Long waiting time"], ["food_quality", N, "Food arrived cold"]],
  },
  k_average: {
    rating: 3,
    text: "Flavor was okay, nothing special. Portion is small for the price.",
    sentiment: "neutral",
    summaryEn: "Average flavor; small portions for the price",
    summaryKo: "맛은 평범하고 가격 대비 양이 적음",
    mentions: [["flavor", N, "Average flavor"], ["portion", N, "Small portions"]],
  },
  k_clean: {
    rating: 5,
    text: "Clean place and friendly crew. Will come back!",
    sentiment: "positive",
    summaryEn: "Clean store and friendly crew",
    summaryKo: "깨끗한 매장과 친절한 직원",
    mentions: [["cleanliness", P, "Clean dining area"], ["staff", P, "Friendly staff"]],
  },
  k_promo: {
    rating: 5,
    text: "Great value promo bundle for the barkada!",
    sentiment: "positive",
    summaryEn: "Great-value group promo bundle",
    summaryKo: "단체 프로모션 세트 가성비 만족",
    mentions: [["promotion", P, "Great promo deal"], ["price_value", P, "Good value for money"]],
  },

  // ---- Rating only (no text → no AI analysis) ----
  x5: { rating: 5, text: null, sentiment: "positive", summaryEn: null, summaryKo: null, mentions: [] },
  x4: { rating: 4, text: null, sentiment: "positive", summaryEn: null, summaryKo: null, mentions: [] },
  x3: { rating: 3, text: null, sentiment: "neutral", summaryEn: null, summaryKo: null, mentions: [] },
} satisfies Record<string, ReviewTemplate>;

export type TemplateId = keyof typeof TEMPLATES;

/** Korean versions of the insight labels used above. */
export const LABEL_KO: Record<string, string> = {
  "Premium Galbi quality": "프리미엄 갈비 품질",
  "Friendly staff": "친절한 직원",
  "Great side dishes": "맛있는 반찬",
  "Fast refill service": "빠른 리필 서비스",
  "Clean dining area": "깨끗한 매장",
  "Delicious food": "맛있는 음식",
  "Good value for money": "좋은 가성비",
  "Crowded at peak hours": "피크 시간 혼잡",
  "Tasty soup": "맛있는 국물",
  "Great promo deal": "만족스러운 프로모션",
  "Long waiting time": "긴 대기 시간",
  "Flavor too mild": "싱거운 맛",
  "Soup served lukewarm": "미지근한 국",
  "Staff overwhelmed": "직원 응대 지연",
  "Slow table cleaning": "늦은 테이블 정리",
  "Smoky dining area": "매장 내 연기",
  "Slow service": "느린 서비스",
  "Inattentive staff": "무관심한 직원",
  Pricey: "비싼 가격",
  "Small portions": "적은 양",
  "Hard to find parking": "주차 어려움",
  "Tough meat": "질긴 고기",
  "Generous portions": "넉넉한 양",
  "Cozy atmosphere": "아늑한 분위기",
  "Quick service": "빠른 서빙",
  "Food arrived cold": "식은 음식",
  "Average flavor": "평범한 맛",
};

const WOLHWA_ONLY: TemplateId[] = [
  "g_premium", "g_refill", "g_family", "g_taglish", "g_value", "g_soup", "g_promo",
  "g_wait_mild", "g_flavor_mild", "g_bland", "g_wait_long", "g_cleaning", "g_smoky",
  "g_slow", "g_pricey", "g_parking", "g_short", "g_rude", "g_portion", "g_atmos",
];
const GENERIC: TemplateId[] = ["k_hot", "k_quick", "k_clean", "k_noisy", "k_cold", "k_average", "k_pricey", "k_promo"];

export function templatePool(brand: "WOLHWA_GALBI" | "KODOKODO"): TemplateId[] {
  return brand === "WOLHWA_GALBI" ? [...WOLHWA_ONLY, "k_hot", "k_clean", "k_quick"] : GENERIC;
}

export const REVIEWER_NAMES = [
  "Maria Santos", "Jose Reyes", "Ana Cruz", "Mark Bautista", "Kristine Dela Cruz",
  "Paolo Garcia", "Camille Mendoza", "Jerome Villanueva", "Bea Ramos", "Carlo Aquino",
  "Patricia Lim", "Miguel Tan", "Joanna Navarro", "Rafael Castillo", "Nicole Flores",
  "Angelo Torres", "Sofia Gonzales", "Daniel Ocampo", "Trisha Domingo", "Kevin Sy",
  "Hannah Uy", "Ramon Pascual", "Lea Fernandez", "Joshua Rivera", "Mika Salazar",
  "Gabriel Lopez", "Andrea Manalo", "Vince Co", "Ella Mercado", "Paul Javier",
];
