"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SignImage } from "@/components/sign-image";
import { cn } from "@/lib/utils";
import { scoreDiagnostic } from "@/lib/readiness";
import type { Question } from "@/lib/types";
import { READINESS_RESULT_KEY } from "@/lib/storage";

/**
 * Diagnostic quiz engine for the free readiness test.
 *
 * Anonymous by design (POPIA / overview §11): answers and the computed result
 * live only in sessionStorage — nothing is sent to a server or tied to a
 * person. A signed-in learner's progress is persisted separately, after consent.
 */
export function QuizRunner({ questions }: { questions: Question[] }) {
  const t = useTranslations("readiness");
  const tt = useTranslations("topics");
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const q = questions[index];
  const selected = answers[q.id];
  const isLast = index === questions.length - 1;
  const progress = Math.round((index / questions.length) * 100);

  function choose(optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }));
  }

  function next() {
    if (selected === undefined) return;
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    const result = scoreDiagnostic(
      questions,
      { ...answers, [q.id]: selected },
      new Date().toISOString(),
    );
    sessionStorage.setItem(READINESS_RESULT_KEY, JSON.stringify(result));
    router.push("/readiness/result");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl px-4 pt-4">
        <Link
          href="/"
          className="-ml-1 mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {t("backHome")}
        </Link>
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("questionOf", { current: index + 1, total: questions.length })}
          </span>
          <span>{tt(q.topic)}</span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4">
        {q.signCode && (
          <div className="mb-4 flex justify-center">
            <SignImage
              svgFile={`signs/${q.signCode}.svg`}
              name={q.prompt}
              className="h-28 w-28 rounded-lg bg-white p-2 ring-1 ring-border"
            />
          </div>
        )}
        <h1 className="text-xl leading-snug font-semibold">{q.prompt}</h1>

        <div className="mt-5 flex flex-col gap-2.5">
          {q.options.map((opt, i) => {
            const active = selected === i;
            return (
              <Card
                key={i}
                size="sm"
                role="button"
                tabIndex={0}
                onClick={() => choose(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    choose(i);
                  }
                }}
                className={cn(
                  "cursor-pointer ring-1 transition-all",
                  active
                    ? "bg-primary/10 ring-2 ring-primary"
                    : "ring-border hover:bg-muted/60",
                )}
              >
                <CardContent className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border text-sm font-semibold",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-base">{opt}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="pb-safe sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-2xl px-4 py-3">
          <Button
            onClick={next}
            disabled={selected === undefined}
            className="h-12 w-full rounded-xl text-base"
          >
            {isLast ? t("finish") : t("next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
