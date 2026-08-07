/**
 * POST /api/coach/ask — one turn of the Ask Coach chat.
 *
 * The order of operations here IS the safety design, so it is worth stating:
 *
 *   auth → entitlement → redact → bound the input → retrieve
 *        → (extractive answer, free)  OR  (reserve → generate → validate)
 *        → persist with evidence
 *
 * Three things this route will not do:
 *  - call the model before a reservation is granted. The reservation is atomic
 *    (`coach_claim`), so concurrent tabs cannot each read the same count and each
 *    spend.
 *  - trust the client for anything but the question text and which conversation
 *    it belongs to. History is re-read from the database under RLS; accepting it
 *    from the body would let a caller put words in the coach's mouth and then
 *    have them cited back — the same reasoning as the readiness route's refusal
 *    to accept explanation text.
 *  - return a 5xx when the model misbehaves. A rejected answer is a deterministic
 *    card and an `invalid` row, the same degradation doctrine as /api/exam/assess.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveEntitlement } from "@/lib/entitlements";
import { hasLlmKey, llmChat, LLM_MODEL, type LlmMessage } from "@/lib/llm";
import { getCoachCorpus } from "@/lib/coach-corpus-server";
import { retrieve, topK, MAX_QUERY_CHARS } from "@/lib/coach-retrieval";
import {
  buildCoachSystem,
  buildCoachUser,
  definitionalAnswer,
  parseCoachReply,
  COACH_PROMPT_VERSION,
  MAX_HISTORY_CHARS,
} from "@/lib/coach-reply";
import {
  claimCoachTurn,
  releaseCoachTurn,
  HISTORY_TURNS,
  MAX_COMPLETION_TOKENS,
  type ClaimOutcome,
} from "@/lib/coach-limits";
import { redactPii } from "@/lib/coach-privacy";
import type { Passage } from "@/lib/coach-corpus";

const LOCALES = new Set(["en", "af"]);

/** Shown when we will not or cannot generate. Never a 5xx, never a blank. */
const CARDS: Record<string, Record<string, string>> = {
  en: {
    refused:
      "I can only help with the K53 learner's licence — road signs, road rules, vehicle controls and what the test expects. Ask me one of those and I'll dig into it.",
    not_covered:
      "I couldn't find that in the verified lessons, so I'd rather not guess. Try the Learn section, or ask me a different way.",
    invalid:
      "I couldn't give you an answer I'm confident is right, so I'm not going to guess. Try asking that a different way.",
    error: "Something went wrong on my side. Try again in a moment.",
    capped_day: "That's your questions for today. Come back tomorrow and we'll carry on.",
    capped_period: "You've used all the coach questions on this access period.",
    capped_global: "The coach is busy right now. Try again a little later.",
  },
  af: {
    refused:
      "Ek kan net help met die K53-leerlinglisensie — padtekens, padreëls, voertuigkontroles en wat die toets verwag. Vra my een van daardie dinge en ons kyk daarna.",
    not_covered:
      "Ek kon dit nie in die geverifieerde lesse kry nie, en ek wil eerder nie raai nie. Probeer die Leer-afdeling, of vra dit op 'n ander manier.",
    invalid:
      "Ek kon nie 'n antwoord gee waarvan ek seker is nie, so ek gaan nie raai nie. Probeer dit op 'n ander manier vra.",
    error: "Iets het my kant misgeloop. Probeer weer oor 'n oomblik.",
    capped_day: "Dit is jou vrae vir vandag. Kom môre terug, dan gaan ons voort.",
    capped_period: "Jy het al die afrigter-vrae vir hierdie toegangstydperk gebruik.",
    capped_global: "Die afrigter is nou baie besig. Probeer 'n bietjie later weer.",
  },
};

const card = (locale: string, key: string) => CARDS[locale]?.[key] ?? CARDS.en[key];

interface Evidence {
  passages: { id: string; code: string; hash: string; excerpt: string; href: string }[];
}

