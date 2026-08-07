import { createClient } from "@/lib/supabase/server";
import type { Question, Topic } from "@/lib/types";
import { shuffleOptions } from "@/lib/shuffle";
import { toQuestion, type QuestionRow } from "@/lib/questions-map";

/**
 * DB4 question bank access. The `questions` table is the source of truth (DB-only);
 * learner getters explicitly filter `review_status='approved'` — never relying on RLS
 * alone, so an admin previewing learner pages still sees only approved content.
 */
// The row -> Question mapping lives in its own module so plain-node scripts can
// import it without pulling in @/lib/supabase/server (and next/headers). Both
// names are re-exported here so existing call sites are unchanged.
export { toQuestion, type QuestionRow };

/** The curated mock-exam pool for a vehicle code: approved + in_exam + applies to
 *  the code. Feeds `assemblePaper` — admin curation is the single source. */
export async function getExamPool(vehicleCode: string): Promise<Question[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("questions")
    .select("*")
    .eq("review_status", "approved")
    .eq("in_exam", true)
    .contains("vehicle_codes", [vehicleCode]);
  return (data ?? []).map(toQuestion);
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

/**
 * All approved questions for one topic — the practice bank.
 *
 * Option order is shuffled per request. Stored order is fixed, and practice is the
 * surface a learner repeats most, so without this the correct answer sits in the
 * same slot every run and gets memorised by position rather than by rule. Question
 * ORDER stays `sort_order` — practice is a walk through a topic, not a random draw,
 * so the sequence is meant to be stable.
 *
 * The shuffle lives here rather than in the three practice pages, which are otherwise
 * identical and would each need the same line. The NAME carries the contract: this
 * returns presentation-transformed data, not canonical stored order. Do not wrap it in
 * `React.cache()` (freezes the order within a request) or `use cache` / `unstable_cache`
 * (freezes it across requests, which is the whole defect this fixes). Anything needing
 * stored order — admin, export, analytics — must query directly rather than call this.
 */
export async function getShuffledPracticeQuestions(topic: Topic): Promise<Question[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("questions")
    .select("*")
    .eq("review_status", "approved")
    .eq("topic", topic)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(toQuestion).map((q) => shuffleOptions(q));
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
