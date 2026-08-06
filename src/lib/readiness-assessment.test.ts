import { test } from "node:test";
import assert from "node:assert/strict";
import type { Question, Topic } from "@/lib/types";
import {
  READINESS_LIMITS,
  buildReadinessFallback,
  buildReadinessPayload,
  readinessAllowedHrefs,
  readinessAssessmentSystem,
} from "./readiness-assessment.ts";

const TAKEN_AT = "2026-08-06T10:00:00.000Z";

/** Echo the key back so a test can assert which template was chosen. */
const STRINGS = {
  t: (key: string, values?: Record<string, string | number>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
  topicLabel: (topic: Topic) => topic,
};

function q(
  id: string,
  topic: Topic,
  answer = 0,
  explanation = "Verified explanation text.",
): Question {
  return {
    id,
    topic,
    difficulty: 1,
    prompt: `Prompt ${id}`,
    options: ["A", "B", "C"],
    answer,
    explanation,
  };
}

// 2 rules / 2 signs / 1 control — the real readinessQuota shape.
const PAPER: Question[] = [
  q("r1", "rules"),
  q("r2", "rules"),
  q("s1", "signs"),
  q("s2", "signs"),
  q("c1", "controls"),
];

const allWrong = Object.fromEntries(PAPER.map((x) => [x.id, 1]));
const allRight = Object.fromEntries(PAPER.map((x) => [x.id, x.answer]));

test("the plan can never point a free learner at the paid mock", () => {
  const hrefs = readinessAllowedHrefs();
  assert.ok(!hrefs.includes("/mock"));
  assert.ok(hrefs.includes("/learn/road-signs/practice"));
});

test("the payload grounds only in questions actually missed", () => {
  const chosen = { ...allRight, s1: 2 };
  const payload = buildReadinessPayload(PAPER, chosen, TAKEN_AT);
  assert.equal(payload.misses.length, 1);
  assert.equal(payload.misses[0].prompt, "Prompt s1");
  assert.equal(payload.misses[0].chosenText, "C");
  assert.equal(payload.misses[0].correctText, "A");
  assert.equal(payload.overall, 80);
  assert.equal(payload.sampleSize, 5);
});

test("a question with no explanation cannot become a focus item", () => {
  // Nothing verified to restate means nothing to say — the model would have to
  // invent the rule, which is the one thing it may never do.
  const paper = [...PAPER.slice(0, 4), q("c1", "controls", 0, "")];
  const payload = buildReadinessPayload(paper, { ...allRight, c1: 1 }, TAKEN_AT);
  assert.equal(payload.misses.length, 0);
});

test("misses are ordered weakest section first", () => {
  const chosen = { ...allRight, s1: 1, s2: 1, r1: 1 };
  const payload = buildReadinessPayload(PAPER, chosen, TAKEN_AT);
  // signs 0/2 is weaker than rules 1/2, so both signs misses come first.
  assert.deepEqual(
    payload.misses.map((m) => m.topic),
    ["signs", "signs", "rules"],
  );
});

test("a clean sample invents no weakness and certifies nothing", () => {
  const payload = buildReadinessPayload(PAPER, allRight, TAKEN_AT);
  const a = buildReadinessFallback(payload, STRINGS);
  assert.equal(a.focus.length, 0);
  assert.match(a.verdict, /^verdictClean/);
  assert.equal(a.fallback, true);
  assert.equal(a.plan.length, 2);
  for (const step of a.plan) {
    assert.ok(readinessAllowedHrefs().includes(step.href));
  }
});

test("a wiped sample still produces exactly two focus items and two steps", () => {
  const payload = buildReadinessPayload(PAPER, allWrong, TAKEN_AT);
  const a = buildReadinessFallback(payload, STRINGS);
  assert.equal(a.focus.length, READINESS_LIMITS.maxFocus);
  assert.equal(a.plan.length, READINESS_LIMITS.maxPlan);
  // Every section is 0%; the tie breaks toward the section worth the most marks
  // on the real paper, which is rules (30 of 64).
  assert.equal(a.ctaTopic, "rules");
});

test("a strength is only claimed for a section with a real score", () => {
  const wipeSigns = { ...allRight, s1: 1, s2: 1 };
  const a = buildReadinessFallback(
    buildReadinessPayload(PAPER, wipeSigns, TAKEN_AT),
    STRINGS,
  );
  assert.equal(a.strengths.length, 1);
  assert.match(a.strengths[0].note, /"correct":/);
  assert.notEqual(a.strengths[0].topic, "signs");

  const none = buildReadinessFallback(
    buildReadinessPayload(PAPER, allWrong, TAKEN_AT),
    STRINGS,
  );
  assert.equal(none.strengths.length, 0);
});

test("the prompt carries the grounding and never-certify rules in both locales", () => {
  for (const locale of ["en", "af"]) {
    const system = readinessAssessmentSystem(locale);
    assert.match(system, /NEVER invent or state any traffic law/);
    assert.match(system, /NEVER tell the learner they are ready/);
    assert.match(system, /do not manufacture a weakness/);
  }
  assert.match(readinessAssessmentSystem("af"), /Afrikaans/);
  assert.match(readinessAssessmentSystem("en"), /in English/);
  // An unknown locale must not reach the model as a language instruction.
  assert.match(readinessAssessmentSystem("zz"), /in English/);
});
