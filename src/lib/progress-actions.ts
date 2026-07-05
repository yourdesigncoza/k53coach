"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Reset the signed-in learner's progress: their per-question attempts, readiness
 * snapshots, and mock-exam attempts. Own-row only (RLS scopes every delete to
 * auth.uid(); the user client can't touch anyone else's data). This clears
 * everything feeding the readiness blend, topic accuracy, and mock history.
 */
export async function resetProgress() {
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Supabase not configured" };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, error: "Not signed in" };

  const uid = auth.user.id;
  for (const table of [
    "attempts",
    "readiness_results",
    "exam_attempts",
  ] as const) {
    const { error } = await supabase.from(table).delete().eq("user_id", uid);
    if (error) return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}
