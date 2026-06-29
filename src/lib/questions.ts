import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";
import type { Question, Topic } from "@/lib/types";

/**
 * DB4 question bank access. The `questions` table is the source of truth (DB-only);
 * learner getters explicitly filter `review_status='approved'` — never relying on RLS
 * alone, so an admin previewing learner pages still sees only approved content.
 */
export type QuestionRow = Tables<"questions">;

/** Map a DB row to the app's `Question` type, guarding the jsonb `options` shape. */
export function toQuestion(row: QuestionRow): Question {
  const options = Array.isArray(row.options) ? row.options.map(String) : [];
  return {
    id: row.id,
    topic: row.topic as Topic,
    difficulty: (row.difficulty ?? 1) as 1 | 2 | 3,
    prompt: row.prompt,
    options,
    answer: row.answer,
    explanation: row.explanation,
    ...(row.sign_code ? { signCode: row.sign_code } : {}),
  };
}

/** Curated free-readiness diagnostic set (approved + in_readiness). */
export async function getReadinessQuestions(): Promise<Question[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("questions")
    .select("*")
    .eq("review_status", "approved")
    .eq("in_readiness", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(toQuestion);
}

/** All approved questions for one topic — the practice bank. */
export async function getPracticeQuestions(topic: Topic): Promise<Question[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("questions")
    .select("*")
    .eq("review_status", "approved")
    .eq("topic", topic)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(toQuestion);
}

/** Admin: every question, any status (RLS admits all rows for admins). */
export async function getAllQuestions(): Promise<QuestionRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("questions")
    .select("*")
    .order("topic", { ascending: true })
    .order("sort_order", { ascending: true });
  return data ?? [];
}

/** Admin: a single question by id (any status). */
export async function getQuestionById(id: string): Promise<QuestionRow | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}
