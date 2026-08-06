/**
 * Post-exam AI coaching assessment — the 64-question paid path. Payload building,
 * the format's prompt tail, and its deterministic fallback.
 *
 * The output shape, the validator, the destination allow-list and every shared
 * grounding rule live in `assessment-core.ts` and are re-exported here so existing
 * importers keep working. Design + tone rules: docs/ai-assessment.md.
 *
 * Hard rules carried here:
 *  - grounded ONLY in the verified explanations of the questions the learner
 *    actually saw; the model never invents a legal/safety rule;
 *  - structured JSON matching a fixed scaffold — the UI renders the cards, the
 *    model never controls layout;
 *  - deterministic template fallback when there's no API key or the output is
 *    malformed, so the feature degrades to useful, never broken.
 */
import type { Topic } from "@/lib/types";
import type { ExamSectionResult, StoredExamAnswer } from "@/lib/exam";
import {
  PROMPT_VERSION,
  TOPIC_LABEL_EN,
  TOPIC_SLUG,
  allowedHrefs,
  buildAssessmentSystem,
  type Assessment,
  type AssessmentLimits,
  type AssessmentPlanStep,
  type AssessmentPoint,
  type FallbackStrings,
} from "./assessment-core.ts";

export {
  TOPIC_SLUG,
  TOPIC_LABEL_EN,
  allowedHrefs,
  parseAssessment,
  PROMPT_VERSION,
} from "./assessment-core.ts";
export type {
  Assessment,
  AssessmentPlanStep,
  AssessmentPoint,
  FallbackStrings,
} from "./assessment-core.ts";

/** A 64-question paper carries enough misses to support four of each. */
export const EXAM_LIMITS: AssessmentLimits = {
  maxStrengths: 4,
  maxFocus: 4,
  maxPlan: 4,
};

/**
 * How many times one attempt may be generated, across all locales, ever.
 *
 * A regenerate control makes repeat generation possible, and repeat generation
 * is repeat spend. Two locales plus a few retries through a bad patch is the
 * shape of honest use; anything past that is a button being leaned on.
 */
export const EXAM_GENERATION_LIMIT = 6;

// ── Cache envelope ────────────────────────────────────────────────────────────

/**
 * What `exam_attempts.assessment` holds.
 *
 * One column, one attempt, but potentially one assessment per locale — so the
 * column carries a map rather than a flat object. Before this, an /af view and
 * an /en view of the same paper fought over a single slot: whichever generated
 * last evicted the other, and the loser paid 6-7 seconds and a fresh model call
 * to get it back.
 *
 * `attempts` counts generations that SUCCEEDED. It counted failures too until an
 * adversarial review pointed out what that does: six taps of "Try again" during
 * a provider outage would exhaust the ceiling on failures alone, and the learner
 * could then never get the assessment they paid for — even after the provider
 * came back. That is a worse outcome than the retry storm the counter was
 * guarding against, and the storm is self-limiting anyway (a failed call is one
 * request by one paying learner, and the button is disabled while in flight).
 *
 * So the ceiling bounds what it should bound: repeat spend on assessments that
 * actually generated.
 */
export interface AssessmentEnvelope {
  v: 2;
  byLocale: Record<
    string,
    { promptVersion: number; assessment: Assessment } | undefined
  >;
  attempts: number;
}

/** Read whatever is in the column into the current shape. */
function toEnvelope(stored: unknown): AssessmentEnvelope {
  const empty: AssessmentEnvelope = { v: 2, byLocale: {}, attempts: 0 };
  if (!stored || typeof stored !== "object") return empty;

  const candidate = stored as Partial<AssessmentEnvelope>;
  if (candidate.v === 2 && candidate.byLocale) {
    return {
      v: 2,
      byLocale: candidate.byLocale,
      attempts: typeof candidate.attempts === "number" ? candidate.attempts : 0,
    };
  }

  // Legacy flat assessment, from before the map. Read it as whatever locale it
  // recorded (English if it predates locale stamping) rather than discarding a
  // learner's assessment on deploy.
  const flat = stored as Assessment;
  if (typeof flat.verdict !== "string") return empty;
  return {
    v: 2,
    byLocale: {
      [flat.locale ?? "en"]: {
        promptVersion: flat.promptVersion ?? 0,
        assessment: flat,
      },
    },
    attempts: 1,
  };
}

