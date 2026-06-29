import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthStatus } from "@/components/auth-status";
import { AdminNavLink } from "@/components/admin-nav-link";
import { cn } from "@/lib/utils";

/**
 * Shared top bar for every page OUTSIDE the app shell — landing, the readiness
 * flow, auth, paywall, legal. The single source of truth for that chrome: the
 * logo (→ home), the EN/AF language switch, and login/account. Edit it here once
 * and it changes everywhere. (The `(app)` shell keeps its sidebar + bottom tabs;
 * `admin` keeps its own header.)
 */
export function GlobalHeader({
  width = "max-w-6xl",
  className,
}: {
  /** Inner-container max width — set per page so the bar aligns with content. */
  width?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "pt-safe sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-14 items-center justify-between gap-3 px-5 md:px-8",
          width,
        )}
      >
        <Link href="/" aria-label="Home" className="shrink-0">
          <Logo />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <LanguageSwitcher />
          <AdminNavLink />
          <AuthStatus className="min-w-0" />
        </div>
      </div>
    </header>
  );
}
