import type {
  Question,
  ReadinessBand,
  ReadinessResult,
  Topic,
  TopicScore,
} from "@/lib/types";
import type { TopicAccuracy } from "@/lib/supabase/queries";

const TOPICS: Topic[] = ["signs", "rules", "controls"];

export const TOPIC_LABEL: Record<Topic, string> = {
  signs: "Road Signs",
  rules: "Rules of the Road",
  controls: "Vehicle Controls",
};

export function bandFor(percent: number): ReadinessBand {
  if (percent >= 75) return "test-ready";
  if (percent >= 50) return "almost-ready";
  return "not-ready";
}

export const BAND_LABEL: Record<ReadinessBand, string> = {
  "not-ready": "Not ready yet",
  "almost-ready": "Almost ready",
  "test-ready": "Test ready",
};

/**
 * Diagnostic scoring for the free readiness test.
 *
 * The full DB9 engine blends 40% mock average / 25% topic accuracy /
 * 20% weak-area improvement / 15% consistency — but those inputs only exist
 * once a learner has history. For the one-off anonymous diagnostic we score
 * straight topic accuracy, which is the honest signal we actually have.
 */
export function scoreDiagnostic(
  questions: Question[],
  answers: Record<string, number>,
  takenAt: string,
): ReadinessResult {
  const byTopic: TopicScore[] = TOPICS.map((topic) => {
    const inTopic = questions.filter((q) => q.topic === topic);
    const correct = inTopic.filter((q) => answers[q.id] === q.answer).length;
    const total = inTopic.length;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    return { topic, correct, total, percent };
  }).filter((t) => t.total > 0);

  const totalQ = byTopic.reduce((s, t) => s + t.total, 0);
  const totalCorrect = byTopic.reduce((s, t) => s + t.correct, 0);
  const overall = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;

  const weakest =
    byTopic.length > 0
      ? byTopic.reduce((min, t) => (t.percent < min.percent ? t : min)).topic
      : null;

  return { overall, band: bandFor(overall), byTopic, weakest, takenAt };
}

// ── DB9 readiness blend (real, history-backed) ────────────────────────────────

/** The four DB9 components; null means "no signal yet" (excluded from the blend). */
export interface BlendInputs {
  /** Recent mock-exam overall scores, most recent first (last 5 used). */
  mockOveralls: number[];
  /** Per-topic accuracy from attempts (feeds the 25% component). */
  topicAccuracy: TopicAccuracy | null;
  /** Weak-area improvement 0–100, or null when there isn't enough history. */
  weakImprovement: number | null;
  /** Consistency 0–100 (active days), or null when unknown. */
  consistency: number | null;
}

const DB9_WEIGHTS = {
  mock: 0.4,
  topic: 0.25,
  improvement: 0.2,
  consistency: 0.15,
} as const;

function mean(nums: number[]): number {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

/**
 * The DB9 readiness score: 40% mock average / 25% topic accuracy /
 * 20% weak-area improvement / 15% consistency. Only components that actually
 * have data contribute, and the weights are RENORMALISED over those present —
 * we never fabricate a blend from signals we don't have (honesty rule,
 * docs/ai-assessment.md §7). Returns null when there's no signal at all.
 */
export function scoreReadinessBlend(
  i: BlendInputs,
): { overall: number; band: ReadinessBand } | null {
  const parts: { weight: number; value: number }[] = [];

  if (i.mockOveralls.length > 0)
    parts.push({ weight: DB9_WEIGHTS.mock, value: mean(i.mockOveralls.slice(0, 5)) });

  if (i.topicAccuracy) {
    const topicPercents = TOPICS.map((t) => {
      const a = i.topicAccuracy![t];
      return a && a.total ? (a.correct / a.total) * 100 : null;
    }).filter((v): v is number => v !== null);
    if (topicPercents.length > 0)
      parts.push({ weight: DB9_WEIGHTS.topic, value: mean(topicPercents) });
  }

  if (i.weakImprovement !== null)
    parts.push({ weight: DB9_WEIGHTS.improvement, value: i.weakImprovement });

  if (i.consistency !== null)
    parts.push({ weight: DB9_WEIGHTS.consistency, value: i.consistency });

  if (parts.length === 0) return null;

  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  const overall = Math.round(
    parts.reduce((s, p) => s + p.weight * p.value, 0) / totalWeight,
  );
  return { overall, band: bandFor(overall) };
}

/**
 * Consistency component: distinct active days in the last 14 vs a 7-day target,
 * capped at 100. `activeDays` is a list of YYYY-MM-DD strings (any window).
 */
export function consistencyFromDays(activeDays: string[]): number | null {
  if (activeDays.length === 0) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = new Set(activeDays.filter((d) => d >= cutoffStr));
  return Math.min(100, Math.round((recent.size / 7) * 100));
}
