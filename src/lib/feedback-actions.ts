"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/queries";
import { getActiveEntitlement } from "@/lib/entitlements";
import { hasLlmKey, llmChat } from "@/lib/llm";
import { linearTracker } from "@/lib/trackers/linear";
import {
  MAX_REPORTS_PER_HOUR,
  clamp,
  reportLabel,
  sanitiseClientContext,
  validateBody,
  type ClientContext,
  type ContentSnapshot,
  type ReportContext,
  type ReportKind,
  type ReportPriority,
  type ReportStatus,
  type ServerContext,
} from "@/lib/feedback";

export type SubmitReportInput = {
  kind: ReportKind;
  body: string;
  /** Content reports only — exactly one of these identifies what was flagged. */
  questionId?: string | null;
  signCode?: string | null;
  objectiveCode?: string | null;
  /** Which option the learner picked, mapped back through the per-sitting shuffle. */
  chosenIndex?: number | null;
  client: Partial<ClientContext>;
};

export type SubmitResult =
  | { ok: true; id: string }
  | { ok: false; error: "auth" | "empty" | "too_short" | "too_long" | "rate_limit" | "db" };

/**
 * File a report. Signed-in only — RLS enforces `auth.uid() = user_id`, so this
 * cannot write on anyone else's behalf even if the action is called directly.
 *
 * Everything the client sends is treated as a claim, not a fact: the body is
 * revalidated server-side (the dialog's word counter is a courtesy, not a gate),
 * the context is sanitised and clamped, and the interesting fields — role,
 * entitlement, what the bank actually keys — are read here rather than accepted.
 *
 * No external call happens on this path. See trackers/linear.ts for why.
 */
export async function submitReport(input: SubmitReportInput): Promise<SubmitResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "db" };

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { ok: false, error: "auth" };

  const valid = validateBody(input.body);
  if (!valid.ok) return { ok: false, error: valid.error };

  // Courtesy cap — see MAX_REPORTS_PER_HOUR. Counts under RLS against the
  // caller's own rows, so it needs no elevated access.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("feedback_reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= MAX_REPORTS_PER_HOUR) return { ok: false, error: "rate_limit" };

  const client = sanitiseClientContext(input.client);
  const server = await collectServerContext(user.id);

  // Snapshot what the bank currently says about the flagged item. Read here,
  // never passed in: `keyed_index` is the column the report exists to dispute,
  // and taking it from the client would let the dispute define its own evidence.
  const content = input.questionId
    ? await snapshotQuestion(input.questionId)
    : input.signCode
      ? await snapshotSign(input.signCode)
      : null;

  const context: ReportContext = {
    client,
    server,
    ...(content ? { content } : {}),
  };

  const keyedIndex = content?.target === "question" ? content.answer : null;

  const { data, error } = await supabase
    .from("feedback_reports")
    .insert({
      user_id: user.id,
      user_email: user.email ?? "unknown",
      kind: input.kind,
      body: input.body.trim(),
      question_id: input.questionId ?? null,
      sign_code: input.signCode ?? null,
      objective_code:
        input.objectiveCode ??
        (content?.target === "question" ? content.objective_code : null),
      chosen_index: typeof input.chosenIndex === "number" ? input.chosenIndex : null,
      keyed_index: keyedIndex,
      context: context as unknown as never,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "db" };

  revalidatePath("/admin/feedback");
  return { ok: true, id: data.id };
}

/**
 * Session-derived facts a reporter cannot forge. "I paid and it still locked me
 * out" is unactionable until you can see the entitlement row for yourself.
 */
async function collectServerContext(userId: string): Promise<ServerContext> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      role: null,
      entitled: false,
      entitlement_expires_at: null,
      last_exam_attempt: null,
      readiness: null,
      attempts_total: 0,
    };
  }

  const [profile, entitlement, lastExam, readiness, attempts] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    getActiveEntitlement(userId),
    supabase
      .from("exam_attempts")
      .select("id, overall, passed, finished_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("readiness_results")
      .select("overall")
      .eq("user_id", userId)
      .order("taken_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    role: profile.data?.role ?? null,
    entitled: Boolean(entitlement),
    entitlement_expires_at: entitlement?.expires_at ?? null,
    last_exam_attempt: lastExam.data
      ? {
          id: lastExam.data.id,
          overall: lastExam.data.overall,
          passed: lastExam.data.passed,
          finished_at: lastExam.data.finished_at,
        }
      : null,
    readiness: readiness.data?.overall ?? null,
    attempts_total: attempts.count ?? 0,
  };
}

