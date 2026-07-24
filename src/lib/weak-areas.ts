import type { Topic } from "@/lib/types";

/**
 * Weak-area ranking (design: docs/design-weak-area-next-lesson.md).
 *
 * Pure functions only — no Supabase, no React. The scoring heuristic is the part
 * most likely to change, so it lives here where it can be unit-tested without a
 * database and exercised in demo mode for free.
 */

/** One (question_id, correct) row joined to its objective. */
export interface AttemptJoin {
  objectiveCode: string | null;
  topic: Topic;
  correct: boolean;
  createdAt: string;
}

export interface WeakObjective {
  objectiveCode: string;
  topic: Topic;
  attempted: number;
  wrong: number;
  /** Wilson lower-bound error rate — the ranking key. */
  score: number;
  lastSeen: string;
}

/** A topic whose weakness we can't pinpoint because its questions aren't mapped. */
export interface WeakTopic {
  topic: Topic;
  wrong: number;
  /** Wrong answers on questions with no objective_code. */
  unmappedWrong: number;
}

export interface WeakAreas {
  objectives: WeakObjective[];
  /** Topics where unmapped wrong answers outnumber mapped ones — see coverage rule. */
  topics: WeakTopic[];
}

/**
 * Wilson score interval, lower bound — a confidence-adjusted error rate.
 *
 * Ranking on the raw rate puts every unlucky pair of answers at the top: 1-of-2
 * wrong (50%) beats 7-of-20 (35%) despite ten times less evidence. Laplace
 * smoothing doesn't fix it either (0.500 vs 0.364, same wrong order) because it
 * shifts the estimate without accounting for sample size.
 *
 * Wilson asks "how bad is this *at least*, given how much we've seen?", so more
 * evidence raises the floor: 1/2 → 0.09, 7/20 → 0.18. The twenty-question
 * weakness now ranks first, which is the one a learner should study.
 */
export function wilsonLowerBound(wrong: number, attempted: number): number {
  if (attempted === 0) return 0;
  const z = 1.96; // 95%
  const p = wrong / attempted;
  const z2 = z * z;
  const denominator = 1 + z2 / attempted;
  const centre = p + z2 / (2 * attempted);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * attempted)) / attempted);
  return Math.max(0, (centre - margin) / denominator);
}

/**
 * Rank a learner's weak objectives, and flag topics whose weakness is invisible
 * because the questions aren't mapped to a lesson yet.
 *
 * Recency is handled by the caller's query window (90 days), not by a decay term
 * here: keep answering an objective correctly and its old wrong answers age out
 * of the window entirely. Ties break on most-recent-first — a "next lesson"
 * recommender must not surface a struggle the learner has already moved past.
 */
export function rankWeakAreas(rows: AttemptJoin[], limit = 3): WeakAreas {
  const byObjective = new Map<string, WeakObjective>();
  // Per topic: wrong answers we could map, and wrong answers we could not.
  const topicWrong = new Map<Topic, { mapped: number; unmapped: number }>();

  for (const row of rows) {
    const bucket = topicWrong.get(row.topic) ?? { mapped: 0, unmapped: 0 };

    if (!row.objectiveCode) {
      if (!row.correct) bucket.unmapped += 1;
      topicWrong.set(row.topic, bucket);
      continue;
    }
    if (!row.correct) bucket.mapped += 1;
    topicWrong.set(row.topic, bucket);

    const prev = byObjective.get(row.objectiveCode);
    const entry: WeakObjective = prev ?? {
      objectiveCode: row.objectiveCode,
      topic: row.topic,
      attempted: 0,
      wrong: 0,
      score: 0,
      lastSeen: row.createdAt,
    };
    entry.attempted += 1;
    if (!row.correct) entry.wrong += 1;
    if (row.createdAt > entry.lastSeen) entry.lastSeen = row.createdAt;
    byObjective.set(row.objectiveCode, entry);
  }

  const objectives = [...byObjective.values()]
    // Two answers minimum, and at least one of them wrong: a single unlucky
    // answer shouldn't route a learner anywhere, and a perfect record is not a
    // weakness.
    .filter((o) => o.attempted >= 2 && o.wrong > 0)
    .map((o) => ({ ...o, score: wilsonLowerBound(o.wrong, o.attempted) }))
    .sort((a, b) =>
      b.score - a.score || b.lastSeen.localeCompare(a.lastSeen),
    )
    .slice(0, limit);

  // Coverage rule: if we couldn't map more wrong answers in a topic than we
  // could, saying "road signs need work" is honest where naming one objective
  // would be a confident guess at the wrong thing.
  const topics: WeakTopic[] = [...topicWrong.entries()]
    .filter(([, v]) => v.unmapped > 0 && v.unmapped >= v.mapped)
    .map(([topic, v]) => ({
      topic,
      wrong: v.mapped + v.unmapped,
      unmappedWrong: v.unmapped,
    }))
    .sort((a, b) => b.unmappedWrong - a.unmappedWrong);

  return { objectives, topics };
}
