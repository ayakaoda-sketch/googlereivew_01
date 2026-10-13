import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale, type Locale } from "./i18n";

/** The viewer's language from the `lang` cookie; English when unset. */
export async function getLocale(): Promise<Locale> {
  return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}
