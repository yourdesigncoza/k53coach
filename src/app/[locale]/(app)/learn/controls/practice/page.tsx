import { notFound } from "next/navigation";
import { PracticeRunner } from "@/components/quiz/practice-runner";
import { READINESS_QUESTIONS } from "@/content/readiness-questions";

export const metadata = { title: "Practice vehicle controls" };

export default function ControlsPracticePage() {
  const questions = READINESS_QUESTIONS.filter((q) => q.topic === "controls");
  if (questions.length === 0) notFound();
  return <PracticeRunner questions={questions} />;
}
