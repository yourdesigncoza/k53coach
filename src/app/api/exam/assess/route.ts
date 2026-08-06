import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveEntitlement } from "@/lib/entitlements";
import { llmChat, hasLlmKey, LLM_MODEL } from "@/lib/llm";
import type { Json } from "@/lib/database.types";
import type { Topic } from "@/lib/types";
import type { ExamSectionResult, StoredExamAnswer } from "@/lib/exam";
import { validLocale } from "@/lib/locale";
import {
  buildAssessmentPayload,
  buildFallbackAssessment,
  parseAssessment,
  assessmentUserPayload,
  examAssessmentSystem,
  EXAM_LIMITS,
  PROMPT_VERSION,
  type Assessment,
} from "@/lib/exam-assessment";

/**
 * Generate (or return the cached) AI coaching assessment for one exam attempt.
 * POST { attemptId }. Grounded in the attempt's verified explanations; degrades
 * to a deterministic template with no key / on malformed output. POPIA: the
 * learner is a signed-in paid user (consent flags on profiles); no PII goes to
 * the model. See docs/ai-assessment.md.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json({ error: "not configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const entitlement = await getActiveEntitlement(user.id);
  if (!entitlement)
    return NextResponse.json({ error: "payment required" }, { status: 402 });

  const body = (await req.json().catch(() => null)) as {
    attemptId?: string;
    locale?: string;
  } | null;
  if (!body?.attemptId)
    return NextResponse.json({ error: "attemptId required" }, { status: 400 });

  const locale = validLocale(body.locale);

  // Fetch the attempt under RLS (own-row only).
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, overall, passed, sections, answers, assessment")
    .eq("id", body.attemptId)
    .maybeSingle();
  if (!attempt)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  // Cache hit — re-viewing is free. The stored assessment only serves this
  // request if it was written in the SAME language and against the SAME prompt;
  // otherwise an /af learner would be handed the English prose an earlier /en
  // view generated for the same attempt. A miss here regenerates and overwrites.
  //
  // One column holds one assessment, so switching locales back and forth
  // re-spends each time. AP-03 replaces this with a per-locale map; this is the
  // minimum that stops the wrong language being served.
  //
  // A stored FALLBACK is treated as a miss (AP-04): otherwise a 30-second
  // provider blip at the moment the learner taps the button costs them the paid
  // feature permanently, with no way back but a hand-edit of the row.
  const cached = attempt.assessment as Assessment | null;
  if (
    cached &&
    !cached.fallback &&
    (cached.locale ?? "en") === locale &&
    (cached.promptVersion ?? 0) === PROMPT_VERSION
  ) {
    return NextResponse.json({ assessment: cached, cached: true });
  }

  const sections = (attempt.sections ??
    {}) as unknown as Record<Topic, ExamSectionResult>;
  const answers = (attempt.answers ?? []) as unknown as StoredExamAnswer[];
  const payload = buildAssessmentPayload(
    attempt.overall ?? 0,
    !!attempt.passed,
    sections,
    answers,
  );

  let assessment: Assessment | null = null;
  if (hasLlmKey()) {
    try {
      const raw = await llmChat({
        system: examAssessmentSystem(locale),
        user: assessmentUserPayload(payload),
        json: true,
        maxTokens: 1500,
      });
      assessment = parseAssessment(raw, payload.allowedHrefs, EXAM_LIMITS);
    } catch {
      assessment = null;
    }
  }
  if (!assessment) assessment = buildFallbackAssessment(payload);

  assessment.model = assessment.fallback ? "fallback" : LLM_MODEL;
  assessment.generatedAt = new Date().toISOString();
  assessment.locale = locale;
  assessment.promptVersion = PROMPT_VERSION;

  // Cache back onto the attempt (own-row update policy).
  await supabase
    .from("exam_attempts")
    .update({ assessment: assessment as unknown as Json })
    .eq("id", attempt.id);

  return NextResponse.json({ assessment, cached: false });
}
