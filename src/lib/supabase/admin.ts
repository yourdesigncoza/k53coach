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

export type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

/**
 * Resolve an email address to an auth user id via the Auth admin API (paged — it
 * has no query-by-email). Case-insensitive. Returns null when nobody matches.
 *
 * Used by both the admin grant UI and the PayFast ITN handler, which has to match
 * a payment to an account when the checkout didn't carry the user id.
 */
export async function findUserIdByEmail(
  admin: AdminClient,
  email: string,
): Promise<string | null> {
  const target = email.trim().toLowerCase();
  if (!target) return null;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) return null;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < 200) return null; // last page
  }
  return null;
}
