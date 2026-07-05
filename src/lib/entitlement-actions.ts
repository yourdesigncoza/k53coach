"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/supabase/queries";
import { ENTITLEMENT_DAYS } from "@/lib/entitlements";

/**
 * Grant a paid entitlement to a user by email. Admin-only. Uses the service-role
 * Auth admin API to resolve the email → user id (the user-context client can't
 * list other users), then inserts the grant under RLS as the admin.
 */
export async function grantEntitlement(email: string, days = ENTITLEMENT_DAYS) {
  if (!(await isAdmin())) return { ok: false as const, error: "Not authorised" };

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false as const, error: "Email is required" };

  const admin = createAdminClient();
  if (!admin)
    return {
      ok: false as const,
      error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server",
    };

  // Resolve the email to a user id via the Auth admin API (paged).
  let userId: string | null = null;
  for (let page = 1; page <= 20 && !userId; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) return { ok: false as const, error: error.message };
    const match = data.users.find((u) => u.email?.toLowerCase() === trimmed);
    if (match) userId = match.id;
    if (data.users.length < 200) break; // last page
  }
  if (!userId)
    return { ok: false as const, error: `No user found for ${trimmed}` };

  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Supabase not configured" };
  const { data: auth } = await supabase.auth.getUser();

  const expires = new Date();
  expires.setDate(expires.getDate() + days);

  const { error } = await supabase.from("entitlements").insert({
    user_id: userId,
    source: "admin",
    expires_at: expires.toISOString(),
    granted_by: auth.user?.id ?? null,
    reference: `admin grant · ${days}d`,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/entitlements");
  return { ok: true as const };
}

/**
 * TEST ONLY: the current signed-in user grants THEMSELVES 90 days of access,
 * standing in for a real payment until PayFast/Yoco is wired. Enabled only when
 * NEXT_PUBLIC_ENABLE_TEST_CHECKOUT=true (guarded server-side too, so it can't be
 * triggered from a build where payments are live). Returns { needsAuth } when the
 * user isn't signed in so the client can send them to /auth first.
 */
export async function startTestCheckout(days = ENTITLEMENT_DAYS) {
  if (process.env.NEXT_PUBLIC_ENABLE_TEST_CHECKOUT !== "true")
    return { ok: false as const, error: "Test checkout is not enabled" };

  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Supabase not configured" };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, needsAuth: true as const };

  // The entitlements INSERT policy requires is_admin(); a normal learner can't
  // self-insert under RLS, so use the service-role client (payments will do the
  // same). Falls back to the user client if the key is absent (works for admins).
  const writer = createAdminClient() ?? supabase;

  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  const { error } = await writer.from("entitlements").insert({
    user_id: auth.user.id,
    source: "admin", // CHECK allows admin|payfast|yoco; 'admin' + reference marks it a test grant
    expires_at: expires.toISOString(),
    granted_by: auth.user.id,
    reference: "test checkout (self-grant)",
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

/** Revoke (delete) an entitlement grant. Admin-only (gate + RLS). */
export async function revokeEntitlement(id: string) {
  if (!(await isAdmin())) return { ok: false as const, error: "Not authorised" };
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Supabase not configured" };
  const { error } = await supabase.from("entitlements").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/entitlements");
  return { ok: true as const };
}
