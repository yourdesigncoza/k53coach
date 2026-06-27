import { notFound } from "next/navigation";
import { PracticeRunner } from "@/components/quiz/practice-runner";
import { READINESS_QUESTIONS } from "@/content/readiness-questions";

export const metadata = { title: "Practice rules of the road" };

export default function RulesPracticePage() {
  const questions = READINESS_QUESTIONS.filter((q) => q.topic === "rules");
  if (questions.length === 0) notFound();
  return <PracticeRunner questions={questions} />;
}
