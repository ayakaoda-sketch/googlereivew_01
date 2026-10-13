import { DateNavigator } from "@/components/DateNavigator";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ReviewFeed } from "@/components/ReviewFeed";
import { StoreList } from "@/components/StoreList";
import { dataSource, latestReviewDate, resolveRange } from "@/lib/data";
import { formatDateTime, formatRange, formatRangeShort, rangeDays } from "@/lib/date";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export default async function Page(props: PageProps<"/">) {
  const params = await props.searchParams;
  const storeParam = typeof params.store === "string" ? params.store : undefined;
  const locale = await getLocale();
  const t = getDictionary(locale);

  const maxDate = latestReviewDate();
  const minDate = await dataSource.minDate();
  const range = resolveRange(params, minDate, maxDate);
  const data = await dataSource.getDashboard(range, storeParam, locale);

  // Only an explicit, valid ?store= narrows the feed; otherwise every store is shown.
  const selectedSlug = data.stores.some((r) => r.store.slug === storeParam) ? storeParam : undefined;
  const feedStores = data.stores
    .map((r) => r.store)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({ id: s.id, slug: s.slug, name: s.shortName }));
  const days = rangeDays(data.range);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-10 lg:px-6">
      <header className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-page/90 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t.appTitle}</p>
          <h1 className="text-lg font-semibold tracking-tight">
            {days === 1 ? t.reviewDate : t.reviewPeriod} · {formatRange(data.range, locale)}
            {days > 1 && (
              <span className="ml-1.5 text-sm font-normal text-muted">({t.daysCount(days)})</span>
            )}
          </h1>
          <p className="text-xs text-ink-2">
            {t.comparedWith(formatRangeShort(data.compareRange, locale))}
            {" · "}
            {data.generatedAt ? t.generated(formatDateTime(data.generatedAt, locale)) : t.notGenerated}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateNavigator
            range={data.range}
            minDate={data.minDate}
            maxDate={data.maxDate}
            storeSlug={selectedSlug}
            locale={locale}
          />
          <LanguageToggle locale={locale} />
        </div>
      </header>

      <main className="space-y-4">
        <StoreList rows={data.stores} range={data.range} selectedSlug={selectedSlug} locale={locale} />

        {data.stores.length > 0 ? (
          <ReviewFeed
            key={`${data.range.from}-${data.range.to}`}
            reviews={data.allReviews}
            stores={feedStores}
            selectedSlug={selectedSlug}
            range={data.range}
            locale={locale}
          />
        ) : (
          <p className="text-sm text-muted">{t.noActiveStores}</p>
        )}
      </main>
    </div>
  );
}
