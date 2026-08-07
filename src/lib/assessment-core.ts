/**
 * Shared machinery for every AI coaching assessment — the paid post-mock report
 * and the free readiness read. One scaffold, one validator, one set of grounding
 * rules, so the two surfaces cannot drift apart.
 *
 * What lives here vs. in a format module:
 *  - here: the output shape, the allow-list of destinations, the validator, and
 *    the system-prompt preamble carrying the tone + grounding + never-certify
 *    rules that are identical whatever the learner just sat;
 *  - in `exam-assessment.ts` / `readiness-assessment.ts`: how that format's
 *    payload is built from its own result type, its format-specific prompt tail,
 *    and its deterministic fallback.
 *
 * Value imports stay relative with an explicit `.ts` extension: the format
 * modules are unit-tested under `node --experimental-strip-types`, which does not
 * resolve the "@/" alias for values. Nothing here may import a value from
 * `@/i18n/*` for the same reason — locale VALIDATION belongs to the route (a
 * server file); this module takes a locale string and trusts the caller checked it.
 */
import type { Topic } from "@/lib/types";
import { glossaryBlock } from "./assessment-glossary.ts";

/**
 * Bumped whenever any prompt text below changes. The exam path caches its
 * assessment, so without a version bump a prompt improvement never reaches a
 * learner who already generated one. The readiness path caches nothing
 * server-side and ignores this.
 *
 * 4 — the non-English terminology block (`assessment-glossary.ts`).
 */
export const PROMPT_VERSION = 4;

/** topic → the learner module slug used in /learn and /learn/.../practice URLs. */
export const TOPIC_SLUG: Record<Topic, string> = {
  signs: "road-signs",
  rules: "rules",
  controls: "controls",
};

/**
 * Section labels travel to the model in English deliberately, even on /af: they
 * are keys, not copy. The UI renders its own translated headings from the
 * `topics` namespace, so a model-translated label would only introduce a second,
 * unreviewed Afrikaans wording for something already translated.
 */
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
  /** The locale this prose was written in — stamped on generation, not requested. */
  locale?: string;
  /** `PROMPT_VERSION` at generation time. */
  promptVersion?: number;
}

/**
 * The heading to render for one assessment point.
 *
 * Section labels reach the model in English as keys (`TOPIC_LABEL_EN`), so a
 * model-written `title` on /af is the model's own Afrikaans for a string the app
 * already translates — it returned "Voertuigbeheer" against the `topics` label
 * "Voertuigkontroles", putting two words for one section on the same page. Take
 * our label, keyed off `point.topic`, which the model does return reliably.
 *
 * Fallback points are exempt and must stay that way: their titles are built from
 * `topics` already, and `examFocusPassingTitle` ("Keep your consistency") is not
 * a section name at all — substituting a topic there would delete it.
 */
export function pointTitle(
  point: AssessmentPoint,
  assessment: Pick<Assessment, "fallback">,
  topicLabel: (topic: Topic) => string,
): string {
  return assessment.fallback ? point.title : topicLabel(point.topic);
}

// ── Prompt ────────────────────────────────────────────────────────────────────

/**
 * Language the model writes in. The learner's verified explanations stay English
 * whatever this says — the model translates its OWN prose only. Translating the
 * question bank is the separate content pass (docs/backlog.md).
 */
const LANGUAGE_NAME: Record<string, string> = {
  en: "English",
  af: "Afrikaans (Suid-Afrikaanse Afrikaans)",
};

/** Human language name for a validated locale; defaults to English. */
export function languageName(locale: string): string {
  return LANGUAGE_NAME[locale] ?? LANGUAGE_NAME.en;
}

export interface SystemPromptOptions {
  /** A locale the CALLER has already validated against routing.locales. */
  locale: string;
  /** What the learner just sat, in learner words ("mock exam" / "quick test"). */
  sittingLabel: string;
  /** Format-specific rules appended after the shared ones. */
  formatRules: string;
}

