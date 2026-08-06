import { getTranslations } from "next-intl/server";
import { CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ReadinessRing } from "@/components/readiness-ring";
import { ResetProgressButton } from "@/components/progress/reset-progress-button";
import { bandFor, scoreReadinessBlend, consistencyFromDays } from "@/lib/readiness";
import {
  getUser,
  getTopicAccuracy,
  getExamHistory,
  getAttemptDays,
  getPassedMockCount,
} from "@/lib/supabase/queries";
import { MockAdviceNote } from "@/components/exam/mock-advice-note";
import type { Topic } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "meta",
  });
  return { title: t("progress") };
}

const TOPICS: Topic[] = ["signs", "rules", "controls"];

/*
 * There is deliberately NO sample dataset here any more.
 *
 * It used to be { signs: 78, rules: 48, controls: 60 }, shown whenever
 * getTopicAccuracy returned null — which is the case for a signed-in learner
 * with zero attempts, not just an anonymous visitor. So real users saw invented
 * per-topic bars, and their average (62) was the same number the dashboard
 * hardcoded. Fabricated progress is worse than no progress: it is the metric a
 * parent is asked to trust.
 */

export default async function ProgressPage() {
  const t = await getTranslations("progressPage");
  const tb = await getTranslations("bands");
  const tt = await getTranslations("topics");
  const tr = await getTranslations("result");
  const tm = await getTranslations("mock");

  const user = await getUser();
  const acc = user ? await getTopicAccuracy(user.id) : null;
  const examHistory = user ? await getExamHistory(user.id, 5) : [];
  const attemptDays = user ? await getAttemptDays(user.id) : [];
  const passedMocks = user ? await getPassedMockCount(user.id) : 0;

  // percent is null where the learner has answered nothing in that topic —
  // rendered as "—", never as a number.
  const rows = TOPICS.map((topic) => ({
    topic,
    percent:
      acc && acc[topic].total
        ? Math.round((acc[topic].correct / acc[topic].total) * 100)
        : null,
  }));

  // DB9 blend when the learner has mock history; else the topic-accuracy average.
  const blend =
    examHistory.length > 0
      ? scoreReadinessBlend({
          mockOveralls: examHistory.map((h) => h.overall ?? 0),
          topicAccuracy: acc,
          weakImprovement: null,
          consistency: consistencyFromDays(attemptDays),
        })
      : null;
  // Only average what was actually answered; null when nothing was.
  const answered = rows.filter((r) => r.percent !== null);
  const overall =
    blend?.overall ??
    (answered.length
      ? Math.round(answered.reduce((s, r) => s + (r.percent ?? 0), 0) / answered.length)
      : null);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">{t("title")}</h1>

      <div className="mt-5 grid gap-6 md:grid-cols-3 md:gap-10">
        <div className="flex flex-col items-center md:col-span-1 md:items-start">
          {overall === null ? (
            /* Matches the dashboard's not-yet-measured state — same component
               and same props, so the two cannot drift apart. */
            <>
              <ReadinessRing percent={0} fullTrack sublabel={tr("overall")} />
              <p className="mt-3 text-center text-sm text-muted-foreground md:text-left">
                {t("noProgressYet")}
              </p>
            </>
          ) : (
            <ReadinessRing
              percent={overall}
              label={tb(bandFor(overall))}
              sublabel={tr("overall")}
            />
          )}
          {blend && (
            <p className="mt-3 text-center text-xs text-muted-foreground md:text-left">
              {t("blendNote")}
            </p>
          )}
          {user && (
            <MockAdviceNote passes={passedMocks} className="mt-4 w-full" />
          )}
        </div>

        <div className="md:col-span-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("byTopic")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {rows.map((item) => (
              <Card key={item.topic}>
                {/* Tighter vertical padding on mobile; original spacing on md+. */}
                <CardContent className="py-0 md:py-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{tt(item.topic)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {item.percent === null ? "—" : `${item.percent}%`}
                    </span>
                  </div>
                  <Progress value={item.percent ?? 0} className="h-2.5" />
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">{t("note")}</p>
        </div>
      </div>

      {user && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("mockHeading")}
          </h2>
          {examHistory.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("noMocks")}</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {examHistory.map((h) => (
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
                    {h.passed ? tm("passed") : tm("failed")} · {h.overall ?? 0}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(h.started_at).toLocaleDateString("en-ZA", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {user && (
        <div className="mt-16 flex justify-center border-t border-border pt-8">
          <ResetProgressButton />
        </div>
      )}
    </main>
  );
}
