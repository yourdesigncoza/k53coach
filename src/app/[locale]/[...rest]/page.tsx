import { notFound } from "next/navigation";

/**
 * Catch-all for any unmatched path under a locale (e.g. /en/nope). Without this,
 * an unmatched URL falls through to Next's framework-default 404 instead of our
 * branded `[locale]/not-found.tsx` (which only fires for notFound() inside a
 * matched route). This route matches last (specific routes win) and simply
 * hands off to that branded not-found boundary.
 */
export default function CatchAll() {
  notFound();
}
