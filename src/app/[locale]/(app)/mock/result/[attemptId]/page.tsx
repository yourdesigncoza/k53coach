import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReadinessRing } from "@/components/readiness-ring";
import { SectionResultCard } from "@/components/exam/section-result-card";
import { ExamReview } from "@/components/exam/exam-review";
import { ExamAssessment } from "@/components/exam/exam-assessment";
import { requireEntitledUser } from "@/lib/exam-guard";
import { getExamAttempt } from "@/lib/supabase/queries";
import { bandFor } from "@/lib/readiness";
import type { Topic, ReadinessBand } from "@/lib/types";
import type { ExamSectionResult, StoredExamAnswer } from "@/lib/exam";

const SECTION_ORDER: Topic[] = ["rules", "signs", "controls"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "meta",
  });
  return { title: t("examResult") };
}

export default async function MockResultPage({
  params,
}: {
  params: Promise<{ locale: string; attemptId: string }>;
}) {
  const { locale, attemptId } = await params;
  await requireEntitledUser(locale);

  const attempt = await getExamAttempt(attemptId);
  if (!attempt) notFound();

  const t = await getTranslations("examResult");
  const tt = await getTranslations("topics");

  const sections = (attempt.sections ??
    {}) as unknown as Record<Topic, ExamSectionResult>;
  const answers = (attempt.answers ?? []) as unknown as StoredExamAnswer[];
  const passed = !!attempt.passed;
  const overall = attempt.overall ?? 0;
  const band: ReadinessBand = passed ? "test-ready" : bandFor(overall);
  const minutes = attempt.duration_seconds
    ? Math.max(1, Math.round(attempt.duration_seconds / 60))
    : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <section className="flex flex-col items-center text-center">
        <ReadinessRing percent={overall} band={band} size={150} stroke={12} />
        <Badge
          variant="secondary"
          className={
            passed
              ? "mt-4 h-7 gap-1 px-3 text-sm [&]:text-emerald-700 dark:[&]:text-emerald-300 bg-success/10"
              : "mt-4 h-7 gap-1 px-3 text-sm bg-destructive/10 text-destructive"
          }
        >
          {passed ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <XCircle className="size-4" />
          )}
          {passed ? t("passed") : t("failed")}
        </Badge>
        <p className="mt-3 text-sm text-muted-foreground">
          {passed ? t("passedBlurb") : t("failedBlurb")}
        </p>
        {minutes !== null && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("durationLabel", { minutes })}
            {attempt.auto_submitted ? ` · ${t("autoSubmitted")}` : ""}
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("sectionsHeading")}
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {SECTION_ORDER.filter((topic) => sections[topic]).map((topic) => {
            const s = sections[topic];
            const gap = Math.max(0, s.passRequired - s.correct);
            return (
              <SectionResultCard
                key={topic}
                label={tt(topic)}
                correct={s.correct}
                total={s.total}
                passRequired={s.passRequired}
                passed={s.passed}
                passedLabel={t("sectionPassed")}
                failsExamLabel={t("sectionFails")}
                targetLabel={t("sectionTarget", {
                  passRequired: s.passRequired,
                  total: s.total,
                  gap,
                })}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <ExamAssessment
          attemptId={attemptId}
          initial={
            (attempt.assessment as Record<string, unknown> | null) ?? null
          }
        />
      </section>

      <section className="mt-8">
        <ExamReview answers={answers} />
      </section>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Button
          className="h-12 flex-1 rounded-xl"
          render={
            <Link href="/mock">
              <RotateCcw className="size-4" /> {t("retake")}
            </Link>
          }
        />
        <Button
          variant="ghost"
          className="h-12 flex-1 rounded-xl"
          render={
            <Link href="/dashboard">
              {t("backDashboard")} <ArrowRight className="size-4" />
            </Link>
          }
        />
      </div>
    </main>
  );
}
