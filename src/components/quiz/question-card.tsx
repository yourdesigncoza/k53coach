import { SignImage } from "@/components/sign-image";
import {
  AnswerOption,
  answerOptionState,
  examOptionState,
} from "@/components/quiz/answer-option";
import { CoachCard } from "@/components/quiz/quiz-chrome";
import { ReportQuestionButton } from "@/components/feedback/report-question-button";
import type { Question } from "@/lib/types";

/**
 * Shared question body for the readiness test, practice mode and the landing
 * quiz demo: the sign, the prompt, the answer options with instant right/wrong
 * feedback, and the verified "Coach Says" explanation once answered. The
 * classes are the EXACT landing-demo/prototype ones — margins are part of the
 * contract (sign my-5, question mb-5, coach mt-4) since the QuizPanel has no
 * auto-gap.
 *
 * Two modes:
 *  - "feedback" (default): feedback is revealed as soon as an option is chosen
 *    and the choice locks; the verified "Coach Says" explanation shows. Used by
 *    the readiness test, practice mode, the landing demo AND post-exam review.
 *  - "exam": NO reveal, NO explanation; the choice can be changed until the
 *    learner advances (a real exam gives no per-question feedback). The selected
 *    option is highlighted.
 * The explanation is hard-coded verified content (`question.explanation`) — there
 * is NO runtime AI here, which is why the label is "Coach Says", not "AI Coach".
 *
 * `reportable` adds the inline "this looks wrong" flag under the explanation.
 * It lives HERE rather than in each surface because every learner-facing quiz
 * renders through this component — putting it in practice-runner and exam-review
 * separately is exactly the duplication that makes the two drift. Off by default
 * so the landing demo (anonymous, marketing) doesn't offer a signed-in action.
 */
export function QuestionCard({
  question,
  chosen,
  onChoose,
  mode = "feedback",
  reportable = false,
}: {
  question: Question;
  /** Chosen option index, or null while unanswered. */
  chosen: number | null;
  onChoose: (optionIndex: number) => void;
  mode?: "feedback" | "exam";
  /** Show the inline content-report flag once the learner has answered. */
  reportable?: boolean;
}) {
  const isExam = mode === "exam";
  // In feedback mode the row locks once chosen; in exam mode it stays editable.
  const answered = chosen !== null;
  const locked = !isExam && answered;

  function choose(optionIndex: number) {
    if (!locked) onChoose(optionIndex);
  }

  return (
    <>
      {question.signCode && (
        <div className="my-5 grid place-items-center">
          <SignImage
            svgFile={`signs/${question.signCode}.svg`}
            name={question.prompt}
            className="size-24 object-contain"
          />
        </div>
      )}
      <h1 className="mt-5 mb-5 text-center font-display text-lg font-semibold">
        {question.prompt}
      </h1>

      <div className="flex flex-col gap-2.5">
        {question.options.map((opt, i) => (
          <AnswerOption
            key={i}
            index={i}
            text={opt}
            state={
              isExam
                ? examOptionState(i, chosen)
                : answerOptionState(i, question.answer, chosen)
            }
            answered={locked}
            onChoose={() => choose(i)}
          />
        ))}
      </div>

      {!isExam && answered && <CoachCard>{question.explanation}</CoachCard>}

      {/* Only after answering: before that the learner has no grounds to
          disagree, and an always-visible flag invites noise. */}
      {reportable && answered && (
        <div className="mt-2 flex justify-end">
          <ReportQuestionButton
            questionId={question.id}
            signCode={question.signCode ?? null}
            chosenIndex={chosen}
            contextLabel={question.prompt}
          />
        </div>
      )}
    </>
  );
}
