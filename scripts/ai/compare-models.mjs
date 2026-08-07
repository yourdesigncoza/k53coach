/**
 * Same prompt, same payload, three models — the Afrikaans A/B.
 *
 *   node --experimental-strip-types scripts/ai/compare-models.mjs
 *   node --experimental-strip-types scripts/ai/compare-models.mjs --locale en --profile 3of5
 *
 * ## Why this rather than the e2e driver
 *
 * `scripts/e2e/readiness-assessment.mjs` drives a browser, and the sitting it
 * produces differs run to run — the pool is sampled and option order is shuffled
 * per sitting. That is correct for a regression driver and useless for comparing
 * models: the 2026-08-07 "before/after" pair failed Rules in one run and Controls
 * in the other, so nothing but the terminology could honestly be compared.
 *
 * Here the payload is built ONCE, deterministically, and handed to every model
 * unchanged. The only variable is the model.
 *
 * It calls OpenRouter directly rather than through `src/lib/llm.ts` because
 * `llmChat` deliberately has no per-call model override — the single-entry-point
 * rule exists so nothing in the app can quietly pick its own model. This is an
 * experiment, not app code; it must not become the precedent for adding one.
 * Request shape is copied from `llmChat` field for field so the comparison is
 * against what the app actually sends.
 */
import { readFileSync } from "node:fs";
import { select } from "../data-repairs/supabase-rest.mjs";
import { stripCodeFence } from "../../src/lib/llm.ts";
import { toQuestion } from "../../src/lib/questions-map.ts";
import {
  buildReadinessPayload,
  readinessAssessmentSystem,
  readinessUserPayload,
} from "../../src/lib/readiness-assessment.ts";

const argOf = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};

const LOCALE = argOf("locale", "af");
/**
 * `llmChat`'s default. Raise it to tell a ceiling problem apart from a model
 * that cannot produce this output at all — a reasoning model spends budget
 * before it writes a word, so a truncated reply is not the same failure as a
 * malformed one.
 */
const MAX_TOKENS = Number(argOf("max-tokens", "1500"));
/** Substring filter on model id, for re-running one of them. */
const ONLY = argOf("only", null);
/** How many of the five the learner got right. 0 exercises the most prose. */
const CORRECT = Number(argOf("correct", "0"));

/**
 * Baseline, a cross-vendor step up, and the same-family step up. Prices are
 * per million tokens, read off OpenRouter's /models on 2026-08-07 — re-check
 * rather than trusting these.
 */
const MODELS = [
  { id: "openai/gpt-5.4-mini", note: "current", inM: 0.75, outM: 4.5 },
  { id: "anthropic/claude-sonnet-5", note: "cross-vendor", inM: 2.0, outM: 10.0 },
  { id: "openai/gpt-5.4", note: "same family", inM: 2.5, outM: 15.0 },
];

const USD_TO_ZAR = 20; // deliberately pessimistic, matches AP-09

// ── The one payload every model sees ─────────────────────────────────────────

const rows = await select(
  "questions?select=*&review_status=eq.approved&in_readiness=is.true&order=sort_order",
);
const pool = rows.map(toQuestion);

// Deterministic five: the exam's own section shape (2 rules / 2 signs / 1
// controls), first-by-sort_order within each topic. No RNG anywhere.
//
// `--ids` overrides it, for pinning the exact questions a defect came out of.
// The invented "volstruislyn" came from q-rules-3, which the default set does
// not contain — so a clean default run proves nothing about that term.
const IDS = argOf("ids", null);
const take = (topic, n) => pool.filter((q) => q.topic === topic).slice(0, n);
const questions = IDS
  ? IDS.split(",").map((id) => pool.find((q) => q.id === id.trim()))
  : [...take("rules", 2), ...take("signs", 2), ...take("controls", 1)];
if (questions.some((q) => !q)) {
  console.error(`--ids named a question that is not in the readiness pool`);
  process.exit(1);
}
if (questions.length !== 5) {
  console.error(`pool gave ${questions.length} questions, expected 5`);
  process.exit(1);
}

// Wrong answers are the first index that is not the keyed one, so "wrong" is a
// real distractor the learner could have picked, not a null.
const chosen = {};
questions.forEach((q, i) => {
  chosen[q.id] =
    i < CORRECT ? q.answer : q.options.findIndex((_, j) => j !== q.answer);
});

const payload = buildReadinessPayload(questions, chosen, "2026-08-07T09:00:00.000Z");
const system = readinessAssessmentSystem(LOCALE);
const user = readinessUserPayload(payload);

console.log(
  `locale ${LOCALE} · ${CORRECT}/5 correct · ${payload.misses.length} misses · ` +
    `${questions.map((q) => q.id).join(" ")}\n`,
);

// ── Call each model with an identical request ────────────────────────────────

const KEY = process.env.OPENROUTER_API_KEY ?? readKeyFromEnvLocal();

function readKeyFromEnvLocal() {
  const line = readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split("\n")
    .find((l) => l.startsWith("OPENROUTER_API_KEY="));
  if (!line) throw new Error("OPENROUTER_API_KEY missing from .env.local");
  return line.slice(line.indexOf("=") + 1).replace(/^"|"$/g, "").trim();
}

async function run(model) {
  const started = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${KEY}`,
      "content-type": "application/json",
      "HTTP-Referer": "https://k53coach.co.za",
      "X-Title": "K53 AI Coach",
    },
    // Field for field what llmChat sends for this call site.
    body: JSON.stringify({
      model: model.id,
      max_tokens: MAX_TOKENS,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  const ms = Date.now() - started;
  if (!res.ok) {
    return { error: `${res.status} ${(await res.text()).slice(0, 200)}`, ms };
  }
  const data = await res.json();
  // Through the same unwrap the app applies, so a model is judged on its answer
  // rather than on its packaging.
  const text = stripCodeFence(data?.choices?.[0]?.message?.content ?? "");
  const u = data.usage ?? {};
  const usd =
    ((u.prompt_tokens ?? 0) * model.inM + (u.completion_tokens ?? 0) * model.outM) /
    1e6;
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* reported below as unparseable */
  }
  return { parsed, text, ms, usage: u, usd, zar: usd * USD_TO_ZAR };
}

function render(a) {
  if (!a) return "  (unparseable JSON)";
  const line = (s) => `    ${s}`;
  const out = [line(`VERDICT   ${a.verdict}`)];
  for (const s of a.strengths ?? []) out.push(line(`STRENGTH  ${s.title} — ${s.note}`));
  for (const f of a.focus ?? []) out.push(line(`FOCUS     ${f.title} — ${f.note}`));
  for (const p of a.plan ?? [])
    out.push(line(`PLAN      ${p.step} (~${p.minutes} min → ${p.href})`));
  out.push(line(`ONE THING ${a.oneThing}`));
  return out.join("\n");
}

for (const model of MODELS.filter((m) => !ONLY || m.id.includes(ONLY))) {
  const r = await run(model);
  console.log(`── ${model.id}  (${model.note}) ${"─".repeat(30)}`);
  if (r.error) {
    console.log(`  FAILED after ${r.ms}ms — ${r.error}\n`);
    continue;
  }
  console.log(
    `  ${r.ms}ms · ${r.usage.prompt_tokens} in / ${r.usage.completion_tokens} out · ` +
      `R${r.zar.toFixed(3)} per assessment\n`,
  );
  console.log(render(r.parsed));
  // A model that could not produce the shape is the finding, so show what it did
  // send rather than only that parsing failed.
  if (!r.parsed) console.log(`    raw head: ${r.text.slice(0, 400)}`);
  console.log();
}
