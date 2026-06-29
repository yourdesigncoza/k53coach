"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, getApprovedSignByCode } from "@/lib/supabase/queries";
import type { Topic } from "@/lib/types";

const TOPICS: Topic[] = ["signs", "rules", "controls"];

export type SaveQuestionInput = {
  id: string; // immutable — set on create, never changed
  topic: Topic;
  difficulty: number;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  signCode: string | null;
  inReadiness: boolean;
  reviewStatus: "draft" | "approved";
};

/** Server-side validation — the DB CHECK constraints are the backstop; this gives
 *  friendly errors and enforces the approved-completeness contract. */
function validate(input: SaveQuestionInput): string | null {
  if (!TOPICS.includes(input.topic)) return "Invalid topic";
  if (![1, 2, 3].includes(input.difficulty)) return "Difficulty must be 1–3";
  if (!Array.isArray(input.options) || input.options.length < 2)
    return "At least 2 options are required";
  if (
    typeof input.answer !== "number" ||
    input.answer < 0 ||
    input.answer >= input.options.length
  )
    return "The correct answer must be one of the options";
  if (input.reviewStatus === "approved") {
    if (!input.prompt.trim()) return "A prompt is required to approve";
    if (!input.explanation.trim())
      return "An explanation is required to approve";
    if (input.options.some((o) => !o.trim()))
      return "Every option must be filled in to approve";
  }
  return null;
}

/** Create a blank draft with valid defaults (so the DB constraints hold) and
 *  return its immutable id for the editor redirect. Admin-only. */
export async function createQuestion(topic: Topic) {
  if (!(await isAdmin())) return { ok: false as const, error: "Not authorised" };
  if (!TOPICS.includes(topic)) return { ok: false as const, error: "Invalid topic" };
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Supabase not configured" };

  const id = `q-${topic}-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await supabase.from("questions").insert({
    id,
    topic,
    difficulty: 1,
    prompt: "",
    options: ["", ""],
    answer: 0,
    explanation: "",
    in_readiness: false,
    review_status: "draft",
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/questions");
  return { ok: true as const, id };
}

/** Save edits. `id` is never updated (immutable). Admin-only (gate + RLS). */
export async function saveQuestion(input: SaveQuestionInput) {
  if (!(await isAdmin())) return { ok: false as const, error: "Not authorised" };
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Supabase not configured" };

  const err = validate(input);
  if (err) return { ok: false as const, error: err };

  // A sign_code must resolve to an approved, SA-relevant sign — the quiz renders
  // /signs/<code>.svg, so a bad code would show a broken image.
  if (input.signCode) {
    const sign = await getApprovedSignByCode(input.signCode);
    if (!sign)
      return {
        ok: false as const,
        error: `Sign code "${input.signCode}" is not an approved, SA-relevant sign`,
      };
  }

  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("questions")
    .update({
      topic: input.topic,
      difficulty: input.difficulty,
      prompt: input.prompt,
      options: input.options,
      answer: input.answer,
      explanation: input.explanation,
      sign_code: input.signCode,
      in_readiness: input.inReadiness,
      review_status: input.reviewStatus,
      updated_by: auth.user?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/questions");
  revalidatePath(`/admin/questions/${input.id}`);
  return { ok: true as const };
}

/** Delete a question. Does NOT touch `attempts` (no FK) — historical attempts keep
 *  their question_id. Admin-only. */
export async function deleteQuestion(id: string) {
  if (!(await isAdmin())) return { ok: false as const, error: "Not authorised" };
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Supabase not configured" };
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/questions");
  return { ok: true as const };
}
