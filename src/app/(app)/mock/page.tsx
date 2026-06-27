import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Mock Test" };

export default function MockPage() {
  return (
    <ComingSoon
      title="Mock exams"
      blurb="Full timed mock exams from the question bank land once the content library is populated. The free readiness test already gives you a score today."
    />
  );
}
