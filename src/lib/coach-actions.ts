"use server";

/**
 * Conversation management for Ask Coach.
 *
 * Sending a message is NOT here — it is `POST /api/coach/ask`, because it is the
 * one path that spends money and needs a reservation, a provider call and a
 * validator between request and response. These are the cheap surrounding
 * operations.
 *
 * Everything runs under the learner's own RLS client. Nothing takes a user id as
 * an argument: ownership is `auth.uid() = user_id` in the policy, so an action
 * cannot be pointed at somebody else's conversation even if called directly.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/queries";
import { UNANSWERED_RETENTION_DAYS } from "@/lib/coach-privacy";

export interface ConversationSummary {
  id: string;
  title: string | null;
  locale: string;
  messageCount: number;
  lastMessageAt: string | null;
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  body: string;
  status: string | null;
  sources: { code: string; href: string }[];
  createdAt: string;
}

interface EvidenceShape {
  passages?: { code?: string; href?: string }[];
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("coach_conversations")
    .select("id,title,locale,message_count,last_message_at")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(50);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    locale: row.locale,
    messageCount: row.message_count,
    lastMessageAt: row.last_message_at,
  }));
}

export async function getMessages(conversationId: string): Promise<CoachMessage[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("coach_messages")
    .select("id,role,body,status,evidence,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => {
    const evidence = (row.evidence ?? {}) as EvidenceShape;
    return {
      id: row.id,
      role: row.role === "assistant" ? "assistant" : "user",
      body: row.body,
      status: row.status,
      // Source chips are rendered from the stored SNAPSHOT, not looked up now.
      // If a lesson is corrected next week the chip must still show what the
      // coach was actually reading, or the trust surface stops being evidence.
      sources: (evidence.passages ?? [])
        .filter((p): p is { code: string; href: string } => Boolean(p.code && p.href))
        .map((p) => ({ code: p.code, href: p.href })),
      createdAt: row.created_at,
    };
  });
}

export type CoachActionResult = { ok: true } | { ok: false; error: string };

/**
 * Delete a conversation and everything in it.
 *
 * A learner may clear their own history — the messages cascade. This is the one
 * write a learner has beyond asking, and it is deliberate: they typed the
 * questions, and there is no reason the app should hold them against their will.
 */
export async function deleteConversation(id: string): Promise<CoachActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "unavailable" };
  const { error } = await supabase.from("coach_conversations").delete().eq("id", id);
  if (error) return { ok: false, error: "delete_failed" };
  revalidatePath("/ask");
  return { ok: true };
}

/**
 * Blank the question text of refused/uncovered exchanges past the retention
 * window (decision g). Admin-only, enforced inside the database function.
 *
 * Called from the admin review queue for now. A cron is the proper home — this
 * only runs when somebody opens the page, which is enough while the queue is
 * being read weekly and is not enough once it is not.
 */
export async function purgeExpiredBodies(): Promise<{ purged: number } | CoachActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "unavailable" };
  if (!(await isAdmin())) return { ok: false, error: "Not authorised" };

  const { data, error } = await supabase.rpc("coach_purge_expired_bodies", {
    p_days: UNANSWERED_RETENTION_DAYS,
  });
  if (error) return { ok: false, error: error.message };
  return { purged: typeof data === "number" ? data : 0 };
}
