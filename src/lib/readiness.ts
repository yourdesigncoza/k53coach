import type {
  Question,
  ReadinessBand,
  ReadinessResult,
  Topic,
  TopicScore,
} from "@/lib/types";

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
