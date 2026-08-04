// Relative + explicit .ts: this module is unit-tested under node --experimental-strip-types,
// which does not resolve the "@/" alias for VALUE imports (type-only imports are erased,
// which is why other tested modules get away with "@/lib/types").
import { EXAM_FORMAT_B } from "./exam.ts";
import { shuffle, shuffleOptions, type Rng } from "./shuffle.ts";
import type { Question, Topic } from "@/lib/types";

/**
 * The free readiness test shows a SHORT, ROTATING slice of the curated pool.
 *
 * Why not just show the whole pool: the landing page sells "5 questions, 30
 * seconds", and a 15-question sit-down is a different promise. Rotating also means
 * a learner who retakes it does not simply re-answer the same paper from memory.
 *
 * Why a weighted draw rather than five at random: the score is presented as a
 * readiness signal, so the slice should look like the real paper. Code B is 30
 * rules / 28 signs / 6 controls, i.e. roughly 47% / 44% / 9%, and largest-remainder
 * over 5 questions gives 2 rules / 2 signs / 1 control. Taking five uniformly at
 * random would regularly return an all-signs paper and call it readiness.
 */
export const READINESS_QUESTION_COUNT = 5;

/** Seam for tests; production passes nothing and gets Math.random. Re-exported
 *  from ./shuffle so existing importers of `Rng` from here keep working. */
export type { Rng };

/**
 * Per-topic quota for a sample of `size`, apportioned by the real exam's section
 * weights using the largest-remainder method. Every topic that appears in the
 * format is guaranteed at least one slot when `size` allows, so a five-question
 * draw can never silently drop `controls`.
 */
export function readinessQuota(
  size: number = READINESS_QUESTION_COUNT,
): Record<Topic, number> {
  const sections = EXAM_FORMAT_B.sections;
  const total = sections.reduce((n, s) => n + s.count, 0);

  const quota = {} as Record<Topic, number>;
  const remainders: { topic: Topic; rem: number }[] = [];
  let used = 0;

  for (const s of sections) {
    const exact = (s.count / total) * size;
    // Floor, but never below one — a topic in the format should be represented.
    const floor = Math.max(1, Math.floor(exact));
    quota[s.topic] = floor;
    used += floor;
    remainders.push({ topic: s.topic, rem: exact - Math.floor(exact) });
  }

  // Hand out what's left to the largest fractional parts.
  remainders.sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (used < size && remainders.length) {
    quota[remainders[i % remainders.length].topic] += 1;
    used += 1;
    i += 1;
  }
  // If the min-one floors overshot (tiny `size`), trim from the smallest weights.
  const bySmallest = [...sections].sort((a, b) => a.count - b.count);
  let j = 0;
  while (used > size && j < bySmallest.length * size) {
    const t = bySmallest[j % bySmallest.length].topic;
    if (quota[t] > 1) {
      quota[t] -= 1;
      used -= 1;
    }
    j += 1;
  }
  return quota;
}

/**
 * Draw a rotating readiness slice from the curated pool.
 *
 * Falls back gracefully: if a topic is short of its quota the shortfall is filled
 * from whatever else is left, so a thin pool yields a smaller-but-valid test
 * rather than an empty one. Order is shuffled so the topics do not always arrive
 * in the same run.
 *
 * **Option order is shuffled too**, per question, via `shuffleOptions`. Stored
 * option order is fixed, so without it the rotation only ever changed WHICH
 * questions appeared — a learner who retook the test met the same answer in the
 * same slot, which is recall of position rather than of the rule, and undercuts
 * the readiness score this test exists to produce. The mock exam has always done
 * this in `assemblePaper`; the free test did not until 2026-08-04.
 */
export function sampleReadinessQuestions(
  pool: Question[],
  size: number = READINESS_QUESTION_COUNT,
  rng: Rng = Math.random,
): Question[] {
  if (pool.length <= size)
    return shuffle(pool, rng).map((q) => shuffleOptions(q, rng));

  const quota = readinessQuota(size);
  const picked: Question[] = [];
  const leftovers: Question[] = [];

  for (const topic of Object.keys(quota) as Topic[]) {
    const inTopic = shuffle(
      pool.filter((q) => q.topic === topic),
      rng,
    );
    picked.push(...inTopic.slice(0, quota[topic]));
    leftovers.push(...inTopic.slice(quota[topic]));
  }

  // Top up if some topic could not meet its quota.
  const short = size - picked.length;
  if (short > 0) picked.push(...shuffle(leftovers, rng).slice(0, short));

  return shuffle(picked.slice(0, size), rng).map((q) => shuffleOptions(q, rng));
}
