import type { Question, Topic } from "@/lib/types";
import { EXAM_FORMAT_B } from "./exam.ts";
import { scoreDiagnostic } from "./readiness.ts";
import {
  TOPIC_LABEL_EN,
  TOPIC_SLUG,
  allowedHrefs,
  buildAssessmentSystem,
  type Assessment,
  type AssessmentLimits,
  type FallbackStrings,
  type AssessmentPlanStep,
  type AssessmentPoint,
} from "./assessment-core.ts";

/**
 * The free readiness assessment — the same coach, sized to a five-question
 * sample instead of a 64-question paper.
 *
 * Why it is a separate format and not the paid one with smaller numbers: the
 * readiness pool is 15 questions and the sample is 5 (2 rules / 2 signs / 1
 * control, by `readinessQuota`). That is at most five misses, often one or two,
 * and sometimes none at all. The paid format's four-strengths-four-focus scaffold
 * over a one-miss payload is an invitation to pad — and padding, in a coach
 * grounded on verified content, is where invention starts.
 *
 * Two rules this format carries that the paid one does not need:
 *  - it must say out loud that five questions is a sample, not a prediction;
 *  - it must not send the learner to /mock, which they cannot reach — the free
 *    test is unpaid and `/mock` is the only entitlement-gated surface.
 */

/** Short by design — see the module note. */
export const READINESS_LIMITS: AssessmentLimits = {
  maxStrengths: 1,
  maxFocus: 2,
  maxPlan: 2,
  minPlan: 1,
};

/**
 * Plan destinations for a learner who has not paid. `/mock` is dropped: it is
 * entitlement-gated, so a plan step pointing there is a step into a paywall
 * dressed as study advice.
 */
export function readinessAllowedHrefs(): string[] {
  return allowedHrefs().filter((href) => href !== "/mock");
}

/** Section weights from the real Code B paper, biggest first. */
function topicsByExamWeight(): Topic[] {
  return [...EXAM_FORMAT_B.sections]
    .sort((a, b) => b.count - a.count)
    .map((s) => s.topic);
}

