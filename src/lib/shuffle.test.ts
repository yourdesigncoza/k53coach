// Relative + explicit .ts: run under node --experimental-strip-types, which does not
// resolve the "@/" alias for VALUE imports.
import assert from "node:assert/strict";
import { test } from "node:test";
import { shuffle, shuffleOptions } from "./shuffle.ts";
import type { Question } from "./types.ts";

const q = (options: string[], answer: number): Question =>
  ({
    id: "q",
    topic: "rules",
    difficulty: 1,
    prompt: "",
    options,
    answer,
    explanation: "",
  }) as Question;

/** Deterministic rng so a failure is reproducible, not "sometimes". */
function seeded(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

test("duplicate option strings do not confuse the remap", () => {
  // The trap this avoids: indexOf on TEXT would find the first "same" and key the
  // wrong one. shuffleOptions permutes INDICES, so identical text is harmless.
  for (let s = 1; s <= 200; s++) {
    const got = shuffleOptions(q(["same", "same", "different"], 2), seeded(s));
    assert.equal(got.options[got.answer], "different", `seed ${s}`);
  }
});

test("a correct answer that is itself a duplicate string still resolves", () => {
  for (let s = 1; s <= 200; s++) {
    const got = shuffleOptions(q(["same", "same", "other"], 0), seeded(s));
    assert.equal(got.options[got.answer], "same", `seed ${s}`);
  }
});

test("every permutation is reachable and roughly uniform", () => {
  const seen = new Map<string, number>();
  for (let s = 1; s <= 6000; s++) {
    const got = shuffleOptions(q(["a", "b", "c"], 0), seeded(s));
    const key = got.options.join("");
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  assert.equal(seen.size, 6, `only saw ${[...seen.keys()].join(",")}`);
  for (const [perm, n] of seen) {
    assert.ok(
      n > 6000 / 6 / 2,
      `permutation ${perm} came up only ${n} times — biased`,
    );
  }
});

test("a single-option question is returned unchanged", () => {
  const got = shuffleOptions(q(["only"], 0), seeded(1));
  assert.deepEqual(got.options, ["only"]);
  assert.equal(got.answer, 0);
});

test("an out-of-range answer index throws rather than becoming -1", () => {
  // order.indexOf() would silently return -1, yielding a question with
  // options[-1] undefined that no learner could ever answer correctly.
  assert.throws(() => shuffleOptions(q(["a", "b", "c"], 7)), RangeError);
  assert.throws(() => shuffleOptions(q(["a", "b", "c"], -1)), RangeError);
  assert.throws(() => shuffleOptions(q([], 0)), RangeError);
  assert.throws(() => shuffleOptions(q(["a", "b"], 1.5)), RangeError);
});

test("shuffle copies rather than mutating its input", () => {
  const input = [1, 2, 3, 4, 5];
  const before = [...input];
  shuffle(input, seeded(3));
  assert.deepEqual(input, before);
});
