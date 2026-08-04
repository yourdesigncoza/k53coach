import { notFound } from "next/navigation";
import { PracticeRunner } from "@/components/quiz/practice-runner";
import { getShuffledPracticeQuestions } from "@/lib/questions";

export const metadata = { title: "Practice road signs" };

export default async function RoadSignsPracticePage() {
  const questions = await getShuffledPracticeQuestions("signs");
  if (questions.length === 0) notFound();
  return <PracticeRunner questions={questions} />;
}
