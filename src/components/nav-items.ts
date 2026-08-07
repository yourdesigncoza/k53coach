import { Home, BookOpen, ClipboardCheck, MessageCircle, TrendingUp } from "lucide-react";

/**
 * Single source of truth for primary nav (mobile bottom bar + desktop sidebar).
 * `key` indexes the "nav" message namespace for the label.
 *
 * `longKey` is an optional fuller label for the sidebar, which has a whole row
 * to itself. The bottom bar cannot use it — five `flex-1` tabs at `text-xs`
 * leave no room for two words — so a label that needs to be short on mobile and
 * explicit on desktop lives as two keys rather than one truncated string.
 */
export const NAV_ITEMS = [
  { href: "/dashboard", key: "appHome", icon: Home },
  { href: "/learn", key: "learn", icon: BookOpen },
  { href: "/mock", key: "mock", icon: ClipboardCheck },
  // Fifth tab. The bottom bar is flex-1 items at text-xs, so five fit — but only
  // just: a sixth needs a different layout, not a shorter label.
  { href: "/ask", key: "ask", longKey: "askLong", icon: MessageCircle },
  { href: "/progress", key: "progress", icon: TrendingUp },
] as const;
