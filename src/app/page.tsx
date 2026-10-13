import { DateNavigator } from "@/components/DateNavigator";
import { GlobalSummary } from "@/components/GlobalSummary";
import { StoreAnalysis } from "@/components/StoreAnalysis";
import { StoreList } from "@/components/StoreList";
import { dataSource, latestReviewDate, resolveRange } from "@/lib/data";
import { formatDateTime, formatRange, formatRangeShort, rangeDays } from "@/lib/date";

export default async function Page(props: PageProps<"/">) {
  const params = await props.searchParams;
  const storeParam = typeof params.store === "string" ? params.store : undefined;

  const maxDate = latestReviewDate();
  const minDate = await dataSource.minDate();
  const range = resolveRange(params, minDate, maxDate);
  const data = await dataSource.getDashboard(range, storeParam);

  const selectedSlug = data.selected?.store.slug;
  const storeNames = Object.fromEntries(data.stores.map((r) => [r.store.id, r.store.shortName]));
  const days = rangeDays(data.range);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-10 lg:px-6">
      <header className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-page/90 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Philippines Review Dashboard
          </p>
          <h1 className="text-lg font-semibold tracking-tight">
            {days === 1 ? "Review Date" : "Review Period"} · {formatRange(data.range)}
            {days > 1 && <span className="ml-1.5 text-sm font-normal text-muted">({days} days)</span>}
          </h1>
          <p className="text-xs text-ink-2">
            Compared with {formatRangeShort(data.compareRange)}
            {" · "}
            {data.generatedAt ? `Generated ${formatDateTime(data.generatedAt)}` : "Not generated yet"}
          </p>
        </div>
        <DateNavigator range={data.range} minDate={data.minDate} maxDate={data.maxDate} storeSlug={selectedSlug} />
      </header>

      <main className="space-y-4">
        <StoreList rows={data.stores} range={data.range} selectedSlug={selectedSlug} />

        <GlobalSummary
          kpis={data.global}
          brief={data.brief}
          range={data.range}
          compareRange={data.compareRange}
        />

        {data.selected ? (
          <StoreAnalysis
            detail={data.selected}
            range={data.range}
            compareRange={data.compareRange}
            allReviews={data.allReviews}
            storeNames={storeNames}
          />
        ) : (
          <p className="text-sm text-muted">No active stores.</p>
        )}
      </main>
    </div>
  );
}
