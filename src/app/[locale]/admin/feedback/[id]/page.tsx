import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/queries";
import { FeedbackActions } from "@/components/admin/feedback-actions";
import type { ReportContext } from "@/lib/feedback";

export const metadata = { title: "Admin · Report" };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1 text-xs">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-words">{value ?? "—"}</span>
    </div>
  );
}

export default async function AdminFeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // See the note on the list page: the admin layout is NOT sufficient on its
  // own, because layouts don't re-run on client-side navigation. This page is
  // the more sensitive of the two — it renders one report's full context.
  if (!(await isAdmin())) notFound();

  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();

  const { data: report } = await supabase
    .from("feedback_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!report) notFound();

  const ctx = report.context as unknown as ReportContext | null;
  const c = ctx?.client;
  const s = ctx?.server;
  const content = ctx?.content;

  // Deep link straight into the editor for the flagged row — the whole point of
  // anchoring a content report is that acting on it is one click, not a search.
  const editHref = report.question_id
    ? `/admin/questions/${report.question_id}`
    : report.sign_code
      ? `/admin/signs/${report.sign_code}`
      : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-2 rounded-lg"
        render={
          <Link href="/admin/feedback">
            <ArrowLeft className="size-4" /> All reports
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold md:text-xl">
          {report.ai_title ?? (report.kind === "content" ? "Content flag" : "Bug report")}
        </h1>
        <Badge variant="outline">{report.kind}</Badge>
        <Badge>{report.status}</Badge>
        {report.ai_priority && <Badge variant="outline">{report.ai_priority}</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {report.user_email} ·{" "}
        {new Date(report.created_at).toLocaleString("en-ZA", {
          dateStyle: "full",
          timeStyle: "short",
        })}
      </p>

      {/* What the learner said, first and unabridged. */}
      <Card className="mt-4">
        <CardContent className="py-4">
          <p className="text-sm whitespace-pre-wrap">{report.body}</p>
        </CardContent>
      </Card>

      <FeedbackActions
        id={report.id}
        status={report.status}
        linearUrl={report.linear_issue_url}
        linearIdentifier={report.linear_identifier}
        hasAiTitle={Boolean(report.ai_title)}
        editHref={editHref}
      />

      {content?.target === "question" && (
        <Card className="mt-4">
          <CardContent className="py-4">
            <h2 className="mb-2 text-sm font-medium">
              Question as it stood when reported
            </h2>
            <p className="mb-2 text-sm">{content.prompt}</p>
            <ul className="mb-3 flex flex-col gap-1">
              {content.options.map((opt, i) => (
                <li
                  key={i}
                  className={
                    i === content.answer
                      ? "rounded-md bg-secondary px-2 py-1 text-xs font-medium"
                      : "px-2 py-1 text-xs"
                  }
                >
                  {opt}
                  {i === content.answer && " · keyed correct"}
                  {i === report.chosen_index && " · learner chose"}
                </li>
              ))}
            </ul>
            <Row label="Explanation" value={content.explanation} />
            <Row
              label="Citation"
              value={
                content.source_citation ?? (
                  <span className="text-destructive">none recorded</span>
                )
              }
            />
            <Row label="Source basis" value={content.source_basis} />
            <Row label="Review status" value={content.review_status} />
            <Row label="Approved by" value={content.approved_by} />
            <Row label="Verified at" value={content.verified_at} />
            <Row label="Objective" value={content.objective_code} />
            <Row label="Vehicle codes" value={content.vehicle_codes?.join(", ")} />
            <Row label="In exam pool" value={String(content.in_exam)} />
          </CardContent>
        </Card>
      )}

      {content?.target === "sign" && (
        <Card className="mt-4">
          <CardContent className="py-4">
            <h2 className="mb-2 text-sm font-medium">
              Sign as it stood when reported
            </h2>
            <Row label="Code / name" value={`${content.code} — ${content.name}`} />
            <Row label="Category" value={content.category} />
            <Row label="Asset status" value={content.asset_status} />
            <Row label="Review status" value={content.review_status} />
            <Row label="SA relevant" value={String(content.sa_relevant)} />
            <Row label="Approved by" value={content.approved_by} />
            <Row label="Verified at" value={content.verified_at} />
            <Row label="SVG" value={content.svg_file} />
            <Row
              label="Lesson body"
              value={
                content.empty_content ? (
                  <span className="text-destructive">
                    EMPTY in both locales — the sign teaches nothing
                  </span>
                ) : (
                  "present"
                )
              }
            />
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardContent className="py-4">
          <h2 className="mb-2 text-sm font-medium">Reporter state</h2>
          <Row label="Role" value={s?.role} />
          <Row
            label="Entitled"
            value={
              s?.entitled
                ? `yes${s.entitlement_expires_at ? ` (until ${s.entitlement_expires_at})` : ""}`
                : "no"
            }
          />
          <Row label="Attempts logged" value={String(s?.attempts_total ?? 0)} />
          <Row label="Readiness" value={s?.readiness != null ? `${s.readiness}%` : "—"} />
          <Row
            label="Last mock"
            value={
              s?.last_exam_attempt
                ? `${s.last_exam_attempt.overall ?? "?"}% · ${
                    s.last_exam_attempt.passed ? "passed" : "failed"
                  } · ${s.last_exam_attempt.finished_at ?? "unfinished"}`
                : "never sat one"
            }
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="py-4">
          <h2 className="mb-2 text-sm font-medium">Environment</h2>
          <Row label="Route" value={<code>{c?.route_pattern}</code>} />
          <Row label="URL" value={c?.page_url} />
          <Row label="Locale" value={c?.locale} />
          <Row label="Referrer" value={c?.referrer} />
          <Row label="Build" value={<code>{c?.app_version}</code>} />
          <Row label="Viewport" value={`${c?.viewport} (screen ${c?.screen} @ ${c?.dpr}x)`} />
          <Row
            label="Connection"
            value={`${c?.connection ?? "?"} · ${c?.online ? "online" : "offline"}`}
          />
          <Row label="Scheme" value={c?.color_scheme} />
          <Row label="TZ / lang" value={`${c?.timezone} / ${c?.language}`} />
          <Row
            label="On page"
            value={`${c?.time_on_page_s}s · scrolled ${c?.scroll_y}px`}
          />
          <Row label="User agent" value={<code className="text-[10px]">{c?.user_agent}</code>} />
        </CardContent>
      </Card>

      {(c?.errors?.length || c?.fetch_failures?.length || c?.clicks?.length) ? (
        <Card className="mt-4">
          <CardContent className="py-4">
            <h2 className="mb-2 text-sm font-medium">What happened before</h2>
            {c.errors.length > 0 && (
              <>
                <p className="mt-2 text-xs font-medium">Console errors</p>
                <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-2 text-[10px]">
                  {JSON.stringify(c.errors, null, 2)}
                </pre>
              </>
            )}
            {c.fetch_failures.length > 0 && (
              <>
                <p className="mt-3 text-xs font-medium">Failed requests</p>
                <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-2 text-[10px]">
                  {JSON.stringify(c.fetch_failures, null, 2)}
                </pre>
              </>
            )}
            {c.clicks.length > 0 && (
              <>
                <p className="mt-3 text-xs font-medium">Click trail</p>
                <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-2 text-[10px]">
                  {JSON.stringify(c.clicks, null, 2)}
                </pre>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
