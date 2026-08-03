import assert from "node:assert/strict";
import { test } from "node:test";
import {
  READINESS_QUESTION_COUNT,
  readinessQuota,
  sampleReadinessQuestions,
} from "./readiness-sample.ts";
import type { Question, Topic } from "./types.ts";

function q(id: string, topic: Topic): Question {
  return {
    id,
    topic,
    difficulty: 1,
    prompt: id,
    options: ["a", "b", "c"],
    answer: 0,
    explanation: "",
  } as Question;
}

/** 15-question curated pool, 5 per topic — the shape actually in the DB. */
const pool: Question[] = [
  ...Array.from({ length: 5 }, (_, i) => q(`r${i}`, "rules")),
  ...Array.from({ length: 5 }, (_, i) => q(`s${i}`, "signs")),
  ...Array.from({ length: 5 }, (_, i) => q(`c${i}`, "controls")),
];

/** Deterministic rng so a failure is reproducible, not "sometimes". */
function seeded(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

test("quota mirrors the Code B split and sums to the sample size", () => {
  const quota = readinessQuota(5);
  assert.equal(quota.rules + quota.signs + quota.controls, 5);
  // 30/28/6 over five questions -> 2 rules, 2 signs, 1 control.
  assert.equal(quota.rules, 2);
  assert.equal(quota.signs, 2);
  assert.equal(quota.controls, 1);
});

test("every topic is represented — controls is never dropped", () => {
  for (const size of [3, 4, 5, 6, 8, 10]) {
    const quota = readinessQuota(size);
    assert.ok(quota.controls >= 1, `controls missing at size ${size}`);
    assert.equal(quota.rules + quota.signs + quota.controls, size);
  }
});

test("draws exactly the sample size from a larger pool", () => {
  const got = sampleReadinessQuestions(pool, READINESS_QUESTION_COUNT, seeded(1));
  assert.equal(got.length, 5);
  assert.equal(new Set(got.map((x) => x.id)).size, 5, "no duplicates");
});

test("respects the per-topic quota", () => {
  const got = sampleReadinessQuestions(pool, 5, seeded(7));
  const byTopic = got.reduce<Record<string, number>>(
    (a, x) => ((a[x.topic] = (a[x.topic] ?? 0) + 1), a),
    {},
  );
  assert.deepEqual(byTopic, { rules: 2, signs: 2, controls: 1 });
});

test("rotates — different seeds give different papers", () => {
  const a = sampleReadinessQuestions(pool, 5, seeded(1)).map((x) => x.id).join();
  const b = sampleReadinessQuestions(pool, 5, seeded(999)).map((x) => x.id).join();
  assert.notEqual(a, b, "sample did not rotate across seeds");
});

test("a pool at or under the sample size is returned whole", () => {
  const small = pool.slice(0, 4);
  const got = sampleReadinessQuestions(small, 5, seeded(3));
  assert.equal(got.length, 4);
  assert.deepEqual(new Set(got.map((x) => x.id)), new Set(small.map((x) => x.id)));
});

test("fills the shortfall when one topic is thin", () => {
  // No controls at all: the draw should still return 5, topped up from elsewhere.
  const thin = pool.filter((x) => x.topic !== "controls");
  const got = sampleReadinessQuestions(thin, 5, seeded(11));
  assert.equal(got.length, 5);
  assert.ok(!got.some((x) => x.topic === "controls"));
});
