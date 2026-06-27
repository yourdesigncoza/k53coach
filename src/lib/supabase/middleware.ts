import { type NextRequest, type NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const envReady =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Refreshes the Supabase auth session, writing any refreshed cookies onto the
 * `response` produced upstream (by the next-intl middleware). No-op when
 * Supabase env vars are absent. Returns the same response.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
) {
  if (!envReady) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touch the user to trigger token refresh; route gating happens later.
  await supabase.auth.getUser();
  return response;
}
