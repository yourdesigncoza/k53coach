"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/queries";
import type { SignContent } from "@/lib/signs";

export type SaveSignInput = {
  code: string;
  content: SignContent;
  assetStatus: string;
  reviewStatus: string;
  saRelevant?: boolean | null;
};

/** Persist edited sign content + statuses. Admin-only (gate + RLS). */
export async function saveSign(input: SaveSignInput) {
  if (!(await isAdmin())) return { ok: false, error: "Not authorised" };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };

  const { error } = await supabase
    .from("road_signs")
    .update({
      content: input.content as never,
      asset_status: input.assetStatus,
      review_status: input.reviewStatus,
      ...(input.saRelevant === undefined ? {} : { sa_relevant: input.saRelevant }),
    })
    .eq("code", input.code);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/admin/signs/${input.code}`);
  return { ok: true };
}

/**
 * Bulk-resolve exceptions-queue signs. Admin-only (gate + RLS).
 *  - "approve": ship the sign (asset + content gates approved, sa_relevant=true).
 *    Records the human as approver, stamping `approved_by`.
 *  - "exclude": mark not SA-relevant (sa_relevant=false) so it never serves.
 */
export async function bulkSignAction(
  codes: string[],
  action: "approve" | "exclude",
  approver = "human:admin",
) {
  if (!(await isAdmin())) return { ok: false, error: "Not authorised" };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };
  if (!codes.length) return { ok: false, error: "No signs selected" };

  const patch =
    action === "approve"
      ? {
          asset_status: "approved",
          review_status: "approved",
          sa_relevant: true,
          approved_by: approver,
          verified_at: new Date().toISOString(),
        }
      : { sa_relevant: false };

  const { error } = await supabase
    .from("road_signs")
    .update(patch)
    .in("code", codes);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true, count: codes.length };
}
