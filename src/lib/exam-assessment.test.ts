import { test } from "node:test";
import assert from "node:assert/strict";
import type { Topic } from "@/lib/types";
import {
  allowedHrefs,
  parseAssessment,
  EXAM_GENERATION_LIMIT,
  EXAM_LIMITS,
  PROMPT_VERSION,
  buildAssessmentPayload,
  buildFallbackAssessment,
  generationCount,
  readCachedAssessment,
  writeCachedAssessment,
  type Assessment,
} from "./exam-assessment.ts";

/** Echo the key so a test can assert which branch ran without pinning copy. */
const STRINGS = {
  t: (key: string, values?: Record<string, string | number>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
  topicLabel: (topic: Topic) => topic,
};

function assessment(locale: string, extra: Partial<Assessment> = {}): Assessment {
  return {
    verdict: `verdict-${locale}`,
    strengths: [],
    focus: [],
    plan: [],
    oneThing: "one",
    ctaTopic: "signs",
    locale,
    promptVersion: PROMPT_VERSION,
    ...extra,
  };
}

const sections = {
  rules: { correct: 25, total: 30, passRequired: 22, passed: true },
  signs: { correct: 9, total: 28, passRequired: 22, passed: false },
  controls: { correct: 2, total: 6, passRequired: 4, passed: false },
} as never;

const payload = buildAssessmentPayload(45, false, sections, []);

// ── cache envelope ────────────────────────────────────────────────────────────

test("each locale gets its own slot and neither evicts the other", () => {
  // The defect this replaced: one column, so an /af view overwrote the /en one
  // and the next English reader paid a fresh model call to get it back.
  let stored: unknown = null;
  stored = writeCachedAssessment(stored, "en", assessment("en"));
  stored = writeCachedAssessment(stored, "af", assessment("af"));

  assert.equal(readCachedAssessment(stored, "en")?.verdict, "verdict-en");
  assert.equal(readCachedAssessment(stored, "af")?.verdict, "verdict-af");
  assert.equal(generationCount(stored), 2);
});

test("a locale with no entry is a miss, not the other language", () => {
  const stored = writeCachedAssessment(null, "en", assessment("en"));
  assert.equal(readCachedAssessment(stored, "af"), null);
});

test("an entry written against an older prompt is a miss", () => {
  // Otherwise a prompt fix never reaches anyone who already generated.
  const stored = writeCachedAssessment(null, "en", assessment("en"));
  stored.byLocale.en!.promptVersion = PROMPT_VERSION - 1;
  assert.equal(readCachedAssessment(stored, "en"), null);
});

test("a fallback is neither stored nor counted", () => {
  // Counting failures would re-create the AP-04 trap through the retry button:
  // six taps during an outage would exhaust the ceiling on failures alone and
  // lock a paying learner out of the assessment permanently, even after the
  // provider recovered. Caught in adversarial review, 2026-08-06.
  const stored = writeCachedAssessment(
    null,
    "en",
    assessment("en", { fallback: true }),
  );
  assert.deepEqual(stored.byLocale, {});
  assert.equal(generationCount(stored), 0);
  assert.equal(readCachedAssessment(stored, "en"), null);
});

test("an outage cannot burn the generation ceiling", () => {
  let stored: unknown = null;
  for (let i = 0; i < EXAM_GENERATION_LIMIT * 3; i++) {
    stored = writeCachedAssessment(stored, "en", assessment("en", { fallback: true }));
  }
  assert.equal(generationCount(stored), 0);

  // ...and a success afterwards still lands.
  stored = writeCachedAssessment(stored, "en", assessment("en"));
  assert.equal(generationCount(stored), 1);
  assert.equal(readCachedAssessment(stored, "en")?.verdict, "verdict-en");
});

test("a stored fallback from an older build still reads as a miss", () => {
  // Belt and braces for AP-04: a persisted template must never be the thing a
  // paying learner is stuck with, however it got there.
  const legacy = { ...assessment("en"), fallback: true };
  assert.equal(readCachedAssessment(legacy, "en"), null);
});

test("a legacy flat assessment is kept, not discarded on deploy", () => {
  const flat = assessment("af");
  assert.equal(readCachedAssessment(flat, "af")?.verdict, "verdict-af");
  assert.equal(readCachedAssessment(flat, "en"), null);
});

test("an unstamped legacy assessment is read as English", () => {
  const flat = { ...assessment("en"), locale: undefined, promptVersion: undefined };
  // promptVersion 0 !== current, so it regenerates rather than serving prose
  // written against a prompt nobody can identify.
  assert.equal(readCachedAssessment(flat, "en"), null);
  assert.equal(generationCount(flat), 1);
});

test("garbage in the column does not throw", () => {
  for (const bad of [null, undefined, 0, "", "text", [], { nope: 1 }]) {
    assert.equal(readCachedAssessment(bad, "en"), null);
    assert.equal(generationCount(bad), 0);
  }
});

test("the generation limit is reachable by counting real generations", () => {
  let stored: unknown = null;
  for (let i = 0; i < EXAM_GENERATION_LIMIT; i++) {
    stored = writeCachedAssessment(stored, i % 2 ? "af" : "en", assessment("en"));
  }
  assert.equal(generationCount(stored), EXAM_GENERATION_LIMIT);
});

// ── validator enforcement (AP-05) ─────────────────────────────────────────────

/** A well-formed model response; tests override one field at a time. */
function raw(over: Record<string, unknown> = {}) {
  return JSON.stringify({
    verdict: "You are close.",
    strengths: [{ title: "Rules", note: "25/30 here.", topic: "rules" }],
    focus: [{ title: "Signs", note: "9/28 here.", topic: "signs" }],
    plan: [
      { step: "Learn road signs", minutes: 15, href: "/learn/road-signs" },
      { step: "Practise road signs", minutes: 15, href: "/learn/road-signs/practice" },
    ],
    oneThing: "Start with signs.",
    ctaTopic: "signs",
    ...over,
  });
}

const HREFS = allowedHrefs();
const FAILED = { failedTopics: ["signs", "controls"] as Topic[] };

test("a well-formed response passes", () => {
  assert.ok(parseAssessment(raw(), HREFS, EXAM_LIMITS, FAILED));
});

test("prose that narrates our own machinery is rejected", () => {
  // Run 2 shipped this twice: "the exceptions mentioned in the explanation".
  // The learner saw questions, not our sources (constraint 10).
  for (const field of ["verdict", "oneThing"]) {
    const bad = parseAssessment(
      raw({ [field]: "Review the exceptions in the explanation." }),
      HREFS,
      EXAM_LIMITS,
      FAILED,
    );
    assert.equal(bad, null, field);
  }
  assert.equal(
    parseAssessment(
      raw({
        plan: [
          { step: "Re-read the explanations", href: "/learn/road-signs" },
          { step: "Practise", href: "/learn/road-signs/practice" },
        ],
      }),
      HREFS,
      EXAM_LIMITS,
      FAILED,
    ),
    null,
  );
});

test("duplicate plan steps are dropped, not shipped", () => {
  // Run 2's steps 3 and 4 were the same task.
  const out = parseAssessment(
    raw({
      plan: [
        { step: "Learn road signs", href: "/learn/road-signs" },
        { step: "Learn  ROAD   signs!", href: "/learn/rules" },
        { step: "Practise road signs", href: "/learn/road-signs/practice" },
      ],
    }),
    HREFS,
    EXAM_LIMITS,
    FAILED,
  );
  assert.equal(out?.plan.length, 2);
});

test("a plan repaired below the minimum is rejected", () => {
  // Two steps that are really one is not a plan; the template is more honest.
  assert.equal(
    parseAssessment(
      raw({
        plan: [
          { step: "Practise signs", href: "/learn/road-signs/practice" },
          { step: "Practise signs", href: "/learn/road-signs/practice" },
        ],
      }),
      HREFS,
      EXAM_LIMITS,
      FAILED,
    ),
    null,
  );
});

test("focus on a section that passed is dropped when others failed", () => {
  // Run 3 sent the learner to the rules module at 83%.
  const out = parseAssessment(
    raw({
      focus: [
        { title: "Rules", note: "mirror checks", topic: "rules" },
        { title: "Signs", note: "9/28", topic: "signs" },
      ],
    }),
    HREFS,
    EXAM_LIMITS,
    FAILED,
  );
  assert.deepEqual(out?.focus.map((f) => f.topic), ["signs"]);
});

test("with nothing failed, focus is left alone", () => {
  // Filtering on an empty failed-set would empty every clean paper's focus.
  const out = parseAssessment(raw(), HREFS, EXAM_LIMITS, { failedTopics: [] });
  assert.equal(out?.focus.length, 1);
});

test("runaway field lengths are rejected", () => {
  assert.equal(
    parseAssessment(raw({ verdict: "x".repeat(500) }), HREFS, EXAM_LIMITS, FAILED),
    null,
  );
  assert.equal(
    parseAssessment(
      raw({ focus: [{ title: "Signs", note: "y".repeat(500), topic: "signs" }] }),
      HREFS,
      EXAM_LIMITS,
      FAILED,
    ),
    null,
  );
});

test("an href outside the allow-list is still rejected", () => {
  assert.equal(
    parseAssessment(
      raw({
        plan: [
          { step: "Go here", href: "/admin" },
          { step: "Practise", href: "/learn/road-signs/practice" },
        ],
      }),
      HREFS,
      EXAM_LIMITS,
      FAILED,
    ),
    null,
  );
});

// ── localised fallback ────────────────────────────────────────────────────────

test("the fallback is built from translation keys, not English literals", () => {
  // It was English on /af until 2026-08-06 — the one moment a paying Afrikaans
  // learner was most likely to doubt the product.
  const a = buildFallbackAssessment(payload, STRINGS);
  assert.match(a.verdict, /^examVerdictWeak/);
  assert.equal(a.fallback, true);
  for (const point of [...a.strengths, ...a.focus]) {
    assert.match(point.note, /^exam/);
  }
  for (const step of a.plan) {
    assert.match(step.step, /^examPlan/);
  }
});

test("the fallback names the weakest section, not merely a failed one", () => {
  // signs is 13 below its line, controls 2 — signs leads.
  const a = buildFallbackAssessment(payload, STRINGS);
  assert.equal(a.ctaTopic, "signs");
  assert.match(a.oneThing, /signs/);
});

test("a passing paper claims no weakness", () => {
  const allPassed = {
    rules: { correct: 28, total: 30, passRequired: 22, passed: true },
    signs: { correct: 26, total: 28, passRequired: 22, passed: true },
    controls: { correct: 6, total: 6, passRequired: 4, passed: true },
  } as never;
  const a = buildFallbackAssessment(
    buildAssessmentPayload(94, true, allPassed, []),
    STRINGS,
  );
  assert.match(a.verdict, /^examVerdictPassed/);
  assert.equal(a.focus.length, 1);
  assert.match(a.focus[0].note, /^examFocusPassingNote/);
});

test("a failed paper offers no mood-filler strength", () => {
  // "You showed up" used to occupy the slot. A strength names a topic and a
  // score or it is not a strength.
  const allFailed = {
    rules: { correct: 12, total: 30, passRequired: 22, passed: false },
    signs: { correct: 9, total: 28, passRequired: 22, passed: false },
    controls: { correct: 2, total: 6, passRequired: 4, passed: false },
  } as never;
  const a = buildFallbackAssessment(
    buildAssessmentPayload(36, false, allFailed, []),
    STRINGS,
  );
  assert.equal(a.strengths.length, 0);
});