/**
 * The stored assessment for this locale, or null when the caller must generate.
 *
 * A miss on ANY of three counts: no entry for the language, an entry written
 * against an older prompt (so AP-05's improvements actually reach people who
 * already generated), or a stored fallback — which should not exist, but if one
 * ever does it must not be what the learner is stuck with.
 */
export function readCachedAssessment(
  stored: unknown,
  locale: string,
): Assessment | null {
  const entry = toEnvelope(stored).byLocale[locale];
  if (!entry?.assessment) return null;
  if (entry.promptVersion !== PROMPT_VERSION) return null;
  if (entry.assessment.fallback) return null;
  return entry.assessment;
}

/** How many generations this attempt has already consumed. */
export function generationCount(stored: unknown): number {
  return toEnvelope(stored).attempts;
}

/**
 * Merge one locale's assessment into the envelope, returning the value to write.
 *
 * A fallback is NEVER stored and never counted. Persisting one meant a brief
 * provider failure cost a paying learner the feature permanently, since the
 * cache-hit branch then answered from the template forever (AP-04); counting one
 * would have re-created that same trap through the retry button.
 *
 * Callers must pass the FRESHEST value of the column they can get: this merges
 * onto whatever it is handed, so a stale read still drops the other locale.
 */
export function writeCachedAssessment(
  stored: unknown,
  locale: string,
  assessment: Assessment,
): AssessmentEnvelope {
  const envelope = toEnvelope(stored);
  if (assessment.fallback) return envelope;
  return {
    v: 2,
    byLocale: {
      ...envelope.byLocale,
      [locale]: { promptVersion: PROMPT_VERSION, assessment },
    },
    attempts: envelope.attempts + 1,
  };
}

// ── Input payload (grounded, no PII) ──────────────────────────────────────────

export interface AssessmentPayload {
  overall: number;
  passed: boolean;
  sections: {
    topic: Topic;
    label: string;
    correct: number;
    total: number;
    passRequired: number;
    passed: boolean;
  }[];
  misses: {
    topic: Topic;
    label: string;
    topicTag: string | null;
    prompt: string;
    chosenText: string | null;
    correctText: string;
    explanation: string;
    signCode: string | null;
  }[];
  allowedHrefs: string[];
}

/** Rank sections weakest-first (by margin below their pass line). */
function weakestFirst(
  sections: Record<Topic, ExamSectionResult>,
): Topic[] {
  return (Object.keys(sections) as Topic[]).sort((a, b) => {
    const ma = sections[a].correct - sections[a].passRequired;
    const mb = sections[b].correct - sections[b].passRequired;
    return ma - mb;
  });
}

/**
 * Build the grounded model payload from a stored attempt. Caps misses (weakest
 * sections first) to bound token use; only verified fields are included.
 */
