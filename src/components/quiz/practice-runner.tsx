"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuizPanel } from "@/components/quiz/quiz-panel";
import { QuestionCard } from "@/components/quiz/question-card";
import {
  QuizHead,
  QuizScore,
  QuizProgress,
  QuizButton,
} from "@/components/quiz/quiz-chrome";
import { createClient } from "@/lib/supabase/client";
import type { Question } from "@/lib/types";

/**
 * Practice mode — instant-feedback loop. Pick an answer, see if it's right, and
 * get the verified explanation for the question (hard-coded content, editable in
 * admin Content Management). Runtime AI is intentionally NOT used here; AI is
 * reserved for offline content drafting and (later) post-test coaching.
 */
export function PracticeRunner({ questions }: { questions: Question[] }) {
  const t = useTranslations("practice");
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Anonymous practice still works; signed-in attempts are persisted (DB7).
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const q = questions[index];
  const answered = chosen !== null;
  const progress = Math.round(
    ((index + (answered ? 1 : 0)) / questions.length) * 100,
  );

  function choose(optionIndex: number) {
    if (answered) return;
    setChosen(optionIndex);
    const correct = optionIndex === q.answer;
    if (correct) setCorrectCount((c) => c + 1);

    // Record the attempt for signed-in learners (RLS scopes it to them).
    if (userId) {
      const supabase = createClient();
      void supabase?.from("attempts").insert({
        user_id: userId,
        question_id: q.id,
        topic: q.topic,
        chosen_index: optionIndex,
        correct,
      });
    }
  }

  function next() {
    if (index === questions.length - 1) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
  }

  if (done) {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <main className="mx-auto grid min-h-dvh w-full max-w-md place-items-center px-5">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-secondary">
              <CheckCircle2 className="size-7" />
            </span>
            <h1 className="text-xl font-semibold">{t("completeTitle")}</h1>
            <p className="text-3xl font-bold tabular-nums">
              {correctCount}/{questions.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {pct >= 75 ? t("completeStrong") : t("completeKeep")}
            </p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button
                className="h-12 w-full rounded-xl text-base"
                onClick={() => {
                  setIndex(0);
                  setChosen(null);
                  setCorrectCount(0);
                  setDone(false);
                }}
              >
                {t("again")}
              </Button>
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl text-base"
                render={<Link href="/learn">{t("back")}</Link>}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5 md:py-8">
      <QuizPanel>
        <QuizHead
          left={t("title")}
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
            {index === questions.length - 1 ? t("finish") : t("next")}
          </QuizButton>
        </div>
      </QuizPanel>
    </main>
  );
}
