"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { QuestionCard } from "@/components/quiz/question-card";
import { Button } from "@/components/ui/button";
import type { StoredExamAnswer } from "@/lib/exam";
import type { Question } from "@/lib/types";

/**
 * Post-exam answer review. Renders each question exactly as it was shown (stored
 * on the attempt), in feedback mode so the verified "Coach Says" explanation and
 * right/wrong marking appear — the feedback the exam itself deliberately withheld.
 * Defaults to wrong answers only.
 */
export function ExamReview({ answers }: { answers: StoredExamAnswer[] }) {
  const t = useTranslations("examResult");
  const [showAll, setShowAll] = useState(false);

  const shown = showAll ? answers : answers.filter((a) => !a.correct);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("reviewTitle")}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-lg"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? t("wrongOnly") : t("showAll")}
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {shown.map((a, i) => {
          const question: Question = {
            id: a.id,
            topic: a.topic,
            difficulty: 1,
            prompt: a.prompt,
            options: a.options,
            answer: a.answer,
            explanation: a.explanation,
            ...(a.signCode ? { signCode: a.signCode } : {}),
          };
          return (
            <div
              key={`${a.id}-${i}`}
              className="rounded-2xl border border-[var(--surface-border)] bg-surface p-4 md:p-5"
            >
              <QuestionCard
                question={question}
                chosen={a.chosen}
                onChoose={() => {}}
                mode="feedback"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
