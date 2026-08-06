"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { QuizPanel } from "@/components/quiz/quiz-panel";
import { QuestionCard } from "@/components/quiz/question-card";
import {
  QuizHead,
  QuizScore,
  QuizProgress,
  QuizButton,
} from "@/components/quiz/quiz-chrome";
import { scoreDiagnostic } from "@/lib/readiness";
import type { Question } from "@/lib/types";
import { saveReadinessSitting } from "@/lib/storage";

/**
 * Diagnostic quiz engine for the free readiness test.
 *
 * Anonymous by design (POPIA / overview §11): answers and the computed result
 * live only on the device (localStorage, via saveReadinessSitting) — nothing is
 * sent to a server or tied to a person. A signed-in learner's progress is
 * persisted separately, after consent.
 */
export function QuizRunner({
  questions,
  paperToken = null,
}: {
  questions: Question[];
  /** Signed proof of which questions this device was served, for the AI
   *  assessment on the result page. Null when signing is not configured — the
   *  test itself works exactly the same without it. */
  paperToken?: string | null;
}) {
  const t = useTranslations("readiness");
  const tt = useTranslations("topics");
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const q = questions[index];
  const chosen = answers[q.id] ?? null;
  const answered = chosen !== null;
  const isLast = index === questions.length - 1;
  const progress = ((index + (answered ? 1 : 0)) / questions.length) * 100;
  const correctCount = questions.reduce(
    (n, qq) => n + (answers[qq.id] === qq.answer ? 1 : 0),
    0,
  );

  function choose(optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }));
  }

  function next() {
    if (chosen === null) return;
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    // `answers` already includes the current pick (set on choose).
    const result = scoreDiagnostic(questions, answers, new Date().toISOString());
    // Record the pick as option TEXT, not the index: option order is shuffled
    // per sitting, so an index is meaningless against the stored question the
    // assessment route reads back.
    saveReadinessSitting({
      result,
      paperToken,
      answers: questions.map((qq) => ({
        id: qq.id,
        chosen: qq.options[answers[qq.id]] ?? null,
      })),
    });
    router.push("/readiness/result");
  }

  return (
    <QuizPanel>
      <QuizHead
        left={tt(q.topic)}
        right={
          <QuizScore
            current={index + 1}
            total={questions.length}
            correct={correctCount}
          />
        }
      />
      <QuizProgress value={progress} />

      <QuestionCard question={q} chosen={chosen} onChoose={choose} />

      <div className="mt-5 flex">
        <QuizButton onClick={next} disabled={!answered} className="flex-1">
          {isLast ? t("finish") : t("next")}
        </QuizButton>
      </div>
    </QuizPanel>
  );
}
