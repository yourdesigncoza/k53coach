/**
 * Mock exam engine — pure, framework-free logic shared by the server (paper
 * assembly, pool getters) and the client (runner, scoring). No official K53
 * figures are published, so the paper format lives here as a single config
 * constant.
 *
 * Rules (from the K53 wiki ground truth):
 *  - three sections scored INDEPENDENTLY; failing one section fails the exam;
 *  - no negative marking (a wrong/blank answer simply scores 0);
 *  - option order is shuffled per sitting so position carries no signal.
 *
 * The last two are now corroborated by direct observation of the live terminal —
 * see docs/exam-format-analysis/. That analysis also moved the paper from 68 to
 * 64 (K53-34); what is and is not evidenced is spelled out on EXAM_FORMAT_B.
 */
import type { Question, Topic } from "@/lib/types";

export const VEHICLE_CODES = ["A", "B", "C", "EB"] as const;
export type VehicleCode = (typeof VEHICLE_CODES)[number];

export const EXAM_LIKELIHOODS = ["high", "medium", "low"] as const;
export type ExamLikelihood = (typeof EXAM_LIKELIHOODS)[number];

/** Sampling weight per likelihood — biases papers toward exam-likely items. */
export const LIKELIHOOD_WEIGHT: Record<ExamLikelihood, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export interface ExamSectionFormat {
  topic: Topic;
  count: number; // questions in this section
  pass: number; // correct answers required to pass the section
}

export interface ExamFormat {
  vehicleCode: VehicleCode;
  timeLimitSeconds: number;
  sections: ExamSectionFormat[];
}

/**
 * The default Code B (light motor vehicle) paper: 64 questions, sections scored
 * independently.
 *
 * Changed from 68 (30/30/8) on 2026-07-31 — K53-34. Evidence and its limits:
 *
 *  EVIDENCED. The paper is 64. Every legible page of four circulated memo sets
 *  reads "Question N of 64", as one continuous 1-64 counter with topics
 *  interleaved and no per-section numbering. Our three-section presentation is
 *  our own choice, not a mirror of the terminal.
 *
 *  EVIDENCED. Road markings are examined and count INSIDE the signs section —
 *  signs + markings measured ~26 of 64 against the 28 the terminal reports for
 *  signs. So markings questions carry topic "signs" (matching road_signs, which
 *  already holds the 16 marking rows) and there is deliberately no fourth Topic.
 *  The pool now carries 26 approved markings items (measured 2026-08-04), so a
 *  paper CAN contain the ~6 it should — but only by chance: assemblePaper draws
 *  the signs section as one pool and has no sub-quota forcing markings in.
 *
 *  DERIVED. The 30/28/6 split: 64 total, with 28 reported for signs, leaves 36
 *  for rules + controls; the observed mix (rules 47%, controls 11%) puts that at
 *  30/6. Consistent with the old convention's shape.
 *
 *  NOT EVIDENCED — the pass marks. The memos show no score reporting at all, so
 *  nothing here is observed. These preserve the previous convention's per-section
 *  rate, rounded UP so the mock is never more lenient than the real thing:
 *  rules 22/30 (unchanged), signs 23/30 -> 22/28, controls 6/8 -> 5/6. If a real
 *  figure surfaces (23/28 for signs is commonly quoted but we have no source for
 *  it), it is a one-number change here. Do not present these to a learner as
 *  official.
 */
export const EXAM_FORMAT_B: ExamFormat = {
  vehicleCode: "B",
  timeLimitSeconds: 60 * 60,
  sections: [
    { topic: "rules", count: 30, pass: 22 },
    { topic: "signs", count: 28, pass: 22 },
    { topic: "controls", count: 6, pass: 5 },
  ],
};

// ── Paper assembly ────────────────────────────────────────────────────────────

/** A question carrying its sampling weight (exam pool rows from the DB). */
export type PoolQuestion = Question & { examLikelihood?: ExamLikelihood };

