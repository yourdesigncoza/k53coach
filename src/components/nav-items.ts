import { Home, BookOpen, ClipboardCheck, TrendingUp } from "lucide-react";

/** Single source of truth for primary nav (mobile bottom bar + desktop sidebar). */
export const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/mock", label: "Mock Test", icon: ClipboardCheck },
  { href: "/progress", label: "Progress", icon: TrendingUp },
] as const;
