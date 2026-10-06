"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, formatLong } from "@/lib/date";
import { dashboardHref } from "@/lib/url";

export function DateNavigator({
  date,
  minDate,
  maxDate,
  storeSlug,
}: {
  date: string;
  minDate: string;
  maxDate: string;
  storeSlug?: string;
}) {
  const router = useRouter();
  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  const canPrev = prev >= minDate;
  const canNext = next <= maxDate;

  const arrow =
    "grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface text-ink-2 hover:bg-surface-2";
  const disabled = "grid h-8 w-8 place-items-center rounded-lg border border-line text-muted opacity-40";

  return (
    <div className="flex items-center gap-1.5">
      {canPrev ? (
        <Link href={dashboardHref(prev, storeSlug)} className={arrow} aria-label="Previous day">
          ‹
        </Link>
      ) : (
        <span className={disabled} aria-hidden>‹</span>
      )}

      <label className="relative flex h-8 cursor-pointer items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:bg-surface-2">
        {formatLong(date)}
        <input
          type="date"
          aria-label="Review date"
          className="absolute inset-0 cursor-pointer opacity-0"
          value={date}
          min={minDate}
          max={maxDate}
          onChange={(e) => {
            const value = e.target.value;
            if (value && value >= minDate && value <= maxDate) {
              router.push(dashboardHref(value, storeSlug));
            }
          }}
          onClick={(e) => e.currentTarget.showPicker?.()}
        />
      </label>

      {canNext ? (
        <Link href={dashboardHref(next, storeSlug)} className={arrow} aria-label="Next day">
          ›
        </Link>
      ) : (
        <span className={disabled} aria-hidden>›</span>
      )}

      {date !== maxDate && (
        <Link
          href={dashboardHref(maxDate, storeSlug)}
          className="ml-1 h-8 rounded-lg px-2 text-xs leading-8 font-medium text-series hover:underline"
        >
          Latest
        </Link>
      )}
    </div>
  );
}
