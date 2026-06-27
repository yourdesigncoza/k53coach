import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // English + Afrikaans. Add more SA languages here later.
  locales: ["en", "af"],
  defaultLocale: "en",
  // Always show the locale in the URL: /en/... and /af/...
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  af: "Afrikaans",
};
