import { cn } from "@/lib/utils";

/**
 * The shared white "working surface" panel for every test/learning flow.
 *
 * Design rule (client-approved prototype, `.quiz-main`): quiz and structured-
 * learning content lives inside a single white `--surface` panel that floats on
 * the ivory app canvas — never rendered flat on the background. The classes
 * here are the EXACT landing-demo quiz frame; both quiz runners and the landing
 * demo use this wrapper so the frame stays pixel-identical everywhere.
 *
 * NOTE: no flex/gap — children carry the prototype's own margins (progress
 * mt-2.5, sign my-5, question mb-5, coach mt-4, actions mt-5).
 */
export function QuizPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-[var(--surface-border)] bg-surface p-5 text-[var(--surface-ink)] md:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
