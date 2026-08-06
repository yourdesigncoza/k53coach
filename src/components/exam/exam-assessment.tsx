"use client";

import { useLocale } from "next-intl";
import { AssessmentPanel } from "@/components/assessment/assessment-panel";
import { readCachedAssessment } from "@/lib/exam-assessment";

/**
 * The paid post-mock assessment. Cards, loading state and error handling are the
 * shared `AssessmentPanel`; this only knows which endpoint to ask and what the
 * stored assessment on the attempt is worth.
 */
export function ExamAssessment({
  attemptId,
  initial,
}: {
  attemptId: string;
  initial: Record<string, unknown> | null;
}) {
  const locale = useLocale();

  // Read the stored column through the same envelope logic the route uses, so
  // the server-rendered view and the API can never disagree about whether this
  // learner already has an assessment in this language.
  const usable = readCachedAssessment(initial, locale);

  return (
    <AssessmentPanel
      initial={usable}
      endpoint="/api/exam/assess"
      body={() => ({ attemptId, locale })}
      retryOnFallback
    />
  );
}