export interface ExamPaperSection {
  topic: Topic;
  passRequired: number;
  questions: Question[];
}

export interface ExamPaper {
  format: ExamFormat;
  shortened: boolean; // true if any section pool was smaller than its target
  sections: ExamPaperSection[];
}

/** Fisher–Yates shuffle (returns a new array; does not mutate input). */
function shuffle<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Weighted sampling without replacement (Efraimidis–Spirakis): each item gets a
 * key `rand^(1/weight)`; the top-k keys are the sample. Higher weight → more
 * likely to be picked, but variety is preserved across sittings.
 */
function weightedSample(
  pool: PoolQuestion[],
  k: number,
  rand: () => number = Math.random,
): PoolQuestion[] {
  if (pool.length <= k) return shuffle(pool, rand);
  return pool
    .map((q) => {
      const w = LIKELIHOOD_WEIGHT[q.examLikelihood ?? "medium"];
      return { q, key: Math.pow(rand() || 1e-9, 1 / w) };
    })
    .sort((a, b) => b.key - a.key)
    .slice(0, k)
    .map((x) => x.q);
}

/**
 * How many of the learner's most recent papers feed repeat suppression.
 *
 * Two, not "everything ever seen". Suppressing the full history sounds stricter
 * but is worse: once the history covers the pool every question is suppressed,
 * the tiers collapse, and paper N+1 becomes the same deterministic
 * least-recently-seen list every time. A two-paper window keeps a real unseen
 * tier at the current pool sizes — rules draws 30 from 120, so two papers mark
 * at most 60 and leave 60 genuinely unseen — and it matches the metric the
 * build plan actually sets a target for: paper-over-paper overlap.
 */
export const RECENT_ATTEMPTS_SUPPRESSED = 2;

/**
 * Weighted sample of `k`, preferring questions the learner has not just seen.
 *
 * Two tiers. Draw from the unseen items first, with the normal likelihood
 * weighting, so variety costs nothing while the pool can afford it. Only if
 * that runs short do we top up from the seen items, and that top-up is taken in
 * strict least-recently-seen order rather than at random.
 *
 * Deterministic top-up is deliberate. By the time we are topping up, every
 * remaining candidate is a repeat, so there is no variety left to protect — the
 * only question is *which* repeat, and the one the learner saw longest ago is
 * strictly the best answer. Randomising there would sometimes re-serve last
 * paper's question while a staler one sat unused.
 *
 * `seenRank` maps question id → position in the recent history, 0 being the
 * most recent. Ids absent from the map are unseen.
 */
function sampleAvoidingRepeats(
  pool: PoolQuestion[],
  k: number,
  seenRank: ReadonlyMap<string, number>,
  rand: () => number = Math.random,
): PoolQuestion[] {
  if (pool.length <= k) return shuffle(pool, rand);
  if (seenRank.size === 0) return weightedSample(pool, k, rand);

  const unseen = pool.filter((q) => !seenRank.has(q.id));
  const picked = weightedSample(unseen, Math.min(k, unseen.length), rand);
  if (picked.length === k) return picked;

  const topUp = pool
    .filter((q) => seenRank.has(q.id))
    .sort((a, b) => seenRank.get(b.id)! - seenRank.get(a.id)!)
    .slice(0, k - picked.length);

  // Shuffle the union so the repeats don't land in a predictable block at the end.
  return shuffle([...picked, ...topUp], rand);
}

