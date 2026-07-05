import { cn } from "@/lib/utils";

/**
 * One exam section's result on the white app surface: score bar against the
 * section's own pass line, and a pass/fail note. A failed section is flagged
 * loudly because in the K53 exam failing any one section fails the whole paper.
 * (This is the app-surface twin of the marketing assessment-demo's per-topic
 * card — semantic tokens here, not the fixed dark --surface-* variants.)
 */
export function SectionResultCard({
  label,
  correct,
  total,
  passRequired,
  passed,
  failsExamLabel,
  passedLabel,
  targetLabel,
}: {
  label: string;
  correct: number;
  total: number;
  passRequired: number;
  passed: boolean;
  /** "failed section — this fails the exam" */
  failsExamLabel: string;
  /** "Pass level reached" */
  passedLabel: string;
  /** e.g. "Need {passRequired}/{total} · {gap} more" */
  targetLabel: string;
}) {
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const passLine = total ? (passRequired / total) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {correct}/{total} · {percent}%
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            passed ? "bg-success" : "bg-destructive",
          )}
          style={{ width: `${percent}%` }}
        />
        {/* pass-line marker */}
        <span
          className="absolute inset-y-0 w-0.5 bg-foreground/50"
          style={{ left: `${passLine}%` }}
          aria-hidden
        />
      </div>
      <p className="mt-2 text-xs font-medium">
        {passed ? (
          <span className="text-success">{passedLabel}</span>
        ) : (
          <span className="text-destructive">
            {targetLabel} · {failsExamLabel}
          </span>
        )}
      </p>
    </div>
  );
}