async function snapshotQuestion(id: string): Promise<ContentSnapshot | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("questions")
    .select(
      "id, topic, prompt, options, answer, explanation, objective_code, sign_code, review_status, source_citation, source_basis, approved_by, verified_at, in_exam, vehicle_codes",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  return {
    target: "question",
    id: data.id,
    topic: data.topic,
    prompt: data.prompt,
    options: Array.isArray(data.options) ? (data.options as string[]) : [],
    answer: data.answer,
    explanation: data.explanation,
    objective_code: data.objective_code,
    sign_code: data.sign_code,
    review_status: data.review_status,
    source_citation: data.source_citation,
    source_basis: data.source_basis,
    approved_by: data.approved_by,
    verified_at: data.verified_at,
    in_exam: data.in_exam,
    vehicle_codes: data.vehicle_codes,
  };
}

async function snapshotSign(code: string): Promise<ContentSnapshot | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("road_signs")
    .select(
      "code, name, category, review_status, asset_status, sa_relevant, approved_by, verified_at, svg_file, content",
    )
    .eq("code", code)
    .maybeSingle();
  if (!data) return null;

  // The IN11.x defect: approved on both gates, served to learners, and empty in
  // both locales. Nothing in the served-set query can see it, so record it here
  // — a "this sign explains nothing" report is then self-evidently correct.
  const content = (data.content ?? {}) as Record<string, unknown>;
  const emptyContent =
    Object.keys(content).length === 0 ||
    ["en", "af"].every((loc) => {
      const body = content[loc];
      return !body || (typeof body === "object" && Object.keys(body).length === 0);
    });

  return {
    target: "sign",
    code: data.code,
    name: data.name,
    category: data.category,
    review_status: data.review_status,
    asset_status: data.asset_status,
    sa_relevant: data.sa_relevant,
    approved_by: data.approved_by,
    verified_at: data.verified_at,
    svg_file: data.svg_file,
    empty_content: emptyContent,
  };
}

// ── Triage (admin only) ─────────────────────────────────────────────────────

export type AdminResult = { ok: true } | { ok: false; error: string };

