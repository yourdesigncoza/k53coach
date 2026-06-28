# LLM model selection — test notes & decision

**Decision (2026-06-28): `gpt-5.4-mini-2026-03-17` (OpenAI).**
Pinned to the dated snapshot for reproducibility. All app AI runs through a single
entry point so this is a one-line change: `LLM_MODEL` in `src/lib/llm.ts`.

This doc records *why*, and the evidence behind it, so the next person doesn't
re-run the experiment from scratch.

## Where the LLM is used

Everything goes through **`src/lib/llm.ts`** (`llmChat` + `hasLlmKey`, direct
fetch, no SDK). Two call sites today:

1. **`/api/admin/draft-sign`** — the admin "AI draft (English)" button. Drafts the
   5 learner-content fields (plainEnglish, formalMeaning, behaviour, commonMistake,
   testHint) from a sign's identity. Output is a **human-reviewed starting point**
   behind the `review_status` gate — never auto-served.
2. **`/api/ai/explain`** — the "Explain my mistake" tutor. The LLM only **rephrases
   the verified grounding** into a friendlier explanation and falls back to the
   verified text on any failure. It cannot introduce facts.

Both degrade gracefully without `OPENAI_API_KEY` (draft → empty fields, tutor →
verified text).

## Integration notes (GPT-5-era API differences)

Discovered while wiring `gpt-5.4-mini` — these bit us and are worth remembering:

- **Use `max_completion_tokens`, not `max_tokens`.** GPT-5-era models reject
  `max_tokens` with a 400 (`Unsupported parameter`). `gpt-4o-mini` accepts the new
  param too, so `llm.ts` uses `max_completion_tokens` for both.
- **Reasoning tokens count against that budget.** Default raised to 1500 for
  headroom. (In practice these drafting/rephrase tasks used **0 reasoning tokens** —
  no reasoning tax for this kind of work — but keep the headroom for safety.)
- **`temperature: 0.3` is accepted** by `gpt-5.4-mini` (some reasoning models force
  default temperature; this one doesn't).
- **Always verify a model id against the key before shipping it.** `GET /v1/models`
  with the key. `gpt-5.4-mini` is a 2026-03 model (past some tooling's knowledge
  cutoff), so don't assume — confirm it exists and the account can call it.

## Test 1 — content drafting (same prompt, three sources)

Sign **R1 (STOP)**, identical `draft-sign` prompt, varying only the model. Compared
against the curated pipeline content already serving.

| Field | Pipeline (curated) | gpt-4o-mini | gpt-5.4-mini |
|-------|--------------------|-------------|--------------|
| Plain English | complete stop at the **stop line**, move off when safe | "complete stop **at this sign**" (vague) | "Stop completely at the **line or before the intersection**, then move off only when safe" |
| Formal meaning | stop line / intersection / proceed when clear | "stop completely before proceeding" | "regulatory sign requires **all vehicles** to come to a complete stop" |
| Driver must do | stop, look all ways, yield to traffic & pedestrians | stop at line, look for vehicles/pedestrians | **handles the "no line" case** + "safe **and lawful**" — most complete |
| Common mistake | rolling stop **+ past the line** | rolling stop (single) | rolling stop **+ stopping too far into the intersection** |
| Test hint | "only **red octagon** = STOP every time" (best) | "check for road users after stopping" (not a mnemonic) | "a stop sign means a **full stop every time, not a slow down**" |

**Finding:** with the *same simple prompt*, `gpt-5.4-mini` closed almost the entire
gap to the curated content — it got the stop-line specificity 4o-mini missed, a
two-part common mistake, handled an edge case the curated copy didn't spell out,
and produced a real test-hint mnemonic. `gpt-4o-mini` was accurate but thin and
**misread the "test hint" field** (gave behaviour advice, not a recognition cue).
Cost: 135 completion tokens, 0 reasoning tokens, ~2s.

Note: 4o-mini's weakest field (test hint) was a **prompt** problem as much as a
model one — the prompt never defines what each field is. Tightening the prompt
(define each field, ask for SA specifics) would lift any model; it's the cheaper
lever before upgrading.

## Test 2 — ungrounded SA-specific generation (the risky case)

The failure mode to watch is **ungrounded generation of SA-specific facts**, where a
model US/UK-defaults or invents specifics. Asked `gpt-5.4-mini` to generate K53 quiz
questions (no grounding) on facts that are easy to get wrong:

| Question | Answer | SA-correct? | Self-reported confidence |
|----------|--------|-------------|--------------------------|
| Urban speed limit | 60 km/h | ✅ | high |
| Freeway limit | 120 km/h | ✅ | high |
| Blood-alcohol limit | 0.05 g/100ml | ✅ | **moderate — flagged blood-vs-breath unit confusion** |
| Side of road | Left | ✅ | high |
| Following distance | 3 seconds | ✅ defensible | **moderate — flagged wording varies + poor-conditions caveat** |

**Finding:** every SA fact correct; it offered US distractors (0.08 BAC, "right
side") and **rejected** them — no US-defaulting. More importantly it was
**well-calibrated**: it stamped the two genuinely-debatable items as "moderate
confidence" with specific human-verify flags, and the unambiguous ones "high." It
knows what it doesn't know — which is exactly what defuses the confident-and-wrong
failure mode.

## Verdict & recommendations

- **Default model: `gpt-5.4-mini-2026-03-17`.** Near-serve-quality drafts from a
  simple prompt, correct + well-calibrated on SA specifics, cheap/fast, no reasoning
  tax on these tasks. Clear win over `gpt-4o-mini`.
- **Keep the hard-accuracy architecture unchanged.** Verified grounding + human
  approval is still the gate for anything learner-facing. The upgrade makes drafts a
  *light edit* rather than a rewrite — it does not make review optional.
- **Do not auto-serve ungrounded-generated content.** Even with 5.4-mini, the model
  itself reports only "moderate confidence" on some legal/safety items, and the cost
  of one wrong fact to a learner is high. Ungrounded generation is now viable **as a
  human-reviewed draft** (e.g. seeding a question bank), not as an unreviewed source.
- **Prompt before model.** When a field is weak, fix the prompt first (define the
  field, demand SA specifics). Upgrade the model only if a tightened prompt still
  falls short.
- **When to step up further** (`gpt-5.4` / `pro`, per-call): bulk *unreviewed*
  generation, multi-step reasoning over rules, or any path where a human is not in
  the loop. Trivial to do — see below.

## Changing the model

One line in `src/lib/llm.ts`:

```ts
export const LLM_MODEL = "gpt-5.4-mini-2026-03-17";
```

For a per-call override (e.g. a stronger model for admin drafts, mini for the
tutor), extend `ChatOpts` with an optional `model` and pass it through — the single
entry point keeps this contained. Always pin a **dated snapshot** and verify it with
`GET /v1/models` before shipping.
