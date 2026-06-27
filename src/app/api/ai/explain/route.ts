import { NextResponse } from "next/server";
import { READINESS_QUESTIONS } from "@/content/readiness-questions";
import { getApprovedSignByCode } from "@/lib/supabase/queries";
import { signContent, localize } from "@/lib/signs";

/**
 * "Explain my mistake" — retrieval-grounded AI tutor (overview §13).
 *
 * ARCHITECTURE (do not change the order): verified content is the source of
 * truth. The flow is: look up the verified question/sign → build context →
 * (LLM rephrases ONLY that context into a friendly explanation, with guardrails
 * against unsupported claims) → log uncertain answers for human review.
 *
 * The scaffold returns the verified explanation directly and marks where the
 * LLM call slots in. Prefer the latest Claude model when wiring the LLM (see
 * CLAUDE.md); never let the model invent legal/safety claims.
 */
export async function POST(req: Request) {
  let body: { questionId?: string; chosenIndex?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { questionId, chosenIndex } = body;
  const question = READINESS_QUESTIONS.find((q) => q.id === questionId);
  if (!question) {
    return NextResponse.json({ error: "Unknown question" }, { status: 404 });
  }

  const correct = chosenIndex === question.answer;

  // Ground sign context ONLY on verified (approved + SA-relevant) DB content —
  // getApprovedSignByCode returns null for anything not cleared to ship, so the
  // tutor can never cite an unverified sign.
  const signRow = question.signCode
    ? await getApprovedSignByCode(question.signCode)
    : null;
  const sc = signRow ? signContent(signRow) : null;

  // Verified context the tutor is allowed to ground on.
  const grounding = {
    prompt: question.prompt,
    correctAnswer: question.options[question.answer],
    chosenAnswer:
      typeof chosenIndex === "number" ? question.options[chosenIndex] : null,
    verifiedExplanation: question.explanation,
    signContext:
      signRow && sc
        ? {
            name: signRow.name,
            behaviour: localize(sc.behaviour, "en"),
            commonMistake: localize(sc.commonMistake, "en"),
          }
        : null,
  };

  // TODO(llm): pass `grounding` to the Claude API with a system prompt that
  // forbids facts outside `grounding`; on low confidence, set needsReview=true
  // and persist to a review queue. For now we return the verified explanation.
  const explanation = correct
    ? `Correct — ${question.explanation}`
    : `Not quite. ${question.explanation}`;

  return NextResponse.json({
    correct,
    explanation,
    grounding,
    source: "verified-content",
    needsReview: false,
  });
}
