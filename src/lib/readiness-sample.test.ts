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

// ── Option shuffling ─────────────────────────────────────────────────────────
// Added 2026-08-04. The free test rotated WHICH questions it drew but never their
// option order, so a retake met the same answer in the same slot. The fixture
// above uses identical options on every question, which cannot see that — these
// use distinguishable ones.

/** A question whose correct option text is identifiable after any reordering. */
function qq(id: string, topic: Topic, answer: number): Question {
  const opts = ["x", "y", "z"].map((s) => `${id}-${s}`);
  opts[answer] = `${id}-CORRECT`;
  return {
    id,
    topic,
    difficulty: 1,
    prompt: id,
    options: opts,
    answer,
    explanation: "",
  } as Question;
}

/** Correct answer parked at a different index per topic, so a bug can't hide. */
const richPool: Question[] = [
  ...Array.from({ length: 5 }, (_, i) => qq(`r${i}`, "rules", 0)),
  ...Array.from({ length: 5 }, (_, i) => qq(`s${i}`, "signs", 1)),
  ...Array.from({ length: 5 }, (_, i) => qq(`c${i}`, "controls", 2)),
];

test("answer still points at the correct option TEXT after shuffling", () => {
  const byId = new Map(richPool.map((x) => [x.id, x]));
  // Both branches must be observed to reorder something, or this test passes
  // vacuously when the fix is reverted — the fixture's correct text already sits
  // at the stored index, so `options[answer] === CORRECT` holds without any remap.
  const reordered = [false, false];

  for (const seed of [1, 2, 3, 7, 42, 99, 12345]) {
    const branches = [
      sampleReadinessQuestions(richPool, 5, seeded(seed)),
      // the pool.length <= size branch shuffles options too
      sampleReadinessQuestions(richPool.slice(0, 3), 5, seeded(seed)),
    ];
    branches.forEach((got, branch) => {
      for (const item of got) {
        assert.equal(
          item.options[item.answer],
          `${item.id}-CORRECT`,
          `seed ${seed}: ${item.id} answer index ${item.answer} points at the wrong option`,
        );
        const original = byId.get(item.id)!;
        if (item.options.join("\u0000") !== original.options.join("\u0000")) {
          reordered[branch] = true;
        }
      }
    });
  }

  assert.ok(reordered[0], "the main sampling path never reordered any options");
  assert.ok(reordered[1], "the small-pool path never reordered any options");
});

test("shuffling preserves the option set exactly — none lost or duplicated", () => {
  const byId = new Map(richPool.map((x) => [x.id, x]));
  let anyReordered = false;
  for (const seed of [4, 8, 15, 16, 23]) {
    for (const item of sampleReadinessQuestions(richPool, 5, seeded(seed))) {
      const original = byId.get(item.id)!;
      assert.equal(item.options.length, original.options.length);
      assert.deepEqual(
        [...item.options].sort(),
        [...original.options].sort(),
        `seed ${seed}: ${item.id} option set changed`,
      );
      if (item.options.join("\u0000") !== original.options.join("\u0000")) {
        anyReordered = true;
      }
    }
  }
  // Without this the set-equality check holds trivially on unshuffled options.
  assert.ok(anyReordered, "no option list was reordered across any seed");
});

test("option order actually varies — the correct answer is not pinned to one slot", () => {
  // Draw the same single-question pool many times; the answer index must move.
  const one = [qq("only", "rules", 0)];
  const seen = new Set<number>();
  for (let seed = 1; seed <= 40; seed++) {
    seen.add(sampleReadinessQuestions(one, 1, seeded(seed))[0].answer);
  }
  assert.ok(
    seen.size > 1,
    `correct answer never moved off index ${[...seen]} across 40 seeds — options are not being shuffled`,
  );
});

test("the drawn questions are copies — the caller's pool is not mutated", () => {
  const before = richPool.map((x) => ({ ...x, options: [...x.options] }));
  sampleReadinessQuestions(richPool, 5, seeded(5));
  assert.deepEqual(richPool, before, "sampling mutated the pool it was given");
});

test("a corrupt answer index is rejected loudly, not served as unanswerable", () => {
  // Data-repair files patch rows straight through PostgREST and bypass
  // saveQuestion's range check, so this invariant is not guaranteed on write.
  const corrupt = [{ ...qq("bad", "rules", 0), answer: 5 } as Question];
  assert.throws(
    () => sampleReadinessQuestions(corrupt, 1, seeded(1)),
    /RangeError|answer index 5/,
    "an out-of-range answer index should throw, not silently become -1",
  );
});
