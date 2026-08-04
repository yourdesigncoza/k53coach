import { notFound } from "next/navigation";
import { PracticeRunner } from "@/components/quiz/practice-runner";
import { getShuffledPracticeQuestions } from "@/lib/questions";

export const metadata = { title: "Practice rules of the road" };

export default async function RulesPracticePage() {
  const questions = await getShuffledPracticeQuestions("rules");
  if (questions.length === 0) notFound();
  return <PracticeRunner questions={questions} />;
}
