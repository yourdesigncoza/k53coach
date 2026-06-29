import { notFound } from "next/navigation";
import { PracticeRunner } from "@/components/quiz/practice-runner";
import { getPracticeQuestions } from "@/lib/questions";

export const metadata = { title: "Practice vehicle controls" };

export default async function ControlsPracticePage() {
  const questions = await getPracticeQuestions("controls");
  if (questions.length === 0) notFound();
  return <PracticeRunner questions={questions} />;
}
