/**
 * Post-exam AI coaching assessment — payload building, output validation, and a
 * deterministic fallback. Design + tone rules: docs/ai-assessment.md.
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

/** topic → the learner module slug used in /learn and /learn/.../practice URLs. */
export const TOPIC_SLUG: Record<Topic, string> = {
  signs: "road-signs",
  rules: "rules",
  controls: "controls",
};

export const TOPIC_LABEL_EN: Record<Topic, string> = {
  signs: "Road Signs",
  rules: "Rules of the Road",
  controls: "Vehicle Controls",
};

/** Allowed plan destinations (the model must pick from these). */
export function allowedHrefs(): string[] {
  const hrefs: string[] = ["/mock"];
  for (const topic of Object.keys(TOPIC_SLUG) as Topic[]) {
    hrefs.push(`/learn/${TOPIC_SLUG[topic]}`);
    hrefs.push(`/learn/${TOPIC_SLUG[topic]}/practice`);
  }
  return hrefs;
}

export interface AssessmentPlanStep {
  step: string;
  minutes?: number;
  href: string;
}

export interface AssessmentPoint {
  title: string;
  note: string;
  topic: Topic;
}

export interface Assessment {
  verdict: string;
  strengths: AssessmentPoint[];
  focus: AssessmentPoint[];
  plan: AssessmentPlanStep[];
  oneThing: string;
  ctaTopic: Topic;
  fallback?: boolean;
  model?: string;
  generatedAt?: string;
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

export const ASSESSMENT_SYSTEM = `You are a warm, encouraging K53 driving-test coach for South African learners. You are given a learner's mock-exam result and the verified explanations of the questions they got wrong.

Write a short, personal coaching read. Rules you MUST follow:
- Second person, warm, plain English at about a Grade 8 reading level. Encouraging even when the score is low — a low score means they found the gap early, never shame them.
- GROUNDING (critical): only restate rules that appear in the supplied explanations. NEVER invent or state any traffic law, penalty, distance, speed or safety rule that is not in the supplied text. If a gap has no supplied explanation, say "review the {section} module" instead of inventing the rule.
- Do not mention the learner's name, age, or any personal detail (you are given none).
- Return ONLY a JSON object with exactly these keys:
  {
    "verdict": string,                        // one warm, band-aware sentence
    "strengths": [{"title": string, "note": string, "topic": "signs"|"rules"|"controls"}],
    "focus":     [{"title": string, "note": string, "topic": "signs"|"rules"|"controls"}],
    "plan":      [{"step": string, "minutes": number, "href": string}],  // href MUST be one of the allowed hrefs
    "oneThing":  string,                       // the single highest-leverage focus
    "ctaTopic":  "signs"|"rules"|"controls"    // the weakest section to practise first
  }
- Every plan href MUST be chosen from the allowedHrefs list in the payload. Keep strengths to the passed/strong sections and focus to the weak ones. 2-4 items each, plan 2-4 steps.`;

export function assessmentUserPayload(payload: AssessmentPayload): string {
  return JSON.stringify(payload);
}

// ── Validation ────────────────────────────────────────────────────────────────

const TOPICS: Topic[] = ["signs", "rules", "controls"];

function isPoint(x: unknown): x is AssessmentPoint {
  const p = x as AssessmentPoint;
  return (
    !!p &&
    typeof p.title === "string" &&
    typeof p.note === "string" &&
    TOPICS.includes(p.topic)
  );
}

/** Validate raw model JSON against the scaffold; return null if it doesn't fit. */
export function parseAssessment(raw: string, allowed: string[]): Assessment | null {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  const a = obj as Assessment;
  if (!a || typeof a.verdict !== "string" || !a.verdict.trim()) return null;
  if (!Array.isArray(a.strengths) || !a.strengths.every(isPoint)) return null;
  if (!Array.isArray(a.focus) || !a.focus.every(isPoint)) return null;
  if (
    !Array.isArray(a.plan) ||
    !a.plan.every(
      (s) =>
        s &&
        typeof s.step === "string" &&
        typeof s.href === "string" &&
        allowed.includes(s.href),
    )
  )
    return null;
  if (typeof a.oneThing !== "string" || !a.oneThing.trim()) return null;
  if (!TOPICS.includes(a.ctaTopic)) return null;
  return {
    verdict: a.verdict,
    strengths: a.strengths,
    focus: a.focus,
    plan: a.plan.map((s) => ({
      step: s.step,
      href: s.href,
      ...(typeof s.minutes === "number" ? { minutes: s.minutes } : {}),
    })),
    oneThing: a.oneThing,
    ctaTopic: a.ctaTopic,
  };
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
    ? "You passed — every section is over the line. Tidy up the last few marks and you're ready to book."
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
    strengths: strengths.length
      ? strengths
      : [
          {
            title: "You showed up",
            note: "Taking a full mock is the single best way to find your gaps early.",
            topic: ctaTopic,
          },
        ],
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
