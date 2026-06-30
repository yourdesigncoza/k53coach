import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

/**
 * Next.js 16 "proxy" convention. Composes two concerns:
 *  1) next-intl locale routing (redirects, /en|/af prefixing)
 *  2) Supabase auth session refresh
 * We let next-intl build the response, then refresh the Supabase session onto
 * that same response so cookies from both are preserved.
 */
export async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);
  return updateSession(request, response);
}

export const config = {
  // Match all paths except Next internals, API, and static files.
  matcher: [
    "/((?!api|prototype|styleguide|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf|html|css|js|txt|woff|woff2)$).*)",
  ],
};
