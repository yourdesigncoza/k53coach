import { QuestionList } from "@/components/admin/question-list";
import { getAllQuestions } from "@/lib/questions";

export const metadata = { title: "Admin · Questions" };

export default async function AdminQuestionsPage() {
  const rows = await getAllQuestions();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">Question bank</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add, edit, approve, and delete questions. Only <strong>approved</strong>{" "}
        questions are served to learners; the free readiness test uses the ones
        flagged “readiness”. Changes go live without a redeploy.
      </p>
      <QuestionList rows={rows} />
    </div>
  );
}
