import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/queries";
import { redirect } from "@/i18n/navigation";
import { CoachTestConsole } from "@/components/admin/coach-test-console";
import { CoachReviewQueue, type QueueRow } from "@/components/admin/coach-review-queue";

export const metadata = { title: "Ask Coach — admin" };

/** Group by the normalised question: one asked eleven times is the signal. */
function group(rows: { body: string; created_at: string; status: string | null }[]): QueueRow[] {
  const byQuestion = new Map<string, QueueRow>();
  for (const row of rows) {
    const key = row.body.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key) continue; // purged by the retention sweep — counted, not shown
    const existing = byQuestion.get(key);
    if (existing) {
      existing.count += 1;
      if (row.created_at > existing.lastSeen) existing.lastSeen = row.created_at;
    } else {
      byQuestion.set(key, {
        question: row.body,
        count: 1,
        lastSeen: row.created_at,
        status: row.status ?? "refused",
      });
    }
  }
  return [...byQuestion.values()].sort((a, b) => b.count - a.count || b.lastSeen.localeCompare(a.lastSeen));
}

/**
 * `/admin/coach` — the review queue and the test console (decision b).
 *
 * The queue is the point of refusing honestly instead of searching the web:
 * every question the corpus could not answer is a ranked content gap. A question
 * asked once is noise; asked eleven times, it is the next lesson to write.
 */
export default async function AdminCoachPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(await isAdmin())) redirect({ href: "/dashboard", locale });

  const supabase = await createClient();

  // Pair each unanswered coach turn with the question that produced it: the
  // assistant row carries the verdict, the user row carries the words.
  const { data: unanswered } = (await supabase
    ?.from("coach_messages")
    .select("conversation_id,status,created_at")
    .in("status", ["not_covered", "refused"])
    .order("created_at", { ascending: false })
    .limit(500)) ?? { data: [] };

  const conversationIds = [...new Set((unanswered ?? []).map((r) => r.conversation_id))];
  const { data: questions } = conversationIds.length
    ? ((await supabase
        ?.from("coach_messages")
        .select("body,created_at,conversation_id")
        .eq("role", "user")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
        .limit(500)) ?? { data: [] })
    : { data: [] };

  const statusByConversation = new Map(
    (unanswered ?? []).map((r) => [r.conversation_id, r.status]),
  );
  const rows = group(
    (questions ?? []).map((q) => ({
      body: q.body,
      created_at: q.created_at,
      status: statusByConversation.get(q.conversation_id) ?? null,
    })),
  );

  return (
    <div className="space-y-8 px-4 py-5 md:px-8 md:py-8">
      <div>
        <h1 className="font-display text-xl font-semibold md:text-2xl">Ask Coach</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Questions the verified content could not answer, and a console for putting a question
          through the live gates.
        </p>
      </div>
      <CoachReviewQueue rows={rows} />
      <CoachTestConsole />
    </div>
  );
}
