"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/components/nav-items";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthStatus } from "@/components/auth-status";
import { AdminNavLink } from "@/components/admin-nav-link";

/** Fixed left sidebar — primary navigation on desktop (md+). */
export function SideNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <aside
      className="theme-dark fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink-700 md:flex"
      style={{ background: "var(--ink-900)" }}
    >
      <div className="flex h-16 items-center border-b border-ink-700 px-6">
        <Link href="/dashboard" aria-label="Home">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-gold-400/12 font-semibold text-gold-300 ring-1 ring-gold-400/15"
                      : "text-mist hover:bg-white/5 hover:text-ivory",
                  )}
                >
                  <Icon className="size-5" />
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex flex-col gap-3 border-t border-ink-700 p-4">
        <AdminNavLink className="w-full justify-center" />
        <AuthStatus />
        <LanguageSwitcher />
      </div>
    </aside>
  );
}
