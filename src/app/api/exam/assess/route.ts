import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
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
  generationCount,
  parseAssessment,
  readCachedAssessment,
  writeCachedAssessment,
  assessmentUserPayload,
  examAssessmentSystem,
  EXAM_GENERATION_LIMIT,
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
/**
 * If even the message catalogue is unavailable, the learner still gets a shaped,
 * honest assessment rather than a 500 or a screenful of translation keys. English
 * by necessity: this is the branch where the translations themselves failed.
 */
const LAST_RESORT_STRINGS = {
  t: (key: string) =>
    key.startsWith("examPlan")
      ? "Review your weakest section, then practise it"
      : "Based on your section scores.",
  topicLabel: (topic: Topic) => topic,
};

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

  // Cache hit — re-viewing is free, and each locale has its own slot, so an /af
  // view no longer evicts the /en one (or vice versa) and charges the next
  // reader six seconds and a model call to get it back.
  const cached = readCachedAssessment(attempt.assessment, locale);
  if (cached) return NextResponse.json({ assessment: cached, cached: true });

  // Regeneration is possible now that fallbacks are never cached, so it needs a
  // ceiling. Past it the learner still gets the template rather than an error.
  const spent = generationCount(attempt.assessment);

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
  if (hasLlmKey() && spent < EXAM_GENERATION_LIMIT) {
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
  if (!assessment) {
    // The fallback is the branch that exists so nothing is ever broken, so it
    // may not be the branch that breaks. A missing or renamed message key does
    // not throw under next-intl's default error handling — it renders the key
    // path — which would put "assessmentFallback.examPlanLearn" in front of a
    // paying learner. Guard the lookup and keep a last-resort English shape.
    try {
      const t = await getTranslations({ locale, namespace: "assessmentFallback" });
      const tt = await getTranslations({ locale, namespace: "topics" });
      assessment = buildFallbackAssessment(payload, {
        t: (key, values) => {
          const value = t(key, values);
          // A resolved message never contains its own namespace path.
          return value.startsWith("assessmentFallback.") ? "" : value;
        },
        topicLabel: (topic: Topic) => tt(topic) || topic,
      });
      if (!assessment.verdict.trim()) throw new Error("empty fallback copy");
    } catch {
      assessment = buildFallbackAssessment(payload, LAST_RESORT_STRINGS);
    }
  }

  assessment.model = assessment.fallback ? "fallback" : LLM_MODEL;
  assessment.generatedAt = new Date().toISOString();
  assessment.locale = locale;
  assessment.promptVersion = PROMPT_VERSION;

  // Merge into the envelope and write back (own-row update policy). Re-read
  // first: the model call took seconds, and the other locale may have been
  // generated in that window — merging onto the value we read before the call
  // would silently drop it. This narrows the race to the few milliseconds
  // between read and write rather than closing it; doing that properly needs a
  // jsonb merge in SQL, which is not worth a migration for two locales.
  //
  // A fallback contributes only to the attempt count, never to `byLocale`, so a
  // provider blip can no longer leave a paying learner permanently holding the
  // template.
  if (!assessment.fallback) {
    const { data: fresh, error } = await supabase
      .from("exam_attempts")
      .select("assessment")
      .eq("id", attempt.id)
      .maybeSingle();

    // If the re-read failed, merging onto the value read before the model call
    // would write back a snapshot that predates anything generated meanwhile —
    // dropping the other locale to save this one. Returning the assessment
    // uncached costs one regeneration; the alternative destroys someone else's.
    if (!error && fresh) {
      await supabase
        .from("exam_attempts")
        .update({
          assessment: writeCachedAssessment(
            fresh.assessment,
            locale,
            assessment,
          ) as unknown as Json,
        })
        .eq("id", attempt.id);
    }
  }

  // Whether pressing "Try again" could plausibly do anything. A fallback with no
  // key configured, or past the generation ceiling, will always be a fallback —
  // offering a retry there promises something the route cannot deliver.
  const retryable =
    !assessment.fallback || (hasLlmKey() && spent < EXAM_GENERATION_LIMIT);

  return NextResponse.json({ assessment, cached: false, retryable });
}
