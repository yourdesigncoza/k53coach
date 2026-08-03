import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { getReadinessQuestions } from "@/lib/questions";
import { sampleReadinessQuestions } from "@/lib/readiness-sample";

export const metadata = { title: "Free readiness test" };

// Rotates per request: the free test is a short sample of the curated pool, so a
// retake is a different paper. Rendering must not be cached or every visitor would
// get the same "random" five.
export const dynamic = "force-dynamic";

export default async function ReadinessPage() {
  const questions = sampleReadinessQuestions(await getReadinessQuestions());
  const t = await getTranslations("readiness");

  const benefits = [
    { icon: Clock, text: t("benefitTime") },
    { icon: Lock, text: t("benefitAnon") },
    { icon: CheckCircle2, text: t("benefitTopics") },
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-5 md:py-8">
        {/* Intro */}
        <section>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("intro", { count: questions.length })}</p>

          <Card className="mt-6">
            <CardContent className="flex flex-col gap-4 py-5">
              {benefits.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <Icon className="size-5 shrink-0 text-foreground" />
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Test form — directly below the intro, no button */}
        {questions.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">{t("empty")}</p>
        ) : (
          <QuizRunner questions={questions} />
        )}

        <p className="text-center text-xs text-muted-foreground">
          {t("agree")}{" "}
          <Link href="/legal/privacy" className="underline">
            {t("privacyNotice")}
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
