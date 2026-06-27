import { notFound } from "next/navigation";
import { PracticeRunner } from "@/components/quiz/practice-runner";
import { READINESS_QUESTIONS } from "@/content/readiness-questions";

export const metadata = { title: "Practice road signs" };

export default function RoadSignsPracticePage() {
  const questions = READINESS_QUESTIONS.filter((q) => q.topic === "signs");
  if (questions.length === 0) notFound();
  return <PracticeRunner questions={questions} />;
}
