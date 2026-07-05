/**
 * Mock exam engine — pure, framework-free logic shared by the server (paper
 * assembly, pool getters) and the client (runner, scoring). No official K53
 * figures are published, so the 68-question convention lives here as a single
 * config constant; a 64-format variant is a one-line change.
 *
 * Rules (from the K53 wiki ground truth):
 *  - three sections scored INDEPENDENTLY; failing one section fails the exam;
 *  - no negative marking (a wrong/blank answer simply scores 0);
 *  - option order is shuffled per sitting so position carries no signal.
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
 * The default Code B (light motor vehicle) paper: 68 questions, sections scored
 * independently. Figures are the widely-circulated convention (unpublished
 * officially) — kept in one place so they're trivial to adjust.
 */
export const EXAM_FORMAT_B: ExamFormat = {
  vehicleCode: "B",
  timeLimitSeconds: 60 * 60,
  sections: [
    { topic: "rules", count: 30, pass: 22 },
    { topic: "signs", count: 30, pass: 23 },
    { topic: "controls", count: 8, pass: 6 },
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
): ExamPaper {
  let shortened = false;
  const sections = format.sections.map((sec) => {
    const topicPool = pool.filter((q) => q.topic === sec.topic);
    const count = Math.min(sec.count, topicPool.length);
    if (count < sec.count) shortened = true;
    const passRequired =
      count < sec.count ? Math.ceil((sec.pass * count) / sec.count) : sec.pass;
    const picked = weightedSample(topicPool, count, rand).map((q) =>
      shuffleOptions(q, rand),
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
