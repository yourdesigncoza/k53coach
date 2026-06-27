import { createBrowserClient } from "@supabase/ssr";

export const supabaseEnvReady =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Browser Supabase client. Returns `null` when env vars are absent so the
 * scaffold runs (auth/paywall in demo mode) before Supabase is provisioned.
 */
export function createClient() {
  if (!supabaseEnvReady) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
