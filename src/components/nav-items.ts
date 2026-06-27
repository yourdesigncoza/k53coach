import { Home, BookOpen, ClipboardCheck, TrendingUp } from "lucide-react";

/**
 * Single source of truth for primary nav (mobile bottom bar + desktop sidebar).
 * `key` indexes the "nav" message namespace for the label.
 */
export const NAV_ITEMS = [
  { href: "/dashboard", key: "home", icon: Home },
  { href: "/learn", key: "learn", icon: BookOpen },
  { href: "/mock", key: "mock", icon: ClipboardCheck },
  { href: "/progress", key: "progress", icon: TrendingUp },
] as const;
