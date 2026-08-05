import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PracticeRunner } from "@/components/quiz/practice-runner";
import { getShuffledPracticeQuestions } from "@/lib/questions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "meta",
  });
  return { title: t("practiceSigns") };
}

export default async function RoadSignsPracticePage() {
  const questions = await getShuffledPracticeQuestions("signs");
  if (questions.length === 0) notFound();
  return <PracticeRunner questions={questions} />;
}
