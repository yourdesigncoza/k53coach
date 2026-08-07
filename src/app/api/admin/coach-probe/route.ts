/**
 * POST /api/admin/coach-probe — put a question through the live gates and report
 * what each one did.
 *
 * Without this, tuning a threshold means reading logs and guessing. With it you
 * can see the retrieval score, the out-of-vocabulary ratio, the passages that
 * would be sent, the raw model reply, and — the useful part — WHICH validator
 * check rejected an answer.
 *
 * Admin-only and it does NOT spend a learner's allowance: it is a diagnostic on
 * the same code path, not a second entry point into the product. It does still
 * call the provider when asked to, so it is behind `isAdmin()` like the rest of
 * the drafting routes.
 */
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/supabase/queries";
import { hasLlmKey, llmChat, LLM_MODEL } from "@/lib/llm";
import { getCoachCorpus } from "@/lib/coach-corpus-server";
import { retrieve, topK, MAX_QUERY_CHARS } from "@/lib/coach-retrieval";
import {
  buildCoachSystem,
  buildCoachUser,
  definitionalAnswer,
  parseCoachReply,
} from "@/lib/coach-reply";
import { MAX_COMPLETION_TOKENS } from "@/lib/coach-limits";
import { redactPii } from "@/lib/coach-privacy";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    question?: string;
    locale?: string;
    generate?: boolean;
  } | null;

  const question = (body?.question ?? "").trim();
  const locale = body?.locale === "af" ? "af" : "en";
  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });
  if (question.length > MAX_QUERY_CHARS) {
    return NextResponse.json({ error: "question too long" }, { status: 400 });
  }

  const loaded = await getCoachCorpus();
  if (!loaded) return NextResponse.json({ error: "corpus unavailable" }, { status: 503 });

  const { text: redacted, removed } = redactPii(question);
  const result = retrieve(redacted, loaded.index);
  const window = topK(result.scored, 8);
  const scores = window.map((p) => result.scored.find((s) => s.passage.id === p.id)?.score ?? 0);

  const base = {
    corpusRevision: loaded.corpus.revision,
    passageCount: loaded.corpus.passages.length,
    redacted: removed,
    gate: {
      decision: result.decision,
      topScore: Number(result.topScore.toFixed(3)),
      oovRatio: Number(result.oovRatio.toFixed(3)),
    },
    passages: window.map((p, i) => ({
      code: p.code,
      kind: p.kind,
      title: p.title,
      score: Number(scores[i].toFixed(3)),
    })),
  };

  if (result.decision !== "pass") {
    return NextResponse.json({ ...base, outcome: "refused", note: "No model call would be made." });
  }

  const extractive = definitionalAnswer(redacted, window, scores, locale);
  if (extractive) {
    return NextResponse.json({
      ...base,
      outcome: "answered",
      via: "extractive",
      answer: extractive.answer,
      sources: extractive.sources,
      note: "Rendered from the verified lesson. No model call, no cost.",
    });
  }

  if (!body?.generate) {
    return NextResponse.json({ ...base, outcome: "would_generate" });
  }
  if (!hasLlmKey()) return NextResponse.json({ ...base, outcome: "no_key" });

  let raw = "";
  try {
    raw = await llmChat({
      system: buildCoachSystem(locale),
      user: buildCoachUser(redacted, window),
      json: true,
      maxTokens: MAX_COMPLETION_TOKENS,
    });
  } catch (error) {
    return NextResponse.json({ ...base, outcome: "provider_error", detail: String(error).slice(0, 300) });
  }

  const parsed = parseCoachReply(raw, { supplied: window, locale });
  return NextResponse.json({
    ...base,
    outcome: parsed.ok ? parsed.reply.status : "invalid",
    via: "model",
    model: LLM_MODEL,
    raw,
    ...(parsed.ok
      ? { answer: parsed.reply.answer, sources: parsed.reply.sources }
      : { rejectedBy: parsed.reason, detail: parsed.detail }),
  });
}
