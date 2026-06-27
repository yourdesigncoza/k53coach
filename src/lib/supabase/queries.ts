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

/** All road signs (DB1), ordered by code. RLS allows public read. */
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
