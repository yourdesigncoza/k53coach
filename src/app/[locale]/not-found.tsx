import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Home, Compass } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

/**
 * Branded 404 for any unmatched route or `notFound()` call inside the locale
 * tree. Uses the storefront chrome + the gold K mark so a dead link still feels
 * like the app rather than the framework default.
 */
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-lg flex-1 place-items-center px-5 py-16 text-center">
        <div>
          <p
            className="font-display text-7xl font-bold tracking-tight"
            style={{
              background: "linear-gradient(180deg, var(--gold-300), var(--gold-400))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            404
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("body")}</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              className="h-11 rounded-xl"
              render={
                <Link href="/">
                  <Home className="size-4" /> {t("home")}
                </Link>
              }
            />
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              render={
                <Link href="/dashboard">
                  <Compass className="size-4" /> {t("dashboard")}
                </Link>
              }
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
