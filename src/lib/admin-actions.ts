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

  if (action === "exclude") {
    const { error } = await supabase
      .from("road_signs")
      .update({ sa_relevant: false })
      .in("code", codes);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true, count: codes.length };
  }

  // Approve: pin svg_hash so the drift guard protects the artwork from now on.
  // Signs that reached the queue as `needs_review` were never auto-approved by
  // the pipeline, so they have no pinned hash yet — copy the at-ingest hash
  // (`source_rev`) the seed script recorded. Done per-row since the hash varies.
  const { data: rows, error: readErr } = await supabase
    .from("road_signs")
    .select("code, source_rev, svg_hash")
    .in("code", codes);
  if (readErr) return { ok: false, error: readErr.message };

  const verifiedAt = new Date().toISOString();
  const results = await Promise.all(
    (rows ?? []).map((r) =>
      supabase
        .from("road_signs")
        .update({
          asset_status: "approved",
          review_status: "approved",
          sa_relevant: true,
          approved_by: approver,
          verified_at: verifiedAt,
          // keep an existing pin; otherwise fall back to the at-ingest hash.
          svg_hash: r.svg_hash ?? r.source_rev,
        })
        .eq("code", r.code),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed) return { ok: false, error: failed.error!.message };
  revalidatePath("/admin");
  return { ok: true, count: codes.length };
}
