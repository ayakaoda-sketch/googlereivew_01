import type { ReactNode } from "react";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { Brand, StoreStatus } from "@/lib/types";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-4 ${className}`}>{children}</section>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{children}</h2>
      {right}
    </div>
  );
}

export function formatRating(value: number | null, digits = 1): string {
  return value === null ? "–" : value.toFixed(digits);
}

export function Stars({ rating, locale = "en" }: { rating: number; locale?: Locale }) {
  const tone = rating <= 2 ? "text-crit" : rating === 3 ? "text-warn" : "text-ink";
  return (
    <span className={`font-semibold tabular-nums ${tone}`} aria-label={getDictionary(locale).starsAria(rating)}>
      ★ {rating}
    </span>
  );
}

const BRAND_LABEL: Record<Brand, string> = {
  WOLHWA_GALBI: "Wolhwa Galbi",
  KODOKODO: "KODOKODO",
};

export function BrandBadge({ brand }: { brand: Brand }) {
  return (
    <span className="inline-flex items-center rounded border border-line px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-ink-2">
      {BRAND_LABEL[brand]}
    </span>
  );
}

const STATUS: Record<StoreStatus, { icon: string; className: string }> = {
  good: { icon: "●", className: "bg-good-soft text-good" },
  watch: { icon: "▲", className: "bg-warn-soft text-warn" },
  critical: { icon: "■", className: "bg-crit-soft text-crit" },
};

export function StatusBadge({
  status,
  compact = false,
  locale = "en",
}: {
  status: StoreStatus;
  compact?: boolean;
  locale?: Locale;
}) {
  const s = STATUS[status];
  const label = getDictionary(locale).status[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.className}`}
      title={label}
    >
      <span aria-hidden className="text-[8px]">{s.icon}</span>
      {compact ? <span className="sr-only">{label}</span> : label}
    </span>
  );
}

/**
 * Signed change vs. the comparison day. `goodWhenUp` colors rating changes;
 * review-count changes stay neutral ink since more reviews is not good/bad by itself.
 */
export function Delta({
  value,
  digits = 0,
  suffix,
  goodWhenUp,
}: {
  value: number | null;
  digits?: number;
  suffix?: string;
  goodWhenUp?: boolean;
}) {
  if (value === null) return <span className="text-muted">–{suffix ? ` ${suffix}` : ""}</span>;
  const rounded = Number(value.toFixed(digits));
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "±";
  let tone = "text-ink-2";
  if (goodWhenUp !== undefined && rounded !== 0) {
    tone = rounded > 0 === goodWhenUp ? "text-good" : "text-crit";
  }
  return (
    <span className={`tabular-nums ${tone}`}>
      {sign}
      {Math.abs(rounded).toFixed(digits)}
      {suffix ? <span className="text-muted"> {suffix}</span> : null}
    </span>
  );
}
