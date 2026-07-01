import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthStatus } from "@/components/auth-status";
import { AdminNavLink } from "@/components/admin-nav-link";

/** Compact sticky header — shown on mobile only (desktop uses the sidebar). */
export function AppHeader() {
  return (
    <header
      className="theme-dark pt-safe sticky top-0 z-30 border-b border-ink-700 md:hidden"
      style={{ background: "var(--ink-900)" }}
    >
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/dashboard" aria-label="Home">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <AdminNavLink />
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
