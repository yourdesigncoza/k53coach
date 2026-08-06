"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Loader2,
  CheckCircle2,
  TriangleAlert,
  Compass,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { CoachCard } from "@/components/quiz/quiz-chrome";
import { TOPIC_SLUG } from "@/lib/assessment-core";
import type { Assessment } from "@/lib/assessment-core";

/**
 * The one renderer for an AI coaching assessment, whichever surface asked for it
 * — the paid post-mock report and the free readiness read both come through here.
 *
 * It is deliberately a pure render over the `Assessment` scaffold plus one
 * generate button: the model returns data, never layout. Do not fork this for a
 * new surface. The last time a coach surface was re-implemented rather than
 * reused it drifted on padding within a day.
 */
export function AssessmentPanel({
  initial,
  endpoint,
  body,
  onGenerated,
}: {
  initial: Assessment | null;
  /** API route to POST to. */
  endpoint: string;
  /** Built at click time so the caller can read fresh client state. */
  body: () => Record<string, unknown> | null;
  /** Called with a freshly generated assessment (e.g. to cache it locally). */
  onGenerated?: (assessment: Assessment) => void;
}) {
  const t = useTranslations("assessment");
  const tt = useTranslations("topics");
  const [assessment, setAssessment] = useState<Assessment | null>(initial);
  const [loading, setLoading] = useState(false);

  async function generate() {
    const payload = body();
    if (!payload) {
      toast.error(t("error"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");
      const next = data.assessment as Assessment;
      setAssessment(next);
      onGenerated?.(next);
    } catch {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }

  if (!assessment) {
    return (
      <Button
        onClick={generate}
        disabled={loading}
        className="h-12 w-full rounded-xl text-base"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> {t("generating")}
          </>
        ) : (
          <>
            <Icon name="i-spark" size="sm" /> {t("cta")}
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CoachCard>{assessment.verdict}</CoachCard>

      {assessment.strengths.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
            <CheckCircle2 className="size-4" /> {t("strengthsHeading")}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {assessment.strengths.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{s.title}</span>
                <span className="text-muted-foreground"> — {s.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {assessment.focus.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
            <TriangleAlert className="size-4" /> {t("focusHeading")}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {assessment.focus.map((f, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{f.title}</span>
                <span className="text-muted-foreground"> — {f.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Compass className="size-4 text-copper-500" /> {t("planHeading")}
        </p>
        <ol className="mt-2 flex flex-col gap-2">
          {assessment.plan.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                {i + 1}
              </span>
              <span>
                <Link href={p.href} className="font-medium hover:underline">
                  {p.step}
                </Link>
                {typeof p.minutes === "number" && (
                  <span className="text-muted-foreground"> · ~{p.minutes} min</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl bg-secondary/60 p-4 md:p-5">
        <p className="text-sm font-semibold">{t("oneThingHeading")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{assessment.oneThing}</p>
      </div>

      <Button
        className="h-12 w-full rounded-xl"
        render={
          <Link href={`/learn/${TOPIC_SLUG[assessment.ctaTopic]}/practice`}>
            {t("practiceCta", { topic: tt(assessment.ctaTopic) })}
            <ArrowRight className="size-4" />
          </Link>
        }
      />

      {assessment.fallback && (
        <p className="text-center text-xs text-muted-foreground">
          {t("fallbackNote")}
        </p>
      )}
    </div>
  );
}
