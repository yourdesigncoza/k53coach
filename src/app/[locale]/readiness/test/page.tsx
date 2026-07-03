import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { getReadinessQuestions } from "@/lib/questions";

export const metadata = { title: "Readiness test" };

export default async function ReadinessTestPage() {
  const questions = await getReadinessQuestions();
  const t = await getTranslations("readiness");

  return (
    <>
      <SiteHeader />
      {questions.length === 0 ? (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-5 py-16 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link href="/" className="text-sm underline">
            {t("backHome")}
          </Link>
        </main>
      ) : (
        <QuizRunner questions={questions} />
      )}
      <SiteFooter />
    </>
  );
}
