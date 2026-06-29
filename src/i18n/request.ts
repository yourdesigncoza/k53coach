import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getOverrides, mergeOverrides } from "@/lib/translations";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const base = (await import(`../../messages/${locale}.json`)).default;
  // Admin-editable DB overrides merged over the shipped JSON. getOverrides is a
  // cookie-less, fail-open, tag-cached fetch — safe to await here without making
  // the statically-generated [locale] tree dynamic.
  const overrides = await getOverrides(locale);

  return {
    locale,
    messages: mergeOverrides(base, overrides),
  };
});
