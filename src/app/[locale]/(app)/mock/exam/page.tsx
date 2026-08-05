import { getTranslations } from "next-intl/server";
import { requireEntitledUser } from "@/lib/exam-guard";
import { getExamPool } from "@/lib/questions";
import { getRecentlySeenQuestionIds } from "@/lib/supabase/queries";
import { assemblePaper, EXAM_FORMAT_B } from "@/lib/exam";
import { ExamRunner } from "@/components/exam/exam-runner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "meta",
  });
  return { title: t("mockExam") };
}

// The paper is assembled fresh per request; the client resumes an in-progress
// draft from localStorage instead when one exists (so a refresh keeps the paper).
export const dynamic = "force-dynamic";

export default async function MockExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ timer?: string }>;
}) {
  const { locale } = await params;
  const { user } = await requireEntitledUser(locale);
  const sp = await searchParams;

  // Repeat suppression: the learner's last completed papers are passed in so
  // this one draws from what they haven't just answered (K53-32, Stage 1 gate).
  const [pool, recentlySeen] = await Promise.all([
    getExamPool(EXAM_FORMAT_B.vehicleCode),
    getRecentlySeenQuestionIds(user.id),
  ]);
  const paper = assemblePaper(pool, EXAM_FORMAT_B, Math.random, recentlySeen);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <ExamRunner paper={paper} timerEnabled={sp.timer !== "0"} />
    </main>
  );
}
