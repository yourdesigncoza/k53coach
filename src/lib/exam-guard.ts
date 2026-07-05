import type { User } from "@supabase/supabase-js";
import { redirect } from "@/i18n/navigation";
import { getUser } from "@/lib/supabase/queries";
import { getActiveEntitlement, type ActiveEntitlement } from "@/lib/entitlements";

/**
 * Gate for the paid mock-exam area. Server-side only (call from a `/mock/**`
 * server page, passing its `locale`):
 *   - not signed in  → redirect to /auth
 *   - no active paid entitlement → redirect to /paywall
 * Returns the user + entitlement when access is granted.
 *
 * Route handlers can't redirect the browser this way — they should call
 * getUser()/getActiveEntitlement() directly and return 401/402 JSON instead.
 */
export async function requireEntitledUser(
  locale: string,
): Promise<{ user: User; entitlement: ActiveEntitlement }> {
  const user = await getUser();
  if (!user) redirect({ href: "/auth", locale });
  const entitlement = await getActiveEntitlement(user!.id);
  if (!entitlement) redirect({ href: "/paywall", locale });
  return { user: user!, entitlement: entitlement! };
}