export async function setReportStatus(
  id: string,
  status: ReportStatus,
  adminNote?: string,
): Promise<AdminResult> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorised" };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };

  const { data: auth } = await supabase.auth.getUser();
  const resolving = status === "resolved" || status === "dismissed";

  const { error } = await supabase
    .from("feedback_reports")
    .update({
      status,
      admin_note: adminNote ?? null,
      resolved_by: resolving ? (auth?.user?.id ?? null) : null,
      resolved_at: resolving ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/feedback");
  revalidatePath(`/admin/feedback/${id}`);
  return { ok: true };
}

/**
 * Draft a title and priority with the LLM. Admin-triggered and offline relative
 * to the learner — this is not runtime AI in a learner flow, and it never
 * decides anything: an admin sees the draft and can overwrite it before pushing.
 */
export async function draftReportTitle(id: string): Promise<AdminResult> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorised" };
  if (!hasLlmKey()) return { ok: false, error: "No OPENROUTER_API_KEY" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };

  const { data: report } = await supabase
    .from("feedback_reports")
    .select("kind, body, question_id, sign_code, context")
    .eq("id", id)
    .maybeSingle();
  if (!report) return { ok: false, error: "Report not found" };

  const ctx = report.context as unknown as ReportContext | null;
  const anchor = report.question_id ?? report.sign_code ?? "—";

  try {
    const raw = await llmChat({
      system:
        "You triage bug reports for a South African K53 learner-licence app. " +
        "Return JSON: {\"title\": string, \"priority\": \"urgent\"|\"high\"|\"medium\"|\"low\"}. " +
        "The title is one short imperative line under 70 characters describing the DEFECT, " +
        "not the report (\"Mock exam timer resets on rotate\", not \"User says timer broken\"). " +
        "Priority: urgent = blocks paying for or sitting an exam, or teaches something factually " +
        "wrong about the law; high = a core flow is broken; medium = a real but survivable defect; " +
        "low = cosmetic or a preference.",
      user: [
        `Kind: ${report.kind}`,
        `Flagged item: ${anchor}`,
        `Screen: ${ctx?.client?.route_pattern ?? "unknown"}`,
        `Reporter said: ${clamp(report.body, 1500)}`,
        ctx?.content?.target === "question"
          ? `Question keys option ${ctx.content.answer}; citation: ${ctx.content.source_citation ?? "NONE"}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      json: true,
      maxTokens: 300,
    });

    const parsed = JSON.parse(raw) as { title?: string; priority?: string };
    const priority = (["urgent", "high", "medium", "low"] as const).includes(
      parsed.priority as ReportPriority,
    )
      ? (parsed.priority as ReportPriority)
      : "medium";

    const { error } = await supabase
      .from("feedback_reports")
      .update({
        ai_title: clamp(parsed.title ?? "", 200) || null,
        ai_priority: priority,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "LLM failed" };
  }

  revalidatePath(`/admin/feedback/${id}`);
  return { ok: true };
}

/**
 * Push a report to Linear and record the issue reference back on the row.
 *
 * Guarded against double-push: a row that already carries a `linear_issue_id`
 * returns its existing issue rather than minting a duplicate. Two admins with
 * the queue open is a normal Tuesday.
 */
export async function pushReportToLinear(
  id: string,
): Promise<{ ok: true; url: string; identifier: string } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorised" };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };
  if (!linearTracker.isConfigured()) return { ok: false, error: "LINEAR_API_KEY not set" };

  const { data: report } = await supabase
    .from("feedback_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!report) return { ok: false, error: "Report not found" };

  if (report.linear_issue_url && report.linear_identifier) {
    return {
      ok: true,
      url: report.linear_issue_url,
      identifier: report.linear_identifier,
    };
  }

  const ctx = report.context as unknown as ReportContext | null;
  const title =
    report.ai_title ??
    reportLabel({
      kind: report.kind as ReportKind,
      question_id: report.question_id,
      sign_code: report.sign_code,
      body: report.body,
    });

  try {
    const issue = await linearTracker.createIssue({
      title,
      clientBlock: buildClientBlock(report, ctx),
      technicalNotes: buildTechnicalNotes(report, ctx),
      priority: (report.ai_priority as ReportPriority) ?? "medium",
      extraLabel: report.kind === "bug" ? "Bug" : undefined,
    });

    const { error } = await supabase
      .from("feedback_reports")
      .update({
        status: "pushed",
        linear_issue_id: issue.id,
        linear_issue_url: issue.url,
        linear_identifier: issue.identifier,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/feedback");
    revalidatePath(`/admin/feedback/${id}`);
    return { ok: true, url: issue.url, identifier: issue.identifier };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Push failed" };
  }
}

type ReportRow = {
  kind: string;
  body: string;
  user_email: string;
  question_id: string | null;
  sign_code: string | null;
  objective_code: string | null;
  chosen_index: number | null;
  keyed_index: number | null;
  created_at: string;
};

/**
 * The block above the divider. Plain language, no infrastructure — Louwrens
 * reads these and should be able to act on a content report without a developer.
 */
function buildClientBlock(r: ReportRow, ctx: ReportContext | null): string {
  const lines: string[] = [];

  if (r.kind === "content") {
    const item = r.question_id ? `question **${r.question_id}**` : `sign **${r.sign_code}**`;
    lines.push(`A learner flagged ${item} as wrong.`);
  } else {
    lines.push("A learner reported a problem using the app.");
  }
  lines.push("");
  lines.push("**What they said**");
  lines.push("");
  lines.push("> " + r.body.trim().replace(/\n/g, "\n> "));
  lines.push("");

  if (ctx?.content?.target === "question") {
    const q = ctx.content;
    lines.push("**The question**");
    lines.push("");
    lines.push(`> ${q.prompt}`);
    lines.push("");
    q.options.forEach((opt, i) => {
      const marks: string[] = [];
      if (i === q.answer) marks.push("✅ our answer");
      if (i === r.chosen_index) marks.push("👤 learner chose");
      lines.push(`- ${opt}${marks.length ? `  — _${marks.join(", ")}_` : ""}`);
    });
    lines.push("");
    lines.push(`**Why we say that:** ${q.explanation}`);
    lines.push("");
    lines.push(
      q.source_citation
        ? `**Source on file:** ${q.source_citation}`
        : "**Source on file:** none recorded — this question has no citation.",
    );
  }

  if (ctx?.content?.target === "sign") {
    const s = ctx.content;
    lines.push(`**The sign:** ${s.code} — ${s.name} (${s.category})`);
    if (s.empty_content) {
      lines.push("");
      lines.push("⚠️ This sign has **no lesson text written** in either language.");
    }
  }

  lines.push("");
  lines.push(`Reported by ${r.user_email} on ${new Date(r.created_at).toLocaleDateString("en-ZA")}.`);
  return lines.join("\n");
}

/** Everything below the divider. Paths, ids, provenance, traces. */
function buildTechnicalNotes(r: ReportRow, ctx: ReportContext | null): string {
  const c = ctx?.client;
  const s = ctx?.server;
  const lines: string[] = [];

  lines.push("**Where**");
  lines.push(`- Route: \`${c?.route_pattern ?? "?"}\` (locale \`${c?.locale ?? "?"}\`)`);
  lines.push(`- URL: ${c?.page_url ?? "?"}`);
  if (c?.referrer) lines.push(`- Referrer: ${c.referrer}`);
  lines.push(`- Build: \`${c?.app_version || "unknown"}\``);
  lines.push("");

  lines.push("**Reporter state**");
  lines.push(`- Role: ${s?.role ?? "?"} · entitled: ${s?.entitled ? "yes" : "no"}${
    s?.entitlement_expires_at ? ` (expires ${s.entitlement_expires_at})` : ""
  }`);
  lines.push(`- Attempts logged: ${s?.attempts_total ?? 0} · readiness: ${s?.readiness ?? "—"}`);
  if (s?.last_exam_attempt) {
    lines.push(
      `- Last mock: \`${s.last_exam_attempt.id}\` — ${s.last_exam_attempt.overall ?? "?"}%, ` +
        `${s.last_exam_attempt.passed ? "passed" : "failed"}, ${s.last_exam_attempt.finished_at ?? "unfinished"}`,
    );
  }
  lines.push("");

  lines.push("**Environment**");
  lines.push(`- Viewport ${c?.viewport ?? "?"} · screen ${c?.screen ?? "?"} @ DPR ${c?.dpr ?? "?"}`);
  lines.push(
    `- Connection: ${c?.connection ?? "?"} · online: ${c?.online ? "yes" : "no"} · scheme: ${c?.color_scheme ?? "?"}`,
  );
  lines.push(`- Locale env: ${c?.timezone ?? "?"} / ${c?.language ?? "?"}`);
  lines.push(`- Time on page: ${c?.time_on_page_s ?? 0}s · scroll ${c?.scroll_y ?? 0}px`);
  lines.push(`- UA: \`${c?.user_agent ?? "?"}\``);
  lines.push("");

  if (ctx?.content?.target === "question") {
    const q = ctx.content;
    lines.push("**Question provenance at report time**");
    lines.push(`- \`${q.id}\` · topic \`${q.topic}\` · objective \`${q.objective_code ?? "—"}\``);
    lines.push(`- review_status: \`${q.review_status}\` · in_exam: ${q.in_exam}`);
    lines.push(`- vehicle_codes: \`${q.vehicle_codes.join(", ")}\``);
    lines.push(`- source_basis: \`${q.source_basis ?? "—"}\``);
    lines.push(`- source_citation: ${q.source_citation ?? "**none**"}`);
    lines.push(`- approved_by: \`${q.approved_by ?? "—"}\` · verified_at: \`${q.verified_at ?? "—"}\``);
    lines.push(`- keyed index ${r.keyed_index ?? "?"}, learner chose ${r.chosen_index ?? "—"}`);
    lines.push("");
    lines.push(
      "Check this against `docs/verification-worklist.md` before editing — if it is in the " +
        "16 partial-citation set or the 7 uncited, the citation may not support the keyed answer.",
    );
    lines.push("");
  }

  if (ctx?.content?.target === "sign") {
    const sg = ctx.content;
    lines.push("**Sign provenance at report time**");
    lines.push(`- \`${sg.code}\` · asset_status \`${sg.asset_status}\` · review_status \`${sg.review_status}\``);
    lines.push(`- sa_relevant: ${sg.sa_relevant} · svg: \`${sg.svg_file ?? "—"}\``);
    lines.push(`- approved_by: \`${sg.approved_by ?? "—"}\` · verified_at: \`${sg.verified_at ?? "—"}\``);
    lines.push(`- empty lesson body: **${sg.empty_content ? "YES" : "no"}**`);
    lines.push("");
  }

  if (c?.errors?.length) {
    lines.push("**Console errors**");
    lines.push("```json");
    lines.push(JSON.stringify(c.errors, null, 2));
    lines.push("```");
    lines.push("");
  }
  if (c?.fetch_failures?.length) {
    lines.push("**Failed requests**");
    lines.push("```json");
    lines.push(JSON.stringify(c.fetch_failures, null, 2));
    lines.push("```");
    lines.push("");
  }
  if (c?.clicks?.length) {
    lines.push("**Click trail**");
    lines.push("```json");
    lines.push(JSON.stringify(c.clicks, null, 2));
    lines.push("```");
  }

  return lines.join("\n");
}
