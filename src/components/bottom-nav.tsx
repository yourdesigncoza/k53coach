"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/nav-items";

/** Thumb-friendly fixed bottom tab bar — primary navigation on mobile only. */
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-6", active && "stroke-[2.5]")} />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
