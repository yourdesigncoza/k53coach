"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useRouter, Link } from "@/i18n/navigation";
import { QuizPanel } from "@/components/quiz/quiz-panel";
import { QuizButton } from "@/components/quiz/quiz-chrome";
import { clearExamDraft } from "@/lib/exam-storage";
import { cn } from "@/lib/utils";
import type { ExamSectionFormat } from "@/lib/exam";

export type MockHistoryRow = {
  id: string;
  overall: number;
  passed: boolean;
  startedAt: string;
};

export function MockStart({
  totalQuestions,
  sections,
  history,
}: {
  totalQuestions: number;
  sections: ExamSectionFormat[];
  history: MockHistoryRow[];
}) {
  const t = useTranslations("mock");
  const tt = useTranslations("topics");
  const router = useRouter();
  const [timer, setTimer] = useState(true);

  function start() {
    clearExamDraft(); // discard any stale in-progress draft before a fresh sitting
    router.push(`/mock/exam?timer=${timer ? "1" : "0"}`);
  }

  return (
    <>
      <QuizPanel>
        <h1 className="font-display text-xl font-semibold text-[var(--surface-ink)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--surface-ink-2)]">
          {t("subtitle")}
        </p>

        <h2 className="mt-5 text-sm font-semibold text-[var(--surface-ink)]">
          {t("rulesTitle")}
        </h2>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-[var(--surface-ink-2)]">
          <li>• {t("rule1", { count: totalQuestions })}</li>
          <li>• {t("rule2")}</li>
          <li>• {t("rule3")}</li>
        </ul>

        {/*
          The no-return rule is a callout, not a fourth bullet: the paper is
          deliberately forward-only to match the DLTC terminal (K53-45), so a
          mis-tap on Next costs the learner a question. It has to be read
          before they start, not discovered mid-paper.
        */}
        <p className="mt-3 flex items-start gap-2 rounded-[14px] border border-[var(--surface-border)] bg-surface-2 p-3 text-sm text-[var(--surface-ink-2)]">
          <AlertTriangle className="size-4 shrink-0 text-amber-500" />
          {t("rule4")}
        </p>

        <h2 className="mt-5 text-sm font-semibold text-[var(--surface-ink)]">
          {t("sectionsHeading")}
        </h2>
        <div className="mt-2 flex flex-col gap-2">
          {sections.map((s) => (
            <div
              key={s.topic}
              className="flex items-center justify-between rounded-[14px] border border-[var(--surface-border)] bg-surface-2 px-4 py-2.5 text-sm"
            >
              <span className="font-medium text-[var(--surface-ink)]">
                {tt(s.topic)}
              </span>
              <span className="text-[var(--surface-ink-2)]">
                {s.count} · {t("passLabel", { pass: s.pass, count: s.count })}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setTimer((v) => !v)}
          className="mt-5 flex w-full items-center gap-3 rounded-[14px] border border-[var(--surface-border)] bg-surface-2 px-4 py-3 text-left"
        >
          <Clock className="size-5 shrink-0 text-copper-500" />
          <span className="flex-1">
            <span className="block text-sm font-medium text-[var(--surface-ink)]">
              {t("timerLabel")}
            </span>
            <span className="block text-xs text-[var(--surface-ink-2)]">
              {t("timerHint")}
            </span>
          </span>
          <span
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              timer ? "bg-gold-400" : "bg-surface-3",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white transition-[left]",
                timer ? "left-[22px]" : "left-0.5",
              )}
            />
          </span>
        </button>

        <div className="mt-5 flex">
          <QuizButton onClick={start} className="flex-1">
            {t("start")}
          </QuizButton>
        </div>
      </QuizPanel>

      {history.length > 0 && (
        <section className="mx-auto mt-6 w-full max-w-xl">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("history")}
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {history.map((h) => (
              <Link
                key={h.id}
                href={`/mock/result/${h.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-accent"
              >
                {h.passed ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : (
                  <XCircle className="size-5 text-destructive" />
                )}
                <span className="flex-1 font-medium">
                  {h.passed ? t("passed") : t("failed")} · {h.overall}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(h.startedAt).toLocaleDateString("en-ZA", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
