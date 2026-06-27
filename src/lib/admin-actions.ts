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
    })
    .eq("code", input.code);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}
