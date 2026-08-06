import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/queries";
import { FeedbackList, type FeedbackRow } from "@/components/admin/feedback-list";
import { markStale } from "@/lib/feedback";

export const metadata = { title: "Admin · Reports" };

/**
 * Triage queue for learner-filed reports.
 *
 * Content reports lead because they are the ones with a shelf life: a mis-keyed
 * answer is teaching somebody the wrong thing every hour it stays up, while a
 * cosmetic bug is not.
 */
export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string }>;
}) {
  // Checked HERE, not left to the admin layout. Next's auth guide is explicit:
  // layouts don't re-render on client-side navigation (Partial Rendering), so a
  // layout check is not evaluated on every route change — do it close to the
  // data. RLS (`own-row or is_admin()`) and the per-action `isAdmin()` gates are
  // the backstops; this is the one that stops the page rendering at all.
  if (!(await isAdmin())) notFound();

  const { status = "open", kind = "all" } = await searchParams;
  const supabase = await createClient();

  let rows: FeedbackRow[] = [];
  if (supabase) {
    let query = supabase
      .from("feedback_reports")
      .select(
        "id, kind, body, user_email, question_id, sign_code, objective_code, status, ai_title, ai_priority, linear_identifier, linear_issue_url, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    // "open" is the default view because a triage queue that shows everything
    // is a list, not a queue.
    if (status === "open") query = query.in("status", ["new", "pushed"]);
    else if (status !== "all") query = query.eq("status", status);
    if (kind !== "all") query = query.eq("kind", kind);

    const { data } = await query;
    // Stamped on the server so the client never reads the clock during render.
    rows = markStale(data ?? []) as FeedbackRow[];
  }

  const counts = {
    total: rows.length,
    content: rows.filter((r) => r.kind === "content").length,
    untriaged: rows.filter((r) => r.status === "new").length,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">Learner reports</h1>
      <p className="text-sm text-muted-foreground">
        {counts.total} shown · {counts.content} content flags ·{" "}
        {counts.untriaged} untriaged
      </p>

      <FeedbackList rows={rows} status={status} kind={kind} />
    </div>
  );
}