/** Shuffle a question's options and remap `answer` to the new index. */
function shuffleOptions(q: Question, rand: () => number = Math.random): Question {
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

/**
 * Assemble one exam paper from the approved pool. Per section: weighted-sample to
 * the target count, shuffle option order per question. If a section pool is
 * short, use the whole pool and scale its pass mark proportionally
 * (`shortened=true` so the UI can note it).
 */
export function assemblePaper(
  pool: PoolQuestion[],
  format: ExamFormat = EXAM_FORMAT_B,
  rand: () => number = Math.random,
  recentlySeen: readonly string[] = [],
): ExamPaper {
  // Most-recent-first, so the first occurrence of an id wins on duplicates —
  // a question in both of the last two papers ranks by the more recent sitting.
  const seenRank = new Map<string, number>();
  recentlySeen.forEach((id, i) => {
    if (!seenRank.has(id)) seenRank.set(id, i);
  });

  let shortened = false;
  const sections = format.sections.map((sec) => {
    const topicPool = pool.filter((q) => q.topic === sec.topic);
    const count = Math.min(sec.count, topicPool.length);
    if (count < sec.count) shortened = true;
    const passRequired =
      count < sec.count ? Math.ceil((sec.pass * count) / sec.count) : sec.pass;
    const picked = sampleAvoidingRepeats(topicPool, count, seenRank, rand).map(
      (q) => shuffleOptions(q, rand),
    );
    return { topic: sec.topic, passRequired, questions: picked };
  });
  return { format, shortened, sections };
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export interface ExamSectionResult {
  correct: number;
  total: number;
  passRequired: number;
  passed: boolean;
}

export interface ExamAnswerRecord {
  id: string;
  topic: Topic;
  chosen: number | null;
  answer: number;
  correct: boolean;
}

export interface ExamScore {
  sections: Record<Topic, ExamSectionResult>;
  answers: ExamAnswerRecord[];
  overall: number; // 0–100, share of all questions correct
  passed: boolean; // every section passed
}

/**
 * A per-question record enriched with the exact content shown this sitting. The
 * options were shuffled per paper, so the presented text/order is stored on the
 * attempt (not re-derived from the DB) — this makes review and the AI assessment
 * self-contained and immune to later edits or re-shuffles.
 */
export interface StoredExamAnswer extends ExamAnswerRecord {
  prompt: string;
  options: string[];
  explanation: string;
  signCode: string | null;
  topicTag: string | null;
}

/** Join score records with the presented paper to produce storable answers. */
export function buildStoredAnswers(
  paper: ExamPaper,
  score: ExamScore,
): StoredExamAnswer[] {
  const byId = new Map<string, Question>();
  for (const sec of paper.sections)
    for (const q of sec.questions) byId.set(q.id, q);
  return score.answers.map((a) => {
    const q = byId.get(a.id);
    return {
      ...a,
      prompt: q?.prompt ?? "",
      options: q?.options ?? [],
      explanation: q?.explanation ?? "",
      signCode: q?.signCode ?? null,
      topicTag: q?.topicTag ?? null,
    };
  });
}

/**
 * Score a completed paper. `answers` maps question id → chosen option index
 * (missing = unanswered = wrong; no negative marking). Overall pass requires
 * every section to clear its own `passRequired`.
 */
export function scoreExam(
  paper: ExamPaper,
  answers: Record<string, number>,
): ExamScore {
  const sections = {} as Record<Topic, ExamSectionResult>;
  const records: ExamAnswerRecord[] = [];
  let totalCorrect = 0;
  let totalQuestions = 0;

  for (const sec of paper.sections) {
    let correct = 0;
    for (const q of sec.questions) {
      const chosen = q.id in answers ? answers[q.id] : null;
      const isCorrect = chosen === q.answer;
      if (isCorrect) correct++;
      records.push({
        id: q.id,
        topic: q.topic,
        chosen,
        answer: q.answer,
        correct: isCorrect,
      });
    }
    sections[sec.topic] = {
      correct,
      total: sec.questions.length,
      passRequired: sec.passRequired,
      passed: correct >= sec.passRequired,
    };
    totalCorrect += correct;
    totalQuestions += sec.questions.length;
  }

  const overall =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const passed = paper.sections.every((s) => sections[s.topic].passed);
  return { sections, answers: records, overall, passed };
}