export interface ReadinessPayload {
  overall: number;
  band: string;
  sampleSize: number;
  sections: {
    topic: Topic;
    label: string;
    correct: number;
    total: number;
    percent: number;
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

/**
 * Rank topics weakest-first: lowest percent, ties broken by how much of the real
 * paper the section is worth. On a one-or-two-question-per-topic sample ties are
 * common, and "both are 0% so start with the bigger section" is the honest
 * tie-break.
 */
function weakestFirst(sections: ReadinessPayload["sections"]): Topic[] {
  const weight = topicsByExamWeight();
  return [...sections]
    .sort(
      (a, b) =>
        a.percent - b.percent ||
        weight.indexOf(a.topic) - weight.indexOf(b.topic),
    )
    .map((s) => s.topic);
}

/**
 * Build the grounded payload from the questions the learner was actually served
 * and what they picked.
 *
 * The caller must have loaded `questions` from the database, not from the request
 * body. Accepting explanation text from a client would let anyone put words in
 * the coach's mouth, and "only restate the supplied explanations" is the entire
 * safety property of this feature.
 */
export function buildReadinessPayload(
  questions: Question[],
  chosen: Record<string, number>,
  takenAt: string,
): ReadinessPayload {
  const result = scoreDiagnostic(questions, chosen, takenAt);

  const sections = result.byTopic.map((t) => ({
    topic: t.topic,
    label: TOPIC_LABEL_EN[t.topic],
    correct: t.correct,
    total: t.total,
    percent: t.percent,
  }));

  const rank = new Map(weakestFirst(sections).map((topic, i) => [topic, i]));
  const misses = questions
    .filter((q) => chosen[q.id] !== q.answer && q.explanation)
    .sort((a, b) => (rank.get(a.topic) ?? 9) - (rank.get(b.topic) ?? 9))
    .map((q) => ({
      topic: q.topic,
      label: TOPIC_LABEL_EN[q.topic],
      topicTag: q.topicTag ?? null,
      prompt: q.prompt,
      chosenText:
        typeof chosen[q.id] === "number" ? (q.options[chosen[q.id]] ?? null) : null,
      correctText: q.options[q.answer] ?? "",
      explanation: q.explanation,
      signCode: q.signCode ?? null,
    }));

  return {
    overall: result.overall,
    band: result.band,
    sampleSize: questions.length,
    sections,
    misses,
    allowedHrefs: readinessAllowedHrefs(),
  };
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const READINESS_FORMAT_RULES = `- This was a SHORT sample of a few questions, not a full paper. Say so plainly in the verdict. Never imply the score predicts the official test, and never present it as a percentage they will get on the day.
- Be brief: at most 1 strength, at most 2 focus items, exactly 2 plan steps. Fewer is better than padded.
- Every focus item must come from a question in the "misses" list. If the list is empty, return no focus items at all — do not manufacture a weakness to fill the slot.
- If they got everything right, say the sample was clean, say a few questions cannot prove they are ready, and point them at more practice.
- This learner has NOT paid. Never mention, name, recommend or allude to the mock exam / practice exam in any language — they cannot open it. Send them to the practice pages and lessons instead. Saying "do a mock-exam-style session" is the same mistake as linking to it.`;

/** The readiness system prompt for one caller-validated locale. */
export function readinessAssessmentSystem(locale: string): string {
  return buildAssessmentSystem({
    locale,
    surface: "readiness",
    sittingLabel: "quick readiness check",
    formatRules: READINESS_FORMAT_RULES,
  });
}

export function readinessUserPayload(payload: ReadinessPayload): string {
  return JSON.stringify(payload);
}

// ── Deterministic fallback ────────────────────────────────────────────────────

/**
 * The free path serves the template whenever the key is absent OR the daily cap
 * is spent — that second one is a normal operating state, not an outage, so this
 * fallback could never have been English-only on /af.
 */
export type { FallbackStrings } from "./assessment-core.ts";

/**
 * A useful assessment built purely from the section scores — no model, no
 * invented rules, and translated.
 */
export function buildReadinessFallback(
  payload: ReadinessPayload,
  { t, topicLabel }: FallbackStrings,
): Assessment {
  const order = weakestFirst(payload.sections);
  const byTopic = new Map(payload.sections.map((s) => [s.topic, s]));
  const clean = payload.misses.length === 0;

  // With nothing missed there is no weakest section — pointing at "your weak
  // area" would be inventing one. Fall back to the section that is worth the
  // most marks on the real paper, which is a fact about the exam format rather
  // than a claim about this learner.
  const target = clean ? topicsByExamWeight()[0] : order[0];
  const targetLabel = topicLabel(target);

  const strengths: AssessmentPoint[] = [];
  for (const topic of [...order].reverse()) {
    const s = byTopic.get(topic);
    // A strength names a topic and a score, or it is not a strength.
    if (s && s.percent === 100 && s.total > 0) {
      strengths.push({
        title: topicLabel(topic),
        note: t("strengthNote", {
          topic: topicLabel(topic),
          correct: s.correct,
          total: s.total,
        }),
        topic,
      });
      break;
    }
  }

  const focus: AssessmentPoint[] = clean
    ? []
    : order
        .filter((topic) => (byTopic.get(topic)?.percent ?? 100) < 100)
        .slice(0, READINESS_LIMITS.maxFocus)
        .map((topic) => {
          const s = byTopic.get(topic)!;
          return {
            title: topicLabel(topic),
            note: t("focusNote", {
              topic: topicLabel(topic),
              correct: s.correct,
              total: s.total,
            }),
            topic,
          };
        });

  const plan: AssessmentPlanStep[] = clean
    ? [
        {
          step: t("planPractice", { topic: targetLabel }),
          minutes: 10,
          href: `/learn/${TOPIC_SLUG[target]}/practice`,
        },
        {
          step: t("planLearnOther", {
            topic: topicLabel(topicsByExamWeight()[1]),
          }),
          minutes: 15,
          href: `/learn/${TOPIC_SLUG[topicsByExamWeight()[1]]}`,
        },
      ]
    : [
        {
          step: t("planLearn", { topic: targetLabel }),
          minutes: 15,
          href: `/learn/${TOPIC_SLUG[target]}`,
        },
        {
          step: t("planPractice", { topic: targetLabel }),
          minutes: 10,
          href: `/learn/${TOPIC_SLUG[target]}/practice`,
        },
      ];

  return {
    verdict: clean
      ? t("verdictClean", { count: payload.sampleSize })
      : t("verdictWeak", { count: payload.sampleSize, topic: targetLabel }),
    strengths,
    focus,
    plan,
    oneThing: clean
      ? t("oneThingClean")
      : t("oneThingWeak", { topic: targetLabel }),
    ctaTopic: target,
    fallback: true,
  };
}