/** Snapshot what the answer rested on — see the migration's comment on `evidence`. */
function evidenceFor(passages: Passage[], codes: string[]): Evidence {
  const wanted = new Set(codes.map((c) => c.toUpperCase()));
  return {
    passages: passages
      .filter((p) => wanted.has(p.code.toUpperCase()))
      .map((p) => ({
        id: p.id,
        code: p.code,
        hash: p.hash,
        excerpt: p.body.slice(0, 400),
        href: p.href,
      })),
  };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const entitlement = await getActiveEntitlement(user.id);
  if (!entitlement) return NextResponse.json({ error: "payment required" }, { status: 402 });

  const body = (await req.json().catch(() => null)) as {
    question?: string;
    conversationId?: string;
    locale?: string;
  } | null;

  const locale = LOCALES.has(body?.locale ?? "") ? body!.locale! : "en";
  const rawQuestion = (body?.question ?? "").trim();
  if (!rawQuestion) return NextResponse.json({ error: "question required" }, { status: 400 });
  if (rawQuestion.length > MAX_QUERY_CHARS) {
    return NextResponse.json({ error: "question too long" }, { status: 400 });
  }

  // Redact BEFORE anything is stored or sent. The stored body is the redacted
  // one — the review queue needs the question, not the person (coach-privacy.ts).
  const { text: question } = redactPii(rawQuestion);

  // ── conversation ───────────────────────────────────────────────────────────
  let conversationId = body?.conversationId ?? null;
  if (conversationId) {
    const { data: owned } = await supabase
      .from("coach_conversations")
      .select("id")
      .eq("id", conversationId)
      .maybeSingle();
    if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });
  } else {
    const { data: created, error } = await supabase
      .from("coach_conversations")
      .insert({ user_id: user.id, locale, title: question.slice(0, 120) })
      .select("id")
      .single();
    if (error || !created) return NextResponse.json({ error: "not configured" }, { status: 503 });
    conversationId = created.id;
  }

  // History is re-read here, never accepted from the client.
  const { data: priorRows } = await supabase
    .from("coach_messages")
    .select("role,body,status")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_TURNS * 2);
  const prior = (priorRows ?? []).reverse();

  // RLS allows role='user' only, which is the point: a learner cannot author the
  // coach's side of their own conversation and have it cited back to them.
  await supabase.from("coach_messages").insert({
    conversation_id: conversationId,
    user_id: user.id,
    role: "user",
    body: question,
  });

  const finish = async (
    status: "refused" | "answered" | "not_covered" | "invalid" | "error",
    answer: string,
    extras: {
      evidence?: Evidence;
      sources?: string[];
      revision?: string;
      model?: string;
      tokensIn?: number;
      tokensOut?: number;
    } = {},
    httpStatus = 200,
  ) => {
    await supabase.rpc("coach_append_assistant", {
      p_conversation_id: conversationId!,
      p_body: answer,
      p_status: status,
      p_evidence: (extras.evidence ?? { passages: [] }) as never,
      // `supabase gen types` marks every function argument non-nullable even
      // where the SQL accepts NULL. NULL is the honest value for a turn where no
      // model ran, so it is coerced here rather than flattened to "".
      p_corpus_revision: (extras.revision ?? null) as unknown as string,
      p_model: (extras.model ?? null) as unknown as string,
      p_prompt_version: COACH_PROMPT_VERSION,
      // Zero is accurate, not a placeholder: a refused turn really did spend
      // nothing, which is what makes the "no provider call" claim checkable.
      p_tokens_in: extras.tokensIn ?? 0,
      p_tokens_out: extras.tokensOut ?? 0,
    });
    // Sources go back in the SAME shape `getMessages` reads out of `evidence`,
    // so a chip rendered live and a chip rendered after a reload are the same
    // component with the same link. Two shapes here is how they drift.
    const sources = (extras.evidence?.passages ?? []).map((p) => ({
      code: p.code,
      href: p.href,
    }));
    return NextResponse.json({ conversationId, status, answer, sources }, { status: httpStatus });
  };

  // ── retrieve ───────────────────────────────────────────────────────────────
  const loaded = await getCoachCorpus();
  if (!loaded) return finish("error", card(locale, "error"));

  const lastQuestion = [...prior].reverse().find((m) => m.role === "user")?.body ?? undefined;
  const result = retrieve(question, loaded.index, { priorQuestion: lastQuestion });

  if (result.decision !== "pass") {
    // No model call was made. This is the one branch that costs nothing, and the
    // only thing the retrieval floor is genuinely for.
    return finish("refused", card(locale, "refused"));
  }

  // ── extractive fast-path (free) ────────────────────────────────────────────
  const window = topK(result.scored, 8);
  const windowScores = window.map(
    (p) => result.scored.find((s) => s.passage.id === p.id)?.score ?? 0,
  );
  const extractive = definitionalAnswer(question, window, windowScores, locale);
  if (extractive) {
    return finish("answered", extractive.answer, {
      evidence: evidenceFor(window, extractive.sources),
      sources: extractive.sources,
      revision: loaded.corpus.revision,
      model: "extractive",
    });
  }

  if (!hasLlmKey()) return finish("not_covered", card(locale, "not_covered"));

  // ── reserve, then generate ─────────────────────────────────────────────────
  const claim = await claimCoachTurn(supabase, entitlement.id);
  if (claim.outcome !== "granted") {
    const key: Record<ClaimOutcome, string> = {
      granted: "error",
      capped_day: "capped_day",
      capped_period: "capped_period",
      capped_global: "capped_global",
      unauthenticated: "error",
      unavailable: "error",
    };
    return finish("error", card(locale, key[claim.outcome]), {}, claim.outcome.startsWith("capped") ? 429 : 200);
  }

  const history: LlmMessage[] = prior.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.body.slice(0, MAX_HISTORY_CHARS),
  }));

  let raw = "";
  let tokensIn = 0;
  let tokensOut = 0;
  try {
    raw = await llmChat({
      system: buildCoachSystem(locale),
      user: buildCoachUser(question, window),
      messages: history,
      json: true,
      maxTokens: MAX_COMPLETION_TOKENS,
      onUsage: (u) => {
        tokensIn = u.promptTokens;
        tokensOut = u.completionTokens;
      },
    });
  } catch {
    // Give the allowance back: a provider timeout must not cost a learner a
    // message they never got.
    await releaseCoachTurn(supabase, claim.reservationId!);
    return finish("error", card(locale, "error"));
  }

  const parsed = parseCoachReply(raw, { supplied: window, locale });
  if (!parsed.ok) {
    return finish("invalid", card(locale, "invalid"), {
      revision: loaded.corpus.revision,
      model: LLM_MODEL,
      tokensIn,
      tokensOut,
    });
  }

  const { reply } = parsed;
  if (reply.status === "not_covered") {
    // The model's job on this branch is the VERDICT, not the copy. Serving our
    // own card keeps it translated, honest and consistent — and avoids what was
    // observed live on 2026-08-07, where `answer` came back as the literal string
    // "not_covered" and would have been shown to a learner verbatim.
    return finish("not_covered", card(locale, "not_covered"), {
      revision: loaded.corpus.revision,
      model: LLM_MODEL,
      tokensIn,
      tokensOut,
    });
  }

  return finish("answered", reply.answer, {
    evidence: evidenceFor(window, reply.sources),
    sources: reply.sources,
    revision: loaded.corpus.revision,
    model: LLM_MODEL,
    tokensIn,
    tokensOut,
  });
}
