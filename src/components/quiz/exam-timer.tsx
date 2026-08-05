"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Countdown for the mock exam, driven by an absolute `deadline` (epoch ms) so a
 * page refresh never resets it — the deadline is computed once from the draft's
 * start time. Turns red under 5 minutes and fires `onExpire` exactly once at 0.
 * Renders in the QuizHead right slot in place of the score (an exam shows no
 * running correct-count).
 */
export function ExamTimer({
  deadline,
  onExpire,
}: {
  deadline: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, deadline - Date.now()),
  );
  const fired = useRef(false);

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, deadline - Date.now());
      setRemaining(ms);
      if (ms <= 0 && !fired.current) {
        fired.current = true;
        onExpire();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  const t = useTranslations("exam");
  const totalSeconds = Math.ceil(remaining / 1000);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  const low = remaining <= 5 * 60 * 1000;

  return (
    <span
      className={cn(
        "font-mono font-semibold tabular-nums",
        low ? "text-destructive" : "text-[var(--surface-ink-2)]",
      )}
      aria-label={t("timeRemainingAria")}
    >
      {mm}:{String(ss).padStart(2, "0")}
    </span>
  );
}
