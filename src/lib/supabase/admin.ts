import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Service-role Supabase client — bypasses RLS. Server-only, and only for
 * privileged admin operations that the user-context client can't do (e.g.
 * looking a user up by email via the Auth admin API to grant an entitlement).
 *
 * Returns `null` when the service-role key is absent (demo mode / key not set on
 * the host). NEVER import this into client code or expose the key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
