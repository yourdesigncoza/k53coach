import { test } from "node:test";
import assert from "node:assert/strict";
import type { Topic } from "@/lib/types";
import {
  EXAM_GENERATION_LIMIT,
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
