import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * The dark marketing footer shared by every public ("frontend") page. Always
 * dark (self-contained `theme-dark` + `bg-background`) so it anchors the same
 * storefront chrome under white product bodies as under the dark landing.
 */
export function SiteFooter() {
  const t = useTranslations("landing");

  return (
    <footer className="theme-dark border-t border-ink-700 bg-background py-10 text-sm text-muted-dk">
      <div className="mx-auto flex w-[min(1180px,92vw)] flex-wrap items-center justify-between gap-4">
        <span>{t("footerRights")}</span>
        <Link href="/legal/privacy" className="text-gold-400 hover:text-gold-300">
          {t("privacy")} →
        </Link>
      </div>
    </footer>
  );
}