/**
 * The shared system prompt. Everything in the first block is a rule that holds
 * for every assessment we will ever generate; only `formatRules` varies.
 *
 * Two of these are not style preferences and must not be softened:
 *  - GROUNDING: the model may only restate rules present in the supplied verified
 *    explanations. This app's recurring content failure is UK/US/EU convention
 *    stated as SA law, and an ungrounded coach is exactly how that reaches a
 *    learner (constraint 4 / memory: foreign-signage-failure-mode).
 *  - NEVER CERTIFY: we do not tell a learner they are ready or that they should
 *    book. A verdict we issue is one we own.
 */
export function buildAssessmentSystem({
  locale,
  sittingLabel,
  formatRules,
}: SystemPromptOptions): string {
  return `You are a warm, encouraging K53 driving-test coach for South African learners. You are given a learner's ${sittingLabel} result and the verified explanations of the questions they got wrong.

Write a short, personal coaching read. Rules you MUST follow:
- Write EVERY word of your output in ${languageName(locale)}, at about a Grade 8 reading level, second person, warm. The explanations you are given are in English; translate your own prose, never quote them untranslated.
- Encouraging even when the score is low — a low score means they found the gap early, never shame them.
- GROUNDING (critical): only restate rules that appear in the supplied explanations. NEVER invent or state any traffic law, penalty, distance, speed or safety rule that is not in the supplied text. If a gap has no supplied explanation, tell them to go through that section's lessons — in your own words, in the output language — instead of inventing the rule.
- Write what the learner should DO at the wheel. Never mention "the explanation", "the source", "the module text", the question bank, or any part of how this assessment was produced — the learner saw questions, not our machinery. Never quote a section, regulation or schedule number.
- Do not mention the learner's name, age, or any personal detail (you are given none).
- NEVER tell the learner they are ready for the real test, and never tell them to book it, sit it, or that they will pass — however high the score. A good paper is one good paper, not a verdict on the official test. Where you would say "you're ready", say that more practice papers are the next step instead. Praise the result, never certify it.
- Every strength must name a topic and its score. Never fill a strength slot with a mood ("you showed up", "you're not starting from zero"). If there is nothing specific to praise, return fewer strengths — an empty list is allowed and is more honest than filler.
- Do not call a section their "best" or "strongest" if they got less than half of it right. Say "least weak", or drop the comparison.
- Return ONLY a JSON object with exactly these keys:
  {
    "verdict": string,                        // one warm, band-aware sentence
    "strengths": [{"title": string, "note": string, "topic": "signs"|"rules"|"controls"}],
    "focus":     [{"title": string, "note": string, "topic": "signs"|"rules"|"controls"}],
    "plan":      [{"step": string, "minutes": number, "href": string}],  // href MUST be one of the allowed hrefs
    "oneThing":  string,                       // the single highest-leverage focus
    "ctaTopic":  "signs"|"rules"|"controls"    // the weakest section to practise first
  }
- Every plan href MUST be chosen from the allowedHrefs list in the payload.${glossaryBlock(locale)}
${formatRules}`;
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

/**
 * Translation seam for the deterministic fallbacks.
 *
 * Both fallbacks are built server-side from section scores, so they cannot use
 * `useTranslations`; the route passes `next-intl`'s `getTranslations` through
 * here instead. Tests pass a stub that echoes the key, which is also how a test
 * asserts WHICH branch was taken without pinning the copy.
 */
export interface FallbackStrings {
  t: (key: string, values?: Record<string, string | number>) => string;
  topicLabel: (topic: Topic) => string;
}

/** Per-format caps. Over-long lists are TRUNCATED, never rejected. */
export interface AssessmentLimits {
  maxStrengths: number;
  maxFocus: number;
  maxPlan: number;
  /** Below this many plan steps the output is not a plan. */
  minPlan?: number;
}

/**
 * What the learner's result says, so the validator can check the output against
 * it rather than only against itself. Optional — omit and those checks are
 * skipped rather than guessed.
 */
export interface AssessmentContext {
  /** Sections below their pass mark. Empty means everything passed. */
  failedTopics?: Topic[];
}

/**
 * Phrases that mean the model narrated its own input.
 *
 * The learner saw questions; they never saw "the explanation" or "the supplied
 * text". Naming our machinery at them breaks constraint 10 and reads as though
 * the coach is talking to a reviewer. Observed twice in run 2 and again in run 4,
 * which is why this is enforced rather than merely asked for.
 *
 * Kept short and specific on purpose: a broad list would false-positive on
 * legitimate coaching wording, and a validator that rejects good output downgrades
 * the learner to a template — a worse product than the defect it was policing.
 */
const META_REFERENCES = [
  "the explanation",
  "the explanations",
  "the supplied",
  "the source text",
  "the module text",
  "the payload",
  "the question bank",
];

/** Generous ceilings — the aim is catching runaway output, not policing style. */
const MAX_LENGTH = { verdict: 400, oneThing: 300, title: 80, note: 400, step: 300 };

function hasMetaReference(text: string): boolean {
  const lower = text.toLowerCase();
  return META_REFERENCES.some((phrase) => lower.includes(phrase));
}

/** Loose equality for plan steps: same destination, or the same sentence. */
function normaliseStep(step: string): string {
  return step.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Validate raw model JSON against the scaffold; return null if it doesn't fit,
 * which sends the caller to its deterministic fallback.
 *
 * **Repair first, reject last.** Every rule the prompt states is a request the
 * model may quietly ignore, and the result is cached and shown to someone who
 * paid — so the rules have to be enforced here or they are not rules. But the
 * fallback is a worse product than a slightly untidy real assessment, so a
 * validator that rejects freely is itself a regression. The split:
 *
 *  - **Repaired** (the output stays, the defect goes): over-long lists are
 *    truncated, duplicate plan steps dropped, and focus items aimed at a section
 *    that passed removed when some other section actually failed.
 *  - **Rejected** (nothing salvageable): malformed shape, an href outside the
 *    allow-list, an unknown topic, prose that narrates our own machinery at the
 *    learner, runaway field lengths, or a plan that repair left too short to be
 *    a plan.
 */
export function parseAssessment(
  raw: string,
  allowed: string[],
  limits?: AssessmentLimits,
  context?: AssessmentContext,
): Assessment | null {
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

  const cap = <T>(list: T[], max?: number) =>
    typeof max === "number" ? list.slice(0, max) : list;

  // ── repair ──
  const strengths = cap(a.strengths, limits?.maxStrengths);

  // Drop focus items pointed at a section that passed — but only when some
  // section actually failed, or a clean paper would lose every focus item and
  // arrive empty.
  const failed = context?.failedTopics;
  const focus = cap(
    failed && failed.length
      ? a.focus.filter((f) => failed.includes(f.topic))
      : a.focus,
    limits?.maxFocus,
  );

  // Two steps that say the same thing read as padding, and padding is what a
  // model does when it has run out of real advice (run 2: steps 3 and 4 were the
  // same task). Same destination or the same sentence counts as the same step.
  const seenHref = new Set<string>();
  const seenStep = new Set<string>();
  const plan = cap(
    a.plan.filter((s) => {
      const step = normaliseStep(s.step);
      if (seenHref.has(s.href) || seenStep.has(step)) return false;
      seenHref.add(s.href);
      seenStep.add(step);
      return true;
    }),
    limits?.maxPlan,
  );

  // ── reject ──
  if (plan.length < (limits?.minPlan ?? 1)) return null;

  const prose = [
    a.verdict,
    a.oneThing,
    ...strengths.flatMap((p) => [p.title, p.note]),
    ...focus.flatMap((p) => [p.title, p.note]),
    ...plan.map((s) => s.step),
  ];
  if (prose.some(hasMetaReference)) return null;

  if (
    a.verdict.length > MAX_LENGTH.verdict ||
    a.oneThing.length > MAX_LENGTH.oneThing ||
    [...strengths, ...focus].some(
      (p) => p.title.length > MAX_LENGTH.title || p.note.length > MAX_LENGTH.note,
    ) ||
    plan.some((s) => s.step.length > MAX_LENGTH.step)
  )
    return null;

  return {
    verdict: a.verdict,
    strengths,
    focus,
    plan: plan.map((s) => ({
      step: s.step,
      href: s.href,
      ...(typeof s.minutes === "number" ? { minutes: s.minutes } : {}),
    })),
    oneThing: a.oneThing,
    ctaTopic: a.ctaTopic,
  };
}
