import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveEntitlement } from "@/lib/entitlements";
import { llmChat, hasLlmKey, LLM_MODEL } from "@/lib/llm";
import type { Json } from "@/lib/database.types";
import type { Topic } from "@/lib/types";
import type { ExamSectionResult, StoredExamAnswer } from "@/lib/exam";
import {
  buildAssessmentPayload,
  buildFallbackAssessment,
  parseAssessment,
  assessmentUserPayload,
  ASSESSMENT_SYSTEM,
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
  } | null;
  if (!body?.attemptId)
    return NextResponse.json({ error: "attemptId required" }, { status: 400 });

  // Fetch the attempt under RLS (own-row only).
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, overall, passed, sections, answers, assessment")
    .eq("id", body.attemptId)
    .maybeSingle();
  if (!attempt)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  // Cache hit — re-viewing is free.
  if (attempt.assessment) {
    return NextResponse.json({ assessment: attempt.assessment, cached: true });
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
        system: ASSESSMENT_SYSTEM,
        user: assessmentUserPayload(payload),
        json: true,
        maxTokens: 1500,
      });
      assessment = parseAssessment(raw, payload.allowedHrefs);
    } catch {
      assessment = null;
    }
  }
  if (!assessment) assessment = buildFallbackAssessment(payload);

  assessment.model = assessment.fallback ? "fallback" : LLM_MODEL;
  assessment.generatedAt = new Date().toISOString();

  // Cache back onto the attempt (own-row update policy).
  await supabase
    .from("exam_attempts")
    .update({ assessment: assessment as unknown as Json })
    .eq("id", attempt.id);

  return NextResponse.json({ assessment, cached: false });
}
