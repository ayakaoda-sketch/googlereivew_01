export function dashboardHref(date: string, storeSlug?: string): string {
  const params = new URLSearchParams({ date });
  if (storeSlug) params.set("store", storeSlug);
  return `/?${params.toString()}`;
}
