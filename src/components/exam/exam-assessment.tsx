"use client";

import { useLocale } from "next-intl";
import { AssessmentPanel } from "@/components/assessment/assessment-panel";
import type { Assessment } from "@/lib/assessment-core";

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
  const stored = (initial as Assessment | null) ?? null;

  // A stored assessment written in another language is not this learner's
  // assessment. Show the generate button instead of Afrikaans prose under
  // English headings (or the reverse) — the route regenerates for this locale.
  // Same for a stored fallback: it is a template from an outage, not the thing
  // they paid for.
  const usable =
    stored && !stored.fallback && (stored.locale ?? "en") === locale
      ? stored
      : null;

  return (
    <AssessmentPanel
      initial={usable}
      endpoint="/api/exam/assess"
      body={() => ({ attemptId, locale })}
    />
  );
}
