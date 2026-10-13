"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAX_RANGE_DAYS } from "@/lib/data/source";
import { addDays, formatRange, rangeDays, type DateRange } from "@/lib/date";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import { dashboardHref } from "@/lib/url";

/** Moves a period by whole periods, keeping its length and staying inside [min, max]. */
function shift(range: DateRange, periods: number, min: string, max: string): DateRange {
  const n = rangeDays(range);
  let from = addDays(range.from, n * periods);
  let to = addDays(range.to, n * periods);
  if (to > max) [from, to] = [addDays(max, -(n - 1)), max];
  if (from < min) [from, to] = [min, addDays(min, n - 1)];
  return { from, to };
}

function presets(t: Dictionary, min: string, max: string): { label: string; range: DateRange }[] {
  const clamp = (r: DateRange): DateRange => ({ from: r.from < min ? min : r.from, to: r.to });
  const monthStart = `${max.slice(0, 8)}01`;
  const lastMonthEnd = addDays(monthStart, -1);
  return [
    { label: t.presetLatestDay, range: { from: max, to: max } },
    { label: t.presetLastDays(7), range: clamp({ from: addDays(max, -6), to: max }) },
    { label: t.presetLastDays(14), range: clamp({ from: addDays(max, -13), to: max }) },
    { label: t.presetLastDays(30), range: clamp({ from: addDays(max, -29), to: max }) },
    { label: t.presetThisMonth, range: clamp({ from: monthStart, to: max }) },
    { label: t.presetLastMonth, range: clamp({ from: `${lastMonthEnd.slice(0, 8)}01`, to: lastMonthEnd }) },
  ].filter((p) => p.range.to >= min && p.range.from <= p.range.to);
}

export function DateNavigator({
  range,
  minDate,
  maxDate,
  storeSlug,
  locale,
}: {
  range: DateRange;
  minDate: string;
  maxDate: string;
  storeSlug?: string;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(range);
  const rootRef = useRef<HTMLDivElement>(null);

  const days = rangeDays(range);
  const canPrev = range.from > minDate;
  const canNext = range.to < maxDate;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (next: DateRange) => {
    setOpen(false);
    router.push(dashboardHref(next, storeSlug));
  };

  const draftError =
    !draft.from || !draft.to
      ? t.errBothDates
      : draft.from > draft.to
        ? t.errOrder
        : draft.from < minDate || draft.to > maxDate
          ? t.errOutside
          : rangeDays(draft) > MAX_RANGE_DAYS
            ? t.errTooLong(MAX_RANGE_DAYS)
            : null;

  const arrow =
    "grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface text-ink-2 hover:bg-surface-2";
  const disabled = "grid h-8 w-8 place-items-center rounded-lg border border-line text-muted opacity-40";
  const dateInput =
    "h-8 w-full rounded-lg border border-line bg-surface px-2 text-sm text-ink [color-scheme:light_dark]";

  return (
    <div ref={rootRef} className="relative flex items-center gap-1.5">
      {canPrev ? (
        <Link
          href={dashboardHref(shift(range, -1, minDate, maxDate), storeSlug)}
          className={arrow}
          aria-label={days === 1 ? t.prevDay : t.prevPeriod}
        >
          ‹
        </Link>
      ) : (
        <span className={disabled} aria-hidden>‹</span>
      )}

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setDraft(range);
          setOpen((o) => !o);
        }}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:bg-surface-2"
      >
        <span className="tabular-nums">{formatRange(range, locale)}</span>
        {days > 1 && <span className="text-xs font-normal text-muted">{t.daysShort(days)}</span>}
        <span aria-hidden className="text-[10px] text-muted">▾</span>
      </button>

      {canNext ? (
        <Link
          href={dashboardHref(shift(range, 1, minDate, maxDate), storeSlug)}
          className={arrow}
          aria-label={days === 1 ? t.nextDay : t.nextPeriod}
        >
          ›
        </Link>
      ) : (
        <span className={disabled} aria-hidden>›</span>
      )}

      {range.to !== maxDate && (
        <Link
          href={dashboardHref({ from: addDays(maxDate, -(days - 1)), to: maxDate }, storeSlug)}
          className="ml-1 h-8 rounded-lg px-2 text-xs leading-8 font-medium text-series hover:underline"
        >
          {t.latest}
        </Link>
      )}

      {open && (
        <div
          role="dialog"
          aria-label={t.selectPeriod}
          className="absolute right-0 top-10 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-3 shadow-lg"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{t.quickSelect}</div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {presets(t, minDate, maxDate).map((p) => {
              const active = p.range.from === range.from && p.range.to === range.to;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => go(p.range)}
                  className={`rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium ${
                    active ? "border-ink bg-ink text-surface" : "border-line text-ink-2 hover:bg-surface-2"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <form
            className="mt-3 border-t border-line pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draftError) go(draft);
            }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{t.customRange}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs text-ink-2">
                {t.from}
                <input
                  type="date"
                  className={`mt-1 ${dateInput}`}
                  value={draft.from}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                />
              </label>
              <label className="text-xs text-ink-2">
                {t.to}
                <input
                  type="date"
                  className={`mt-1 ${dateInput}`}
                  value={draft.to}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                />
              </label>
            </div>
            <p className="mt-2 min-h-4 text-[11px] text-ink-2">
              {draftError ? <span className="text-crit">{draftError}</span> : t.rangeHint(rangeDays(draft))}
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-8 rounded-lg px-3 text-xs font-medium text-ink-2 hover:bg-surface-2"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={draftError !== null}
                className="h-8 rounded-lg bg-ink px-3 text-xs font-medium text-surface disabled:opacity-40"
              >
                {t.apply}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
