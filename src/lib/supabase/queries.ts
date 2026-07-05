import { createClient } from "@/lib/supabase/server";
import type { Topic } from "@/lib/types";
import type { SignRow } from "@/lib/signs";

/** Current signed-in user, or null (also null when Supabase isn't configured). */
export async function getUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/** True when the current user has the admin role. */
export async function isAdmin() {
  const supabase = await createClient();
  if (!supabase) return false;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();
  return data?.role === "admin";
}

/**
 * All road signs (DB1), ordered by code — the FULL set, including unverified and
 * excluded signs. Admin-only use; learner pages must use the `getApproved*`
 * variants which gate on the two review gates + SA-relevance.
 */
export async function getSigns(): Promise<SignRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("road_signs")
    .select("*")
    .order("code", { ascending: true });
  return data ?? [];
}

export async function getSignsCount(): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("road_signs")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

export async function getSignByCode(code: string): Promise<SignRow | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("road_signs")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  return data;
}

// A sign is learner-visible only when both review gates are approved AND it is
// SA-relevant (verified present in the official DoT chart).
const SERVE_FILTER = {
  asset_status: "approved",
  review_status: "approved",
  sa_relevant: true,
} as const;

/** Learner-visible signs only (approved asset + content + SA-relevant). */
export async function getApprovedSigns(): Promise<SignRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("road_signs")
    .select("*")
    .match(SERVE_FILTER)
    .order("code", { ascending: true });
  return data ?? [];
}

/** Count of learner-visible signs (drives the learn-index tile). */
export async function getApprovedSignsCount(): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("road_signs")
    .select("*", { count: "exact", head: true })
    .match(SERVE_FILTER);
  return count ?? 0;
}

/** A single learner-visible sign by code, or null if not served. */
export async function getApprovedSignByCode(
  code: string,
): Promise<SignRow | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("road_signs")
    .select("*")
    .eq("code", code)
    .match(SERVE_FILTER)
    .maybeSingle();
  return data;
}

/** Most recent readiness snapshot for a user, or null if none. */
export async function getLatestReadiness(userId: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("readiness_results")
    .select("overall, band, by_topic, taken_at")
    .eq("user_id", userId)
    .order("taken_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/** A single exam attempt by id (own-row via RLS), or null. */
export async function getExamAttempt(id: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** A user's mock-exam attempts (most recent first). */
export async function getExamHistory(userId: string, limit = 10) {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("exam_attempts")
    .select(
      "id, vehicle_code, overall, passed, sections, started_at, duration_seconds, auto_submitted",
    )
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Distinct days a user practised/tested in the last `sinceDays` (consistency signal). */
export async function getAttemptDays(
  userId: string,
  sinceDays = 28,
): Promise<string[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const { data } = await supabase
    .from("attempts")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());
  if (!data) return [];
  return [...new Set(data.map((r) => r.created_at.slice(0, 10)))];
}

export type TopicAccuracy = Record<Topic, { correct: number; total: number }>;

/** Per-topic accuracy aggregated from a user's attempts, or null if none yet. */
export async function getTopicAccuracy(
  userId: string,
): Promise<TopicAccuracy | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("attempts")
    .select("topic, correct")
    .eq("user_id", userId);
  if (!data || data.length === 0) return null;

  const acc: TopicAccuracy = {
    signs: { correct: 0, total: 0 },
    rules: { correct: 0, total: 0 },
    controls: { correct: 0, total: 0 },
  };
  for (const a of data) {
    const topic = a.topic as Topic;
    if (!acc[topic]) continue;
    acc[topic].total += 1;
    if (a.correct) acc[topic].correct += 1;
  }
  return acc;
}
