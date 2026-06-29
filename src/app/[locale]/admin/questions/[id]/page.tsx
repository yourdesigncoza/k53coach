import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import { QuestionEditor } from "@/components/admin/question-editor";
import { getQuestionById, toQuestion } from "@/lib/questions";

export const metadata = { title: "Admin · Edit question" };

export default async function AdminQuestionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getQuestionById(id);
  if (!row) notFound();

  const q = toQuestion(row);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-6 md:px-8 md:py-8">
      <Link
        href="/admin/questions"
        className="-ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Question bank
      </Link>
      <h1 className="mt-2 text-xl font-semibold md:text-2xl">Edit question</h1>
      <QuestionEditor
        id={row.id}
        topic={q.topic}
        difficulty={q.difficulty}
        prompt={q.prompt}
        options={q.options}
        answer={q.answer}
        explanation={q.explanation}
        signCode={row.sign_code}
        inReadiness={row.in_readiness}
        reviewStatus={row.review_status as "draft" | "approved"}
      />
    </div>
  );
}
