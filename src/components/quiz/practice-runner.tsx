"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";

type ExplainResponse = {
  correct: boolean;
  explanation: string;
};

/**
 * Practice mode — the "Explain my mistake" loop (overview §6.3).
 *
 * Unlike the diagnostic, this gives instant feedback: pick an answer, see if
 * it's right, and get a grounded explanation from /api/ai/explain (which only
 * rephrases verified content — never invents). This is the core differentiator
 * versus a plain quiz app.
 */
export function PracticeRunner({ questions }: { questions: Question[] }) {
  const t = useTranslations("practice");
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const answered = chosen !== null;
  const progress = Math.round(
    ((index + (answered ? 1 : 0)) / questions.length) * 100,
  );

  async function choose(optionIndex: number) {
    if (answered) return;
    setChosen(optionIndex);
    if (optionIndex === q.answer) setCorrectCount((c) => c + 1);

    setLoading(true);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: q.id, chosenIndex: optionIndex }),
      });
      setExplanation(await res.json());
    } catch {
      setExplanation({
        correct: optionIndex === q.answer,
        explanation: q.explanation,
      });
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (index === questions.length - 1) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
    setExplanation(null);
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
                  setExplanation(null);
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
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-2xl px-4 pt-6">
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("counter", { current: index + 1, total: questions.length })}
          </span>
          <span className="tabular-nums">
            {t("correctCount", { count: correctCount })}
          </span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <h1 className="text-xl leading-snug font-semibold">{q.prompt}</h1>

        <div className="mt-6 flex flex-col gap-3">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answer;
            const isChosen = i === chosen;
            const showCorrect = answered && isAnswer;
            const showWrong = answered && isChosen && !isAnswer;
            return (
              <Card
                key={i}
                role="button"
                tabIndex={answered ? -1 : 0}
                aria-disabled={answered}
                onClick={() => choose(i)}
                onKeyDown={(e) => {
                  if (!answered && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    choose(i);
                  }
                }}
                className={cn(
                  "ring-1 transition-all",
                  !answered && "cursor-pointer ring-border hover:bg-muted/60",
                  showCorrect &&
                    "bg-success/10 ring-2 [--tw-ring-color:var(--success)]",
                  showWrong &&
                    "bg-destructive/10 ring-2 [--tw-ring-color:var(--destructive)]",
                  answered &&
                    !showCorrect &&
                    !showWrong &&
                    "opacity-60 ring-border",
                )}
              >
                <CardContent className="flex items-center gap-3 py-4">
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border text-sm font-semibold",
                      showCorrect &&
                        "border-transparent bg-success text-success-foreground",
                      showWrong &&
                        "border-transparent bg-destructive text-destructive-foreground",
                      !answered && "border-border text-muted-foreground",
                      answered &&
                        !showCorrect &&
                        !showWrong &&
                        "border-border text-muted-foreground",
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 text-base">{opt}</span>
                  {showCorrect && (
                    <CheckCircle2 className="size-5 text-success" />
                  )}
                  {showWrong && <XCircle className="size-5 text-destructive" />}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {answered && (
          <Card className="mt-4 bg-secondary/40">
            <CardContent className="py-4">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="size-4" /> {t("aiCoach")}
              </p>
              {loading ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> {t("explaining")}
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {explanation?.explanation ?? q.explanation}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="pb-safe sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-2xl px-4 py-3">
          <Button
            onClick={next}
            disabled={!answered || loading}
            className="h-12 w-full rounded-xl text-base"
          >
            {index === questions.length - 1 ? t("finish") : t("next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
