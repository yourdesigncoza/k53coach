"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, getApprovedSignByCode } from "@/lib/supabase/queries";
import type { Topic } from "@/lib/types";
import {
  VEHICLE_CODES,
  EXAM_LIKELIHOODS,
  type VehicleCode,
  type ExamLikelihood,
} from "@/lib/exam";

const TOPICS: Topic[] = ["signs", "rules", "controls"];

export type SaveQuestionInput = {
  id: string; // immutable — set on create, never changed
  topic: Topic;
  difficulty: number;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  /** Artwork pointer — picks the SVG the quiz renders from /signs/<code>.svg.
   *  NOT the same thing as objectiveCode; keep the two straight. */
  signCode: string | null;
  /** Learning objective this item teaches: R1 / RR7 / VC3 / W306 / RM1. */
  objectiveCode: string | null;
  /** The specific regulation, Act section or chart entry the answer rests on.
   *  Required to approve — see validate(). */
  sourceCitation: string | null;
  inReadiness: boolean;
  reviewStatus: "draft" | "approved";
  // Exam curation
  inExam: boolean;
  examLikelihood: ExamLikelihood;
  vehicleCodes: VehicleCode[];
  topicTag: string | null;
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
  if (!EXAM_LIKELIHOODS.includes(input.examLikelihood))
    return "Invalid exam likelihood";
  if (
    !Array.isArray(input.vehicleCodes) ||
    input.vehicleCodes.some((c) => !VEHICLE_CODES.includes(c))
  )
    return "Invalid vehicle code";
  if (input.inExam && input.vehicleCodes.length === 0)
    return "Select at least one vehicle code to include in the exam pool";
  if (input.reviewStatus === "approved") {
    if (!input.prompt.trim()) return "A prompt is required to approve";
    if (!input.explanation.trim())
      return "An explanation is required to approve";
    if (input.options.some((o) => !o.trim()))
      return "Every option must be filled in to approve";
    // The accuracy gate (CLAUDE.md constraint 9). Approval without a citation is
    // what produced 227 approved items resting on nothing checkable — the bar is
    // a provision someone actually read, not a tick. Hard block: John, 2026-08-03.
    if (!input.sourceCitation?.trim())
      return "A source citation is required to approve — name the regulation, Act section or chart entry the answer rests on";
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

  // Approval provenance. Until now `review_status` could not tell a human click
  // apart from a script write, which is why 227 rows read "approved" with nobody
  // recorded. Stamped on every save-as-approved — saving it approved IS the act of
  // vouching for it, so a later edit legitimately refreshes the date — and CLEARED
  // on the way out, so a reopened item cannot keep a signature that no longer
  // refers to its content.
  const approved = input.reviewStatus === "approved";
  const provenance = approved
    ? { approved_by: auth.user?.id ?? null, verified_at: new Date().toISOString() }
    : { approved_by: null, verified_at: null };

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
      objective_code: input.objectiveCode,
      source_citation: input.sourceCitation,
      ...provenance,
      in_readiness: input.inReadiness,
      review_status: input.reviewStatus,
      in_exam: input.inExam,
      exam_likelihood: input.examLikelihood,
      vehicle_codes: input.vehicleCodes,
      topic_tag: input.topicTag,
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
