import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AnswerOptionState =
  | "idle"
  | "correct"
  | "wrong"
  | "dimmed"
  | "selected";

/**
 * THE answer-option row (prototype `.opt`) — the single source of truth for how
 * a multiple-choice option looks everywhere: readiness test, practice mode AND
 * the landing quiz demo. Do not hand-roll option rows; render this.
 *
 * Look: rounded-[14px] pill, 26px letter badge, gold hover while unanswered.
 * Feedback (see the ANSWER-FEEDBACK note in globals.css): correct → SOLID
 * `--success` badge + `--success-soft` row; wrong → SOLID `--destructive`
 * badge + `--danger-soft` row; other options dim.
 */
export function AnswerOption({
  index,
  text,
  state,
  answered,
  onChoose,
}: {
  index: number;
  text: string;
  state: AnswerOptionState;
  /** Once answered the row locks (no hover/click affordance). */
  answered: boolean;
  onChoose: () => void;
}) {
  return (
    <button
      type="button"
      disabled={answered}
      onClick={onChoose}
      className={cn(
        "flex w-full items-center gap-3 rounded-[14px] border bg-surface px-3 py-2.5 text-left text-[0.95rem] font-medium transition-colors md:px-4 md:py-3",
        state === "idle" &&
          !answered &&
          "cursor-pointer border-[var(--surface-border-2)] hover:border-gold-400 hover:bg-surface-2",
        state === "selected" &&
          "cursor-pointer border-gold-400 bg-surface-2",
        state === "correct" && "border-success bg-[var(--success-soft)]",
        state === "wrong" && "border-destructive bg-[var(--danger-soft)]",
        state === "dimmed" && "border-[var(--surface-border-2)] opacity-60",
      )}
    >
      <span
        className={cn(
          "grid size-[26px] shrink-0 place-items-center rounded-full text-xs font-bold",
          state === "correct" && "bg-success text-success-foreground",
          state === "wrong" && "bg-destructive text-destructive-foreground",
          state === "selected" && "bg-gold-400 text-[#2a1c0b]",
          (state === "idle" || state === "dimmed") &&
            "bg-surface-3 text-[var(--surface-ink-2)]",
        )}
      >
        {String.fromCharCode(65 + index)}
      </span>
      <span className="flex-1">{text}</span>
      {state === "correct" && <CheckCircle2 className="size-5 text-success" />}
      {state === "wrong" && <XCircle className="size-5 text-destructive" />}
    </button>
  );
}

/** Derive a row's visual state from the quiz answer state (feedback mode). */
export function answerOptionState(
  index: number,
  answer: number,
  chosen: number | null,
): AnswerOptionState {
  if (chosen === null) return "idle";
  if (index === answer) return "correct";
  if (index === chosen) return "wrong";
  return "dimmed";
}

/** Exam-mode state: highlight the chosen option, no right/wrong reveal. */
export function examOptionState(
  index: number,
  chosen: number | null,
): AnswerOptionState {
  return index === chosen ? "selected" : "idle";
}
