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
  TOPIC_LABEL_EN,
  TOPIC_SLUG,
  allowedHrefs,
  buildAssessmentSystem,
  type Assessment,
  type AssessmentLimits,
  type AssessmentPlanStep,
  type AssessmentPoint,
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
} from "./assessment-core.ts";

/** A 64-question paper carries enough misses to support four of each. */
export const EXAM_LIMITS: AssessmentLimits = {
  maxStrengths: 4,
  maxFocus: 4,
  maxPlan: 4,
};

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
 */
export function buildFallbackAssessment(payload: AssessmentPayload): Assessment {
  const strong = payload.sections.filter((s) => s.passed);
  const weak = payload.sections.filter((s) => !s.passed);
  const weakest = weak[0] ?? payload.sections[0];
  const ctaTopic = weakest?.topic ?? "signs";

  const verdict = payload.passed
    ? "You passed — every section is over the line. Tidy up the last few marks and put more papers behind you before the real test."
    : `You're not there yet, but now you know exactly where. ${
        weak.length === 1
          ? "One section is holding you back."
          : `${weak.length} sections need work.`
      }`;

  const strengths: AssessmentPoint[] = strong.map((s) => ({
    title: s.label,
    note: `You cleared ${s.label} (${s.correct}/${s.total}). Keep it sharp.`,
    topic: s.topic,
  }));

  const focus: AssessmentPoint[] = weak.map((s) => ({
    title: s.label,
    note: `You got ${s.correct}/${s.total} — you need ${s.passRequired} to pass this section. Review the module, then practise.`,
    topic: s.topic,
  }));

  const plan: AssessmentPlanStep[] = weak.length
    ? [
        {
          step: `Learn → ${weakest.label}`,
          minutes: 15,
          href: `/learn/${TOPIC_SLUG[weakest.topic]}`,
        },
        {
          step: `Practice → ${weakest.label} until you're consistently over the pass line`,
          minutes: 15,
          href: `/learn/${TOPIC_SLUG[weakest.topic]}/practice`,
        },
        { step: "Retake the mock exam", href: "/mock" },
      ]
    : [
        {
          step: `A light Practice → ${weakest.label} round`,
          minutes: 10,
          href: `/learn/${TOPIC_SLUG[weakest.topic]}/practice`,
        },
        { step: "Retake the mock exam the day before to stay sharp", href: "/mock" },
      ];

  const oneThing = payload.passed
    ? "Don't over-study — a light review beats cramming."
    : `Start with ${weakest.label}. It's the fastest way to move your score.`;

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
            title: "Keep your consistency",
            note: "You're passing — keep practising so it holds on the day.",
            topic: ctaTopic,
          },
        ],
    plan,
    oneThing,
    ctaTopic,
    fallback: true,
  };
}
