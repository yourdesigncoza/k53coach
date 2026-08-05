"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/queries";
import { shouldStampApproval } from "@/lib/sign-approval";
import type { SignContent } from "@/lib/signs";

export type SaveSignInput = {
  code: string;
  content: SignContent;
  assetStatus: string;
  reviewStatus: string;
  saRelevant?: boolean | null;
};

/**
 * Who is approving, resolved SERVER-SIDE from the session.
 *
 * Never take this from the client: a server action's arguments are attacker-
 * controlled, so an approver passed in from a component is an unauthenticated
 * claim about who signed off — on the one column whose entire job is to prove
 * that. `human:<uuid>` (not a bare name) so two reviewers stay distinguishable;
 * `human:admin` remains the fallback and matches the pre-existing rows.
 */
async function approverTag() {
  const supabase = await createClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: null };
  return data?.user ? `human:${data.user.id}` : "human:admin";
}

/**
 * Persist edited sign content + statuses. Admin-only (gate + RLS).
 *
 * A save that leaves the sign APPROVED stamps the approver, exactly as the
 * exceptions-queue Approve button does. Without this the editor's review-status
 * dropdown was a second, silent route to `approved` that recorded no approver
 * and pinned no `svg_hash` — so the sign shipped with no evidence of who cleared
 * it, and `scripts/signs/check-drift.mjs` skipped its artwork forever (the guard
 * only reads rows where `svg_hash is not null`).
 *
 * Re-stamping is deliberately conditional: only when the sign was NOT already
 * approved, or when its content changed under an existing approval. An approval
 * covers the text it was given, so edited prose needs a fresh one — but merely
 * opening an approved sign and saving it unchanged must not overwrite someone
 * else's genuine sign-off with the current user's.
 */
export async function saveSign(input: SaveSignInput) {
  if (!(await isAdmin())) return { ok: false, error: "Not authorised" };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };

  const { data: before, error: readErr } = await supabase
    .from("road_signs")
    .select("review_status, content, svg_hash, source_rev")
    .eq("code", input.code)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!before) return { ok: false, error: `No sign with code ${input.code}` };

  const stamp = shouldStampApproval(before, input);

  const { error } = await supabase
    .from("road_signs")
    .update({
      content: input.content as never,
      asset_status: input.assetStatus,
      review_status: input.reviewStatus,
      ...(input.saRelevant === undefined ? {} : { sa_relevant: input.saRelevant }),
      ...(stamp
        ? {
            approved_by: await approverTag(),
            verified_at: new Date().toISOString(),
            // Same pin the bulk action applies, so the drift guard covers a sign
            // however it was approved. Keep an existing pin; else the at-ingest hash.
            svg_hash: before.svg_hash ?? before.source_rev,
          }
        : {}),
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
 *    Records the human as approver, stamping `approved_by` — resolved from the
 *    session, not passed in, so two reviewers are told apart rather than both
 *    landing as the shared literal `human:admin`.
 *  - "exclude": mark not SA-relevant (sa_relevant=false) so it never serves.
 */
export async function bulkSignAction(
  codes: string[],
  action: "approve" | "exclude",
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
  const approver = await approverTag();
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
