import type { TopicKey } from "./types";

// Mirrors the planned `topics` master table.
export const TOPICS: { key: TopicKey; label: string }[] = [
  { key: "food_quality", label: "Food Quality" },
  { key: "flavor", label: "Flavor" },
  { key: "meat_quality", label: "Meat Quality" },
  { key: "service", label: "Service" },
  { key: "staff", label: "Staff" },
  { key: "waiting_time", label: "Waiting Time" },
  { key: "cleanliness", label: "Cleanliness" },
  { key: "price_value", label: "Price / Value" },
  { key: "promotion", label: "Promotion" },
  { key: "portion", label: "Portion" },
  { key: "side_dishes", label: "Side Dishes" },
  { key: "soup", label: "Soup" },
  { key: "atmosphere", label: "Atmosphere" },
  { key: "accessibility", label: "Accessibility" },
  { key: "other", label: "Other" },
];

const LABELS = Object.fromEntries(TOPICS.map((t) => [t.key, t.label])) as Record<TopicKey, string>;

export function topicLabel(key: TopicKey): string {
  return LABELS[key] ?? key;
}
