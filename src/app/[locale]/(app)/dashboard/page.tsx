import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BookOpen, ClipboardCheck, Signpost, ArrowRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReadinessRing } from "@/components/readiness-ring";
import { scoreReadinessBlend, consistencyFromDays, bandFor } from "@/lib/readiness";
import {
  getUser,
  getLatestReadiness,
  getTopicAccuracy,
  getExamHistory,
  getAttemptDays,
  getWeakAreas,
  getPassedMockCount,
} from "@/lib/supabase/queries";
import { MockAdviceNote } from "@/components/exam/mock-advice-note";
import { resolveWeakAreaCards } from "@/lib/weak-area-cards";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "meta",
  });
  return { title: t("dashboard") };
}

/**
 * Learner home. Shows the DB9 readiness blend once the learner has mock history
 * (40% mock avg / 25% topic accuracy / 15% consistency, renormalised over what
 * exists); otherwise the latest readiness snapshot, or sample data for the
 * anonymous "preview the app" flow.
 */
export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tb = await getTranslations("bands");

  const user = await getUser();
  const readiness = user ? await getLatestReadiness(user.id) : null;
  const examHistory = user ? await getExamHistory(user.id, 5) : [];
  const blend =
    user && examHistory.length > 0
      ? scoreReadinessBlend({
          mockOveralls: examHistory.map((h) => h.overall ?? 0),
          topicAccuracy: await getTopicAccuracy(user.id),
          weakImprovement: null,
          consistency: consistencyFromDays(await getAttemptDays(user.id)),
        })
      : null;
  // null when the learner has no mock history and no readiness snapshot. It used
  // to fall back to a hardcoded 62 — the average of the progress page's sample
  // data — so a signed-in learner with nothing recorded was shown an invented
  // score in the ring, presented exactly like a real one. The static
  // `readinessBody` copy compounded it by naming a weakest topic (Rules, the
  // lowest of the same fake numbers) for someone with zero attempts.
  const overall = blend?.overall ?? readiness?.overall ?? null;
  const passedMocks = user ? await getPassedMockCount(user.id) : 0;

  // "The exact next lesson, not study everything" — the landing page's promise.
  // Empty for anonymous/demo learners and for anyone with no wrong answers yet,
  // in which case the section doesn't render at all.
  const weakCards = user
    ? await resolveWeakAreaCards(await getWeakAreas(user.id))
    : [];

  const cards = [
    {
      href: "/learn/road-signs",
      icon: Signpost,
      title: t("roadSignsTitle"),
      sub: t("roadSignsSub"),
    },
    {
      href: "/mock",
      icon: ClipboardCheck,
      title: t("mockTitle"),
      sub: t("mockSub"),
    },
    {
      href: "/learn",
      icon: BookOpen,
      title: t("allModulesTitle"),
      sub: t("allModulesSub"),
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">{t("welcome")}</h1>
      <p className="text-sm text-muted-foreground">{t("welcomeSub")}</p>

      <Card className="mt-5 py-0 md:max-w-2xl">
        <CardContent className="flex items-center gap-4 py-3.5 md:py-5">
          {overall === null ? (
            /* No ring at all until there is something real to put in it. A
               greyed or zeroed gauge still reads as a score, and 0% reads as
               "failed" rather than "not measured". */
            <div className="flex-1">
              <p className="text-sm font-medium">{t("readinessTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("readinessEmpty")}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-1 -ml-2 rounded-lg"
                render={
                  <Link href="/readiness">
                    {t("readinessEmptyCta")} <ArrowRight className="size-3.5" />
                  </Link>
                }
              />
            </div>
          ) : (
            <>
              <ReadinessRing percent={overall} size={120} stroke={12} />
              <div className="flex-1">
                <p className="text-sm font-medium">{t("readinessTitle")}</p>
                {/* Band derived from the score actually shown. The old fallback
                    was a static string asserting a weakest topic, which was a
                    fabricated diagnosis whenever it rendered. */}
                <p className="text-sm text-muted-foreground">
                  {tb(readiness?.band ?? bandFor(overall))}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-1 -ml-2 rounded-lg"
                  render={
                    <Link href="/progress">
                      {t("seeBreakdown")} <ArrowRight className="size-3.5" />
                    </Link>
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Signed-in learners only — an anonymous preview has no count to show. */}
      {user && (
        <MockAdviceNote passes={passedMocks} className="mt-3 md:max-w-2xl" />
      )}

      {weakCards.length > 0 && (
        <>
          <h2 className="mt-7 text-sm font-medium text-muted-foreground">
            {t("recommendedNext")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weakCards.map((card) => (
              <Card key={card.href}>
                <CardContent className="py-0">
                  <Link
                    href={card.href}
                    className="flex items-center gap-3 py-2.5 md:py-4"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                      <Target className="size-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium">{card.title}</span>
                      <span className="block text-sm text-muted-foreground">
                        {card.reason}
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-7 text-sm font-medium text-muted-foreground">
        {t("continueLearning")}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, icon: Icon, title, sub }) => (
          <Card key={href}>
            <CardContent className="py-0">
              <Link href={href} className="flex items-center gap-3 py-2.5 md:py-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block font-medium">{title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {sub}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
