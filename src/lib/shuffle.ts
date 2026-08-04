// Relative + explicit .ts on the type import's siblings: this module is consumed by
// readiness-sample.ts and exam.ts, both unit-tested under --experimental-strip-types,
// which does not resolve the "@/" alias for VALUE imports. Type-only imports are
// erased, so "@/lib/types" is fine here.
import type { Question } from "@/lib/types";

/** Seam for tests; production passes nothing and gets Math.random. */
export type Rng = () => number;

/**
 * Fisher–Yates on a copy — never mutates the input.
 *
 * Lives here rather than in exam.ts or readiness-sample.ts because both needed it
 * and both had grown their own identical copy.
 */
export function shuffle<T>(items: readonly T[], rand: Rng = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Shuffle a question's option order and remap `answer` to the new index.
 *
 * Every surface that shows a question to a learner must call this. Stored option
 * order is fixed, so without it a learner sees the same answer in the same slot
 * every time — a retake becomes recall of position rather than of the rule, and
 * any positional bias in the bank is directly guessable. (Measured 2026-08-04:
 * the correct answer sat at index 0/1/2 in 101/96/77 of the 274 approved
 * three-option questions, so "always pick the first" beat chance.)
 *
 * The returned question is a copy; `answer` always points at the same option TEXT
 * it did before, just at its new position.
 */
export function shuffleOptions(q: Question, rand: Rng = Math.random): Question {
  // Guard the remap: order.indexOf() returns -1 for an answer outside the option
  // range, which would hand back a question with answer=-1 and options[-1]
  // undefined — one that no learner can ever get right, silently, forever.
  //
  // saveQuestion already rejects this on write (question-actions.ts), but the
  // data-repair files in scripts/data-repairs/ patch rows straight through
  // PostgREST and bypass that check entirely, so the invariant is not guaranteed
  // by the write path alone. Throwing is the right failure: an out-of-range
  // answer makes the question unanswerable whether or not it is shuffled, so
  // surfacing corrupt data beats serving an unwinnable question.
  if (
    !Number.isInteger(q.answer) ||
    q.answer < 0 ||
    q.answer >= q.options.length
  ) {
    throw new RangeError(
      `Question "${q.id}" has answer index ${q.answer} for ${q.options.length} option(s)`,
    );
  }

  const order = shuffle(
    q.options.map((_, i) => i),
    rand,
  );
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    answer: order.indexOf(q.answer),
  };
}
