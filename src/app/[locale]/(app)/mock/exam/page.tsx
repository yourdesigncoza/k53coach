import { requireEntitledUser } from "@/lib/exam-guard";
import { getExamPool } from "@/lib/questions";
import { assemblePaper, EXAM_FORMAT_B } from "@/lib/exam";
import { ExamRunner } from "@/components/exam/exam-runner";

export const metadata = { title: "Mock exam · in progress" };

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
  await requireEntitledUser(locale);
  const sp = await searchParams;

  const pool = await getExamPool(EXAM_FORMAT_B.vehicleCode);
  const paper = assemblePaper(pool, EXAM_FORMAT_B);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <ExamRunner paper={paper} timerEnabled={sp.timer !== "0"} />
    </main>
  );
}
