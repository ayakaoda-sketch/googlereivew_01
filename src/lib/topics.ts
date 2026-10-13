import { getDictionary, type Locale } from "./i18n";
import type { TopicKey } from "./types";

// Mirrors the planned `topics` master table; labels live in the i18n dictionary.
export const TOPIC_KEYS: TopicKey[] = [
  "food_quality",
  "flavor",
  "meat_quality",
  "service",
  "staff",
  "waiting_time",
  "cleanliness",
  "price_value",
  "promotion",
  "portion",
  "side_dishes",
  "soup",
  "atmosphere",
  "accessibility",
  "other",
];

export function topicLabel(key: TopicKey, locale: Locale = "en"): string {
  return getDictionary(locale).topics[key] ?? key;
}
