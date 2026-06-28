import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/supabase/queries";
import { getSignByCode } from "@/lib/supabase/queries";
import { llmChat, hasLlmKey } from "@/lib/llm";

/**
 * Admin-only: draft learner content for one sign with the app LLM (OpenAI
 * gpt-4o-mini, via @/lib/llm). Output is a STARTING POINT for human review —
 * the admin edits and approves before it ships (review_status gate). Grounded in
 * the sign's known identity; the prompt forbids inventing legal/penalty specifics.
 *
 * Set OPENAI_API_KEY to enable; without it, returns an empty scaffold so the
 * admin flow still works.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }
  const sign = await getSignByCode(code);
  if (!sign) {
    return NextResponse.json({ error: "Unknown sign" }, { status: 404 });
  }

  if (!hasLlmKey()) {
    return NextResponse.json({
      needsKey: true,
      draft: {
        plainEnglish: { en: "" },
        formalMeaning: { en: "" },
        behaviour: { en: "" },
        commonMistake: { en: "" },
        testHint: { en: "" },
      },
    });
  }

  const system =
    "You are a K53 (South African learner's licence) content writer. Draft " +
    "concise, accurate learner content for ONE road sign. Use plain South " +
    "African English. Do NOT invent specific fines, penalties, or legal " +
    "citations. Output ONLY a JSON object with string fields: plainEnglish, " +
    "formalMeaning, behaviour, commonMistake, testHint.";
  const user = `Sign code: ${sign.code}\nName: ${sign.name}\nCategory: ${sign.category}${
    sign.subcategory ? ` (${sign.subcategory})` : ""
  }\n\nDraft the five fields as JSON.`;

  try {
    const text = await llmChat({ system, user, maxTokens: 700, json: true });
    const json = JSON.parse(text || "{}");
    const wrap = (v: unknown) => ({ en: typeof v === "string" ? v : "" });
    return NextResponse.json({
      draft: {
        plainEnglish: wrap(json.plainEnglish),
        formalMeaning: wrap(json.formalMeaning),
        behaviour: wrap(json.behaviour),
        commonMistake: wrap(json.commonMistake),
        testHint: wrap(json.testHint),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Draft failed" },
      { status: 500 },
    );
  }
}
