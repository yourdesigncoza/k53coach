import { createClient } from "@/lib/supabase/server";

// Pricing constants (ENTITLEMENT_DAYS, ENTITLEMENT_PRICE_ZAR) live in
// @/lib/pricing — dependency-free so client components can import them too.

export interface ActiveEntitlement {
  id: string;
  source: string;
  expires_at: string;
  granted_at: string;
}

/**
 * The user's active paid entitlement (latest unexpired grant), or null. Reads
 * under RLS (own-row) so a signed-in user can check their own access. Returns
 * null in demo mode (no Supabase) — callers treat that as "not entitled".
 */
export async function getActiveEntitlement(
  userId: string,
): Promise<ActiveEntitlement | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("entitlements")
    .select("id, source, expires_at, granted_at")
    .eq("user_id", userId)
    .gte("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}
