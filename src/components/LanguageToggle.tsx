"use client";

import { useTransition } from "react";
import { setLocale } from "@/app/actions";
import { LOCALES, getDictionary, type Locale } from "@/lib/i18n";

export function LanguageToggle({ locale }: { locale: Locale }) {
  const [pending, startTransition] = useTransition();

  // The server re-renders on the cookie change, so AI summaries switch language too.
  const choose = (next: Locale) => {
    if (next !== locale) startTransition(() => setLocale(next));
  };

  return (
    <div
      role="group"
      aria-label={getDictionary(locale).language}
      className={`flex h-8 items-center rounded-lg border border-line bg-surface p-0.5 text-xs ${pending ? "opacity-60" : ""}`}
    >
      {LOCALES.map((l) => (
        <button
          key={l.key}
          type="button"
          lang={l.key}
          aria-pressed={l.key === locale}
          disabled={pending}
          onClick={() => choose(l.key)}
          className={`h-full rounded-md px-2.5 font-medium ${
            l.key === locale ? "bg-ink text-surface" : "text-ink-2 hover:bg-surface-2"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
