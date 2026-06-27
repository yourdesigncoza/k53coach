import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/supabase/queries";
import { getSignByCode } from "@/lib/supabase/queries";

/**
 * Admin-only: draft learner content for one sign with Claude. Output is a
 * STARTING POINT for human review — the admin edits and approves before it
 * ships (review_status gate). Grounded in the sign's known identity; the prompt
 * forbids inventing legal/penalty specifics.
 *
 * Uses the Claude Messages API directly (no SDK dep). Set ANTHROPIC_API_KEY to
 * enable; without it, returns an empty scaffold so the admin flow still works.
 */
const MODEL = "claude-sonnet-4-6";

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

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
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
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Claude API ${res.status}` },
        { status: 502 },
      );
    }
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "{}";
    const json = JSON.parse(text.replace(/^```json\n?|```$/g, "").trim());
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
