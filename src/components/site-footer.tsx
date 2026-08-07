import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * The published legal documents, in the order a reader wants them. One array so
 * a fourth document is a one-line change, not a fourth copy of the markup.
 */
const LINKS = [
  { href: "/legal/terms", key: "terms" },
  { href: "/legal/privacy", key: "privacy" },
  { href: "/legal/refund", key: "refund" },
] as const;

/**
 * The dark marketing footer shared by every public ("frontend") page. Always
 * dark (self-contained `theme-dark` + `bg-background`) so it anchors the same
 * storefront chrome under white product bodies as under the dark landing.
 */
export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="theme-dark border-t border-ink-700 bg-background py-10 text-sm text-muted-dk">
      <div className="mx-auto flex w-[min(1180px,92vw)] flex-wrap items-center justify-between gap-4">
        <span>{t("rights")}</span>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {LINKS.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className="text-gold-400 hover:text-gold-300"
            >
              {t(key)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
