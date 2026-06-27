"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/components/nav-items";

/** Fixed left sidebar — primary navigation on desktop (md+). */
export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" aria-label="Home">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border p-4">
        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Demo
        </span>
      </div>
    </aside>
  );
}
