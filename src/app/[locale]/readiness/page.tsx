import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { getReadinessQuestions } from "@/lib/questions";
import { sampleReadinessQuestions } from "@/lib/readiness-sample";
import { paperTokenSecret, signPaperToken } from "@/lib/readiness-token";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "meta",
  });
  return { title: t("readiness") };
}

// Rotates per request: the free test is a short sample of the curated pool, so a
// retake is a different paper. Rendering must not be cached or every visitor would
// get the same "random" five.
export const dynamic = "force-dynamic";

export default async function ReadinessPage() {
  const questions = sampleReadinessQuestions(await getReadinessQuestions());
  const t = await getTranslations("readiness");

  // Sign which questions this visitor was actually served. The result page hands
  // it back to /api/readiness/assess, which will only ground an assessment in
  // these ids — the free assessment is the one LLM call in the app behind an
  // unauthenticated endpoint, so it has to cost a real page load first.
  const secret = paperTokenSecret();
  const paperToken = secret
    ? signPaperToken(
        questions.map((q) => q.id),
        secret,
      )
    : null;

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
          <QuizRunner questions={questions} paperToken={paperToken} />
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
