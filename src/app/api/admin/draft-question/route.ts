import { NextResponse } from "next/server";
import { isAdmin, getApprovedSignByCode } from "@/lib/supabase/queries";
import { signContent, localize } from "@/lib/signs";
import { llmChat, hasLlmKey } from "@/lib/llm";

/**
 * Admin "AI draft" for a question — OFFLINE content drafting only (never shown to
 * learners, never auto-saved). Drafts {prompt, options, answer, explanation} for a
 * human to review and save. For sign questions it is grounded ONLY on the verified
 * road_signs content and must not invent legal/safety claims. Returns an empty
 * scaffold when no API key is set.
 */
const EMPTY = { prompt: "", options: ["", "", "", ""], answer: 0, explanation: "" };

export async function POST(req: Request) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });

  let body: { topic?: string; signCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const topic = body.topic === "rules" || body.topic === "controls" ? body.topic : "signs";

  if (!hasLlmKey()) {
    return NextResponse.json({ needsKey: true, draft: EMPTY });
  }

  // Ground sign questions on the verified sign (approved + SA-relevant only).
  let signContext = "";
  if (topic === "signs" && body.signCode) {
    const row = await getApprovedSignByCode(body.signCode);
    if (row) {
      const sc = signContent(row);
      signContext =
        `\nThe question is about this verified sign — ground ONLY on this:\n` +
        `name: ${row.name}\n` +
        `meaning: ${localize(sc.plainEnglish, "en")}\n` +
        `behaviour: ${localize(sc.behaviour, "en")}\n` +
        `common mistake: ${localize(sc.commonMistake, "en")}`;
    }
  }

  try {
    const out = await llmChat({
      system:
        "You write original multiple-choice questions for the South African K53 " +
        "learner's licence test. Return STRICT JSON: " +
        '{"prompt": string, "options": string[4], "answer": number, "explanation": string}. ' +
        "Exactly 4 plausible options; `answer` is the 0-based index of the correct one. " +
        "Keep it factual and simple; do NOT invent fines, penalties, or laws not implied " +
        "by the topic. Explanation: 1-2 sentences on why the answer is right.",
      user: `Topic: ${topic}.${signContext}`,
      maxTokens: 600,
      json: true,
      temperature: 0.5,
    });
    const json = JSON.parse(out || "{}");

    // Normalize defensively — never trust the model's shape.
    const options = (Array.isArray(json.options) ? json.options : [])
      .map((o: unknown) => String(o ?? "").trim())
      .filter(Boolean)
      .slice(0, 6);
    if (options.length < 2) {
      return NextResponse.json({ draft: EMPTY, note: "Model output unusable" });
    }
    let answer = Number.isInteger(json.answer) ? json.answer : 0;
    if (answer < 0 || answer >= options.length) answer = 0;

    return NextResponse.json({
      draft: {
        prompt: String(json.prompt ?? "").trim(),
        options,
        answer,
        explanation: String(json.explanation ?? "").trim(),
      },
    });
  } catch {
    return NextResponse.json({ draft: EMPTY, note: "Draft failed" });
  }
}
