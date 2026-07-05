import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { HeaderAuthActions } from "@/components/header-auth-actions";

/**
 * The dark marketing top-nav — the single storefront header for EVERY public
 * ("frontend") page: landing, readiness flow, auth, paywall, legal. It is always
 * dark (self-contained `theme-dark`) so it reads as one storefront chrome even
 * on white product bodies. Signed-in `(app)` pages keep their own shell; `admin`
 * keeps its own header. Section links point at `/#…` so they resolve to the
 * landing (and scroll) from any page.
 */
export function SiteHeader() {
  const t = useTranslations("landing");

  return (
    <header className="theme-dark pt-safe sticky top-0 z-30 border-b border-white/5 bg-ink-900/70 text-foreground backdrop-blur-md">
      <div className="mx-auto flex w-[min(1180px,92vw)] items-center gap-6 py-3.5">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
        <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-mist md:flex">
          <Link href="/#how" className="hover:text-ivory">
            {t("navHow")}
          </Link>
          <Link href="/#pricing" className="hover:text-ivory">
            {t("navPricing")}
          </Link>
          <Link href="/#parents" className="hover:text-ivory">
            {t("navParents")}
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:ml-0">
          <LanguageSwitcher />
          <HeaderAuthActions />
        </div>
      </div>
    </header>
  );
}
