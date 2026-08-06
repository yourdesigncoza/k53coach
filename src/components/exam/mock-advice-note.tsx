import { useTranslations } from "next-intl";
import { Target } from "lucide-react";
import { mockAdvice, SUGGESTED_PASSED_MOCKS } from "@/lib/mock-advice";
import { cn } from "@/lib/utils";

/**
 * The standing suggestion to pass more mock papers before booking the real
 * test, shown wherever a learner sees their own standing (mock result,
 * dashboard, progress).
 *
 * One component on purpose: the advice has to say the same thing in all three
 * places or it stops being the clear, repeated warning it exists to be. It
 * never congratulates the learner into booking — even once the suggested
 * minimum is behind them the copy keeps pointing at more practice.
 *
 * Sync (not async) so it can use `useTranslations` while still rendering
 * inside async server components.
 */
export function MockAdviceNote({
  passes,
  className,
}: {
  passes: number;
  className?: string;
}) {
  const t = useTranslations("mockAdvice");
  const { remaining, met, passes: n } = mockAdvice(passes);

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-[14px] border border-border bg-secondary/50 p-3 md:p-4",
        className,
      )}
    >
      <Target className="mt-0.5 size-4 shrink-0 text-copper-500" />
      <div className="flex-1 text-sm">
        <p className="font-medium">{t("heading")}</p>
        <p className="mt-0.5 text-muted-foreground">
          {met
            ? t("met", { passes: n })
            : t("under", {
                passes: n,
                remaining,
                target: SUGGESTED_PASSED_MOCKS,
              })}
        </p>
      </div>
    </div>
  );
}
