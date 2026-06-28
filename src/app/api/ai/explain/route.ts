import { NextResponse } from "next/server";
import { READINESS_QUESTIONS } from "@/content/readiness-questions";
import { getApprovedSignByCode } from "@/lib/supabase/queries";
import { signContent, localize } from "@/lib/signs";
import { llmChat, hasLlmKey } from "@/lib/llm";

/**
 * "Explain my mistake" — retrieval-grounded AI tutor (overview §13).
 *
 * ARCHITECTURE (do not change the order): verified content is the source of
 * truth. The flow is: look up the verified question/sign → build context →
 * (LLM rephrases ONLY that context into a friendly explanation, with guardrails
 * against unsupported claims) → fall back to the verified explanation on any
 * failure. The LLM is OpenAI gpt-4o-mini via @/lib/llm; never let it invent
 * legal/safety claims. Without OPENAI_API_KEY it returns the verified text.
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

  // Verified explanation is the guaranteed answer; the LLM only rephrases it.
  const verified = correct
    ? `Correct — ${question.explanation}`
    : `Not quite. ${question.explanation}`;

  let explanation = verified;
  let source: "verified-content" | "llm-rephrased" = "verified-content";

  if (hasLlmKey()) {
    try {
      const system =
        "You are a friendly K53 (South African learner's licence) tutor. " +
        "Rephrase ONLY the verified facts in the JSON into a short, encouraging " +
        "explanation (2-3 sentences) for a learner who " +
        (correct ? "answered correctly" : "got it wrong") +
        ". Do NOT add any rule, fact, fine, penalty, or claim that is not in the " +
        "input. Do not contradict it. Output plain text only.";
      const out = await llmChat({
        system,
        user: JSON.stringify(grounding),
        maxTokens: 220,
        temperature: 0.4,
      });
      if (out.trim()) {
        explanation = out.trim();
        source = "llm-rephrased";
      }
    } catch {
      // Any LLM failure → keep the verified explanation (never block the learner).
    }
  }

  return NextResponse.json({
    correct,
    explanation,
    grounding,
    source,
    needsReview: false,
  });
}
