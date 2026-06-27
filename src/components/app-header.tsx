import Link from "next/link";
import { Logo } from "@/components/brand/logo";

/** Compact sticky header — shown on mobile only (desktop uses the sidebar). */
export function AppHeader() {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur md:hidden">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/dashboard" aria-label="Home">
          <Logo />
        </Link>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Demo
        </span>
      </div>
    </header>
  );
}
