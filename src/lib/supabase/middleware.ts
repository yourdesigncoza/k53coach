import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const envReady =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Refreshes the Supabase auth session on each request so Server Components
 * always see a valid session. No-op when Supabase env vars are absent.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
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

  // Touch the user to trigger token refresh; do not gate routes here yet.
  await supabase.auth.getUser();
  return response;
}
