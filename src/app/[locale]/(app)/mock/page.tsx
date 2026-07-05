import { requireEntitledUser } from "@/lib/exam-guard";
import { getExamHistory } from "@/lib/supabase/queries";
import { EXAM_FORMAT_B } from "@/lib/exam";
import { MockStart, type MockHistoryRow } from "@/components/exam/mock-start";

export const metadata = { title: "Mock exam" };

export default async function MockPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user } = await requireEntitledUser(locale);

  const history = await getExamHistory(user.id, 3);
  const rows: MockHistoryRow[] = history.map((h) => ({
    id: h.id,
    overall: h.overall ?? 0,
    passed: !!h.passed,
    startedAt: h.started_at,
  }));

  const totalQuestions = EXAM_FORMAT_B.sections.reduce(
    (n, s) => n + s.count,
    0,
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <MockStart
        totalQuestions={totalQuestions}
        sections={EXAM_FORMAT_B.sections}
        history={rows}
      />
    </main>
  );
}