export function buildAssessmentPayload(
  overall: number,
  passed: boolean,
  sections: Record<Topic, ExamSectionResult>,
  answers: StoredExamAnswer[],
  maxMisses = 15,
): AssessmentPayload {
  const order = weakestFirst(sections);
  const sectionList = order
    .filter((topic) => sections[topic])
    .map((topic) => ({
      topic,
      label: TOPIC_LABEL_EN[topic],
      correct: sections[topic].correct,
      total: sections[topic].total,
      passRequired: sections[topic].passRequired,
      passed: sections[topic].passed,
    }));

  const rank = new Map(order.map((topic, i) => [topic, i]));
  const misses = answers
    .filter((a) => !a.correct && a.explanation)
    .sort((a, b) => (rank.get(a.topic) ?? 9) - (rank.get(b.topic) ?? 9))
    .slice(0, maxMisses)
    .map((a) => ({
      topic: a.topic,
      label: TOPIC_LABEL_EN[a.topic],
      topicTag: a.topicTag,
      prompt: a.prompt,
      chosenText: a.chosen !== null ? (a.options[a.chosen] ?? null) : null,
      correctText: a.options[a.answer] ?? "",
      explanation: a.explanation,
      signCode: a.signCode,
    }));

  return { overall, passed, sections: sectionList, misses, allowedHrefs: allowedHrefs() };
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const EXAM_FORMAT_RULES = `- Keep strengths to the passed/strong sections and focus to the weak ones. Up to 4 items each, plan 2-4 steps.
- Do not spend a plan step on a section that already passed unless nothing else needs the time, and never write two steps that are the same task. A shorter, honest plan reads as more credible than a padded one.`;

/**
 * The exam system prompt for one locale. The locale must already be validated by
 * the caller against `routing.locales` — an arbitrary string here is an unbounded
 * cache key, and an unbounded cache key is unbounded model spend.
 */
export function examAssessmentSystem(locale: string): string {
  return buildAssessmentSystem({
    locale,
    sittingLabel: "mock-exam",
    formatRules: EXAM_FORMAT_RULES,
  });
}

export function assessmentUserPayload(payload: AssessmentPayload): string {
  return JSON.stringify(payload);
}

// ── Deterministic fallback ────────────────────────────────────────────────────

/**
 * A useful assessment built purely from the section results — no model, no
 * invented rules. Used when there's no API key or the model output fails
 * validation.
 *
 * Translated, via the same seam the free readiness fallback uses. It was English
 * regardless of locale until 2026-08-06, which meant the one moment an /af buyer
 * was most likely to doubt the product — a provider outage — was also the moment
 * it stopped speaking their language.
 */
export function buildFallbackAssessment(
  payload: AssessmentPayload,
  { t, topicLabel }: FallbackStrings,
): Assessment {
  const strong = payload.sections.filter((s) => s.passed);
  const weak = payload.sections.filter((s) => !s.passed);
  const weakest = weak[0] ?? payload.sections[0];
  const ctaTopic = weakest?.topic ?? "signs";
  const weakestLabel = weakest ? topicLabel(weakest.topic) : "";

  const verdict = payload.passed
    ? t("examVerdictPassed")
    : t("examVerdictWeak", { count: weak.length });

  const strengths: AssessmentPoint[] = strong.map((s) => ({
    title: topicLabel(s.topic),
    note: t("examStrengthNote", {
      topic: topicLabel(s.topic),
      correct: s.correct,
      total: s.total,
    }),
    topic: s.topic,
  }));

  const focus: AssessmentPoint[] = weak.map((s) => ({
    title: topicLabel(s.topic),
    note: t("examFocusNote", {
      correct: s.correct,
      total: s.total,
      required: s.passRequired,
    }),
    topic: s.topic,
  }));

  const plan: AssessmentPlanStep[] = weak.length
    ? [
        {
          step: t("examPlanLearn", { topic: weakestLabel }),
          minutes: 15,
          href: `/learn/${TOPIC_SLUG[weakest.topic]}`,
        },
        {
          step: t("examPlanPractice", { topic: weakestLabel }),
          minutes: 15,
          href: `/learn/${TOPIC_SLUG[weakest.topic]}/practice`,
        },
        { step: t("examPlanRetake"), href: "/mock" },
      ]
    : [
        {
          step: t("examPlanLightPractice", { topic: weakestLabel }),
          minutes: 10,
          href: `/learn/${TOPIC_SLUG[weakest.topic]}/practice`,
        },
        { step: t("examPlanRetakeSharp"), href: "/mock" },
      ];

  const oneThing = payload.passed
    ? t("examOneThingPassed")
    : t("examOneThingWeak", { topic: weakestLabel });

  return {
    verdict,
    // A strength names a topic and a score or it is not a strength. With no
    // section over the line there is nothing specific to praise, so the list is
    // empty — that is more honest than the mood filler ("You showed up") this
    // used to emit, and the renderer already hides an empty list.
    strengths,
    focus: focus.length
      ? focus
      : [
          {
            title: t("examFocusPassingTitle"),
            note: t("examFocusPassingNote"),
            topic: ctaTopic,
          },
        ],
    plan,
    oneThing,
    ctaTopic,
    fallback: true,
  };
}
