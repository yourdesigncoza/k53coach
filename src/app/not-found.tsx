import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Compass, Home } from "lucide-react";
import "./globals.css";
import { Logo } from "@/components/brand/logo";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { fontVariables } from "@/lib/fonts";
import { routing, type Locale } from "@/i18n/routing";
import en from "../../messages/en.json";
import af from "../../messages/af.json";

/**
 * The app-wide 404.
 *
 * It lives at the app root — NOT under `[locale]` — because in Next 16 the
 * not-found boundary is resolved from the ROOT loader tree: a nested
 * `[locale]/not-found.tsx` is never rendered, so every 404 (an unmatched URL
 * *and* every `notFound()` call inside a route) fell through to the framework's
 * unstyled "This page could not be found". This file is the only place that
 * catches all of them.
 *
 * Two consequences of sitting at the root, both deliberate:
 *  1. There is no root layout (the real one is `[locale]/layout.tsx`), so this
 *     imports globals.css and the brand fonts itself rather than inheriting
 *     them — see the note on <main> for where the classes have to go.
 *  2. It is outside `NextIntlClientProvider`, so `useTranslations` is not
 *     available. Strings come straight out of the same `messages/*.json` the
 *     rest of the app uses, and the locale is resolved from the request itself
 *     (see `resolveLocale`).
 */

const MESSAGES: Record<Locale, (typeof en)["notFound"]> = {
  en: en.notFound,
  af: af.notFound,
};

export async function generateMetadata(): Promise<Metadata> {
  const t = MESSAGES[await resolveLocale()];
  return {
    // `absolute` opts out of the locale layout's `%s · K53 Coach` template,
    // which otherwise doubles the suffix on a notFound() thrown inside a route.
    title: { absolute: `${t.title} · K53 Coach` },
    description: t.body,
    robots: { index: false, follow: true },
  };
}

function isLocale(value: string | undefined): value is Locale {
  return !!value && (routing.locales as readonly string[]).includes(value);
}

/**
 * Best-effort locale for a request that, by definition, matched no `[locale]`
 * route, so there is no `params.locale` to read.
 *   1. `x-next-intl-locale` — set by the locale middleware in `proxy.ts`, so a
 *      dead link under /af/… stays Afrikaans. Absent for the paths the proxy
 *      matcher skips (/prototype, /styleguide, *.txt …).
 *   2. `NEXT_LOCALE` — the cookie next-intl writes once a learner picks a
 *      language; covers those skipped paths for a returning visitor.
 *   3. Accept-Language, then the default locale.
 */
async function resolveLocale(): Promise<Locale> {
  const headerLocale = (await headers()).get("x-next-intl-locale") ?? undefined;
  if (isLocale(headerLocale)) return headerLocale;

  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const accepted = ((await headers()).get("accept-language") ?? "")
    .split(",")
    .map((part) => part.split(";")[0]?.trim().slice(0, 2).toLowerCase())
    .find(isLocale);

  return accepted ?? routing.defaultLocale;
}

export default async function NotFound() {
  const locale = await resolveLocale();
  const t = MESSAGES[locale];

  return (
    <html lang={locale}>
      <body>
        {/* Every class that matters hangs off this <main>, not off <html>/<body>:
            Next renders this file inside its own built-in document shell, which
            drops any attributes we put on those two tags. `theme-dark` + the
            font variables are inherited from here by everything below. */}
        <main
          lang={locale}
          className={`${fontVariables} theme-dark grid min-h-dvh place-items-center bg-cover bg-center bg-no-repeat px-4 py-12 antialiased md:px-8`}
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(18,16,22,.88) 0%, rgba(18,16,22,.45) 42%, rgba(18,16,22,.72) 78%, var(--ink-850) 100%), url('/img/hero-night-road.jpg')",
            backgroundColor: "var(--ink-850)",
            color: "var(--ivory)",
          }}
        >
          <div className="w-full max-w-lg text-center [text-shadow:0_2px_28px_rgba(0,0,0,.55)]">
            <a
              href={`/${locale}`}
              aria-label="K53 Coach"
              className="inline-flex text-ivory"
            >
              <Logo />
            </a>

            {/* A road-sign glyph, not the numeral "404" — learners are not
                developers and an HTTP status code means nothing to them. */}
            <span
              aria-hidden="true"
              className="mt-8 grid size-20 place-items-center rounded-full border border-gold-400/30 text-gold-400 md:size-24"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgba(255,196,107,.18), rgba(255,196,107,.04) 70%)",
                boxShadow: "var(--glow-gold)",
                marginInline: "auto",
              }}
            >
              <Icon name="i-sign" className="size-9 md:size-11" />
            </span>

            <h1 className="font-display mt-6 text-2xl font-bold tracking-tight md:text-3xl">
              {t.title}
            </h1>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-mist">
              {t.body}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                className="h-11 rounded-xl px-5"
                render={
                  <a href={`/${locale}`}>
                    <Home className="size-4" /> {t.home}
                  </a>
                }
              />
              <Button
                variant="outline"
                className="h-11 rounded-xl px-5"
                render={
                  <a href={`/${locale}/dashboard`}>
                    <Compass className="size-4" /> {t.dashboard}
                  </a>
                }
              />
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
