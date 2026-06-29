import { GlobalHeader } from "@/components/global-header";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { READINESS_QUESTIONS } from "@/content/readiness-questions";

export const metadata = { title: "Readiness test" };

export default function ReadinessTestPage() {
  return (
    <>
      <GlobalHeader />
      <QuizRunner questions={READINESS_QUESTIONS} />
    </>
  );
}
