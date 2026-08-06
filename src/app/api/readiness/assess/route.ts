import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { llmChat, hasLlmKey, LLM_MODEL } from "@/lib/llm";
import { validLocale } from "@/lib/locale";
import { getReadinessQuestions } from "@/lib/questions";
import { claimAssessment, releaseAssessment } from "@/lib/readiness-grants";
import {
  paperTokenSecret,
  verifyPaperToken,
} from "@/lib/readiness-token";
import {
  READINESS_LIMITS,
  buildReadinessFallback,
  buildReadinessPayload,
  readinessAssessmentSystem,
  readinessUserPayload,
  type ReadinessPayload,
} from "@/lib/readiness-assessment";
import { parseAssessment, type Assessment } from "@/lib/assessment-core";
import type { Question, Topic } from "@/lib/types";

/**
 * Generate the AI coaching assessment for the free readiness test.
 *
 * POST { paperToken, answers: [{ id, chosen }], locale }.
 *
 * Three things make this route unlike `/api/exam/assess`, and all three follow
 * from the free test being anonymous and device-local by design (constraint 3):
 *
 *  1. **It stores nothing.** No row, no cache, no identifier. The learner's
 *     answers arrive, ground one generation, and are gone. The only thing written
 *     anywhere is a hash of the paper token, for spend control.
 *  2. **It trusts nothing in the body except which option was picked.** Prompts,
 *     correct answers and verified explanations are re-read from the database.
 *     Accepting explanation text from a client would let anyone put words in the
 *     coach's mouth, and "restate only the supplied explanations" is the whole
 *     safety property here.
 *  3. **It always answers 200.** A bad token, an expired token, a spent daily
 *     budget, a missing key, a provider failure — every one of them yields the
 *     deterministic template rather than an error. A visitor who did nothing
 *     wrong should not meet a broken screen on the app's highest-traffic surface.
 */

interface AnswerIn {
  id?: unknown;
  /** The option TEXT the learner picked, not an index. */
  chosen?: unknown;
}

/**
 * Map what the learner picked back onto canonical option indexes.
 *
 * Option order is shuffled per sitting (`sampleReadinessQuestions` →
 * `shuffleOptions`), so the index the client saw means nothing against the stored
 * row. Text is the one part of the answer we can verify: it either matches an
 * option we wrote or it does not, and an unmatched string can only ever be wrong.
 */
function canonicalChoices(
  questions: Question[],
  answers: AnswerIn[],
): Record<string, number> {
  const picked = new Map<string, string>();
  for (const a of answers) {
    if (typeof a?.id === "string" && typeof a?.chosen === "string") {
      picked.set(a.id, a.chosen);
    }
  }
  const out: Record<string, number> = {};
  for (const q of questions) {
    const text = picked.get(q.id);
    out[q.id] = text === undefined ? -1 : q.options.indexOf(text);
  }
  return out;
}

async function fallbackFor(
  payload: ReadinessPayload,
  locale: string,
): Promise<Assessment> {
  const t = await getTranslations({ locale, namespace: "assessmentFallback" });
  const tt = await getTranslations({ locale, namespace: "topics" });
  return buildReadinessFallback(payload, {
    t: (key, values) => t(key, values),
    topicLabel: (topic: Topic) => tt(topic),
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    paperToken?: unknown;
    answers?: unknown;
    locale?: unknown;
  } | null;

  const locale = validLocale(body?.locale);
  const answers: AnswerIn[] = Array.isArray(body?.answers) ? body.answers : [];
  if (!answers.length)
    return NextResponse.json({ error: "answers required" }, { status: 400 });

  const secret = paperTokenSecret();
  const verified =
    secret && typeof body?.paperToken === "string"
      ? verifyPaperToken(body.paperToken, secret)
      : null;

  // The whole readiness pool is 15 rows, so one unfiltered read is cheaper than
  // an id filter and closes the question of what an attacker could address: the
  // getter already restricts to approved + in_readiness, and nothing outside that
  // set can be reached from here whatever the request says.
  const pool = await getReadinessQuestions();

  // Only ids the token vouches for. With no valid token we still assemble the
  // sitting from the ids the client names — that path never calls the model, so
  // the worst it costs is a read of content that is already public in the app.
  const wanted = new Set<string>(
    verified
      ? verified.ids
      : answers
          .map((a) => (typeof a?.id === "string" ? a.id : ""))
          .filter(Boolean)
          .slice(0, 10),
  );
  const questions = pool.filter((q) => wanted.has(q.id));
  if (!questions.length)
    return NextResponse.json({ error: "unknown paper" }, { status: 400 });

  const payload = buildReadinessPayload(
    questions,
    canonicalChoices(questions, answers),
    new Date().toISOString(),
  );

  // Everything below decides only whether the MODEL runs. Every "no" lands on
  // the same deterministic template, at 200.
  if (!verified || !hasLlmKey()) {
    return NextResponse.json({ assessment: await fallbackFor(payload, locale) });
  }

  const token = body!.paperToken as string;
  const claim = await claimAssessment(token);
  if (claim !== "granted") {
    return NextResponse.json({
      assessment: await fallbackFor(payload, locale),
      reason: claim,
    });
  }

  let assessment: Assessment | null = null;
  try {
    const raw = await llmChat({
      system: readinessAssessmentSystem(locale),
      user: readinessUserPayload(payload),
      json: true,
      maxTokens: 900,
      onUsage: (usage) =>
        console.info("[readiness-assess] usage", {
          model: LLM_MODEL,
          locale,
          ...usage,
        }),
    });
    assessment = parseAssessment(raw, payload.allowedHrefs, READINESS_LIMITS, {
      // "Failed" on a 1-2 question sample means "got one wrong" — the useful
      // signal is which topics they actually missed something in.
      failedTopics: payload.sections.filter((s) => s.percent < 100).map((s) => s.topic),
    });
  } catch {
    assessment = null;
  }

  if (!assessment) {
    // The claim paid for a generation that never arrived. Hand it back so a
    // provider blip does not cost this learner their one shot at the real thing.
    await releaseAssessment(token);
    return NextResponse.json({ assessment: await fallbackFor(payload, locale) });
  }

  assessment.model = LLM_MODEL;
  assessment.generatedAt = new Date().toISOString();
  assessment.locale = locale;
  return NextResponse.json({ assessment });
}
