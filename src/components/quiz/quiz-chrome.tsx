import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

/**
 * Shared quiz chrome — the single source of truth for every piece of the quiz
 * frame, used by the readiness test, practice mode AND the landing quiz demo.
 * The classes here ARE the approved prototype/landing look; never restyle a
 * quiz surface locally — change it here so all three move together.
 */

/** Head row: bold display-font title left, small ink-2 meta right. */
export function QuizHead({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <strong className="font-display">{left}</strong>
      <span className="text-sm text-[var(--surface-ink-2)]">{right}</span>
    </div>
  );
}

/** Head-right meta: "1 of 15 · ✓ 3 correct" with the count in success green. */
export function QuizScore({
  current,
  total,
  correct,
}: {
  current: number;
  total: number;
  correct: number;
}) {
  const t = useTranslations("quiz");
  return (
    <>
      {t("counter", { current, total })} ·{" "}
      <span className="font-semibold text-success">
        ✓ {t("correctCount", { count: correct })}
      </span>
    </>
  );
}

/** Gold-gradient progress bar (amber→gold, animated width). */
export function QuizProgress({ value }: { value: number }) {
  return (
    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-3">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${value}%`,
          background: "linear-gradient(90deg, var(--amber-500), var(--gold-400))",
        }}
      />
    </div>
  );
}

/** The "Coach Says" explanation card shown after answering. */
export function CoachCard({ children }: { children: React.ReactNode }) {
  const t = useTranslations("quiz");
  return (
    <div className="mt-4 rounded-[14px] border border-[var(--surface-border)] bg-surface-2 p-4">
      <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-copper-500">
        <Icon name="i-spark" size="sm" /> {t("coach")}
      </p>
      <p className="mt-1.5 text-sm text-[var(--surface-ink-2)]">{children}</p>
    </div>
  );
}

/** Quiz action button: gold-gradient primary pill or bordered ghost pill. */
export function QuizButton({
  variant = "primary",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: "primary" | "ghost" }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-[14px] px-5 py-2.5 font-display text-sm font-semibold transition-opacity disabled:opacity-40",
        variant === "primary" && "text-[#2a1c0b]",
        variant === "ghost" &&
          "border border-[var(--surface-border-2)] text-[var(--surface-ink)]",
        className,
      )}
      style={
        variant === "primary"
          ? { background: "linear-gradient(180deg, var(--gold-300), var(--gold-400))" }
          : undefined
      }
      {...props}
    />
  );
}
