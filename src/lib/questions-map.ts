import type { Tables } from "@/lib/database.types";
import type { Question, Topic } from "@/lib/types";

/**
 * The `questions` row → `Question` mapping, alone in its own module.
 *
 * It lives here rather than in `questions.ts` because that file imports
 * `@/lib/supabase/server`, which reaches `next/headers` and cannot be loaded by
 * a plain node script. The mapping itself is pure and has no such need, and a
 * script that hand-rolled its own copy would drift from the app's the first time
 * a column was added — which matters most for `answer` and `options`, where a
 * mismatch silently changes which answer is "correct".
 *
 * `questions.ts` re-exports both names, so existing imports are unaffected.
 */
export type QuestionRow = Tables<"questions">;

/** Map a DB row to the app's `Question` type, guarding the jsonb `options` shape. */
export function toQuestion(row: QuestionRow): Question {
  const options = Array.isArray(row.options) ? row.options.map(String) : [];
  return {
    id: row.id,
    topic: row.topic as Topic,
    difficulty: (row.difficulty ?? 1) as 1 | 2 | 3,
    prompt: row.prompt,
    options,
    answer: row.answer,
    explanation: row.explanation,
    ...(row.sign_code ? { signCode: row.sign_code } : {}),
    ...(row.exam_likelihood
      ? { examLikelihood: row.exam_likelihood as "high" | "medium" | "low" }
      : {}),
    ...(row.topic_tag ? { topicTag: row.topic_tag } : {}),
  };
}
