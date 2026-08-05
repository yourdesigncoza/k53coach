# AP-03 — Localise the AI assessment (prompt locale + versioned cache)

**Priority P1.** The paid feature is monolingual. `/af` learners pay R179 and the AI
half arrives in English.

## Problem

Run 4 of the test set (`/af`, attempt `9a6ee95a`) rendered Afrikaans chrome around a
wholly English assessment:

> **Coach sê** — "You are close on the rules and controls, and your signs score
> shows the gap clearly…"
> **Wat jy het** — "Vehicle controls are solid — You passed this section…"
> **Waar die punte verlore gaan** — "Road signs need the most work…"

Two independent causes:

1. **The prompt hard-codes the language.** `ASSESSMENT_SYSTEM`
   (`src/lib/exam-assessment.ts:144`): *"Second person, warm, plain **English** at
   about a Grade 8 reading level."* Neither `POST /api/exam/assess` (which takes only
   `{ attemptId }`) nor `buildAssessmentPayload` carries a locale, so the model is
   never told what language to answer in.
2. **The cache cannot hold two languages.** `exam_attempts.assessment` is a single
   `jsonb` column holding one flat assessment object, and the route returns early on
   any value being present:

   ```ts
   if (attempt.assessment) return NextResponse.json({ assessment: attempt.assessment, cached: true });
   ```

   So even with a localised prompt, whichever language generated first would be
   served to the other forever.

## Approach

### 1. Locale into the prompt

Take a locale in `ASSESSMENT_SYSTEM` (make it a function, or append a language
clause) and instruct output in that language. **Every grounding rule stays exactly
as-is** — this is the part that must not regress:

- The payload's verified explanations remain **English** (they are our verified
  content; we are not translating the question bank here).
- The model translates **its own prose only**, and still may not state any rule not
  present in the supplied explanations.
- Where a gap has no supplied explanation it still says "review the {section}
  module", in the target language.

Reuse `TOPIC_LABEL_EN` carefully — section labels shown to an `/af` learner should
come from the app's `topics` namespace, not be model-translated. Simplest: keep
sending English labels in the payload (they are keys, effectively) and let the UI
render its own translated headings, which it already does.

### 2. Locale derived server-side, never trusted from the client

The route must not take an arbitrary locale string as a cache key — that allows
unbounded keys and unnecessary model spend. Derive it from the request (the client
already knows its locale from the route) and **validate against
`routing.locales`** in `src/i18n/routing.ts`, falling back to `defaultLocale`.

Note the existing access control is already sound and needs no change:
`supabase.auth.getUser()` → 401, `getActiveEntitlement(user.id)` → 402, and the
attempt is fetched under RLS own-row with `.eq("id", attemptId)`. Adding locale does
not widen that surface.

### 3. Cache keyed on `(locale, prompt_version)` — not locale alone

**Decision taken: versioned JSON in the existing column**, no migration
(question (c-i)). Shape:

```jsonc
{
  "v": 2,                    // cache-envelope version
  "byLocale": {
    "en": { "promptVersion": 3, "assessment": { … } },
    "af": { "promptVersion": 3, "assessment": { … } }
  }
}
```

A cache **hit** requires: entry exists for the requested locale **and** its
`promptVersion` equals the current one **and** it is not a fallback
([AP-04](AP-04-fallback-caching.md)). Otherwise regenerate.

`prompt_version` is a constant exported beside `ASSESSMENT_SYSTEM`, bumped whenever
the prompt changes — which [AP-05](AP-05-prompt-hardening.md) will do. Without it,
AP-05's improvements would never reach any learner who already generated an
assessment.

Legacy shape is trivial: `exam_attempts` holds **5 rows, all the e2e buyer's, 0
learner data** (measured 2026-08-05). Either read flat objects as
`{en: {promptVersion: 0, …}}` or simply null those five rows. Prefer the dual read
if it's a few lines — it costs nothing and is honest about the shape having changed.

**Write safety:** a read-modify-write of the map can lose a locale if EN and AF
requests race. Do the merge in a single statement (`jsonb_set` / `||` on the server
side) or re-read inside the update; don't read into JS, mutate, and blind-write.

## Files

- `src/lib/exam-assessment.ts` — locale-aware system prompt, `PROMPT_VERSION`,
  cache-envelope helpers (`readCachedAssessment` / `writeCachedAssessment`)
- `src/app/api/exam/assess/route.ts` — accept + validate locale, cache-hit logic
- `src/components/exam/exam-assessment.tsx` — send the locale; read `initial`
  through the envelope
- `src/app/[locale]/(app)/mock/result/[attemptId]/page.tsx` — pass the locale's
  entry as `initial`
- `src/lib/exam-assessment.test.ts` (new) — envelope + cache-key tests
- `docs/ai-assessment.md` — document the locale + versioning contract

## Risks

- **Grounding regression.** Asking for Afrikaans while feeding English explanations
  invites the model to paraphrase a rule loosely in translation. The
  never-invent-a-rule instruction must stay verbatim and be checked in the run-4
  re-test, not assumed.
- **Afrikaans quality is unverifiable by us.** The output should go past Louwrens
  once before this is called done — same principle as the content pass.
- **Scope confusion.** This delivers an **Afrikaans AI summary only**. Questions,
  options and explanations stay English on `/af` (finding 8) — that is
  [AP-08](AP-08-end-user-improvements.md) (iv), a separate content pass. Do not
  describe AP-03 as "the assessment is now bilingual" without that caveat.

## Verification

```bash
node scripts/e2e/assessment.mjs --profile mixed --locale af --hold
node scripts/e2e/assessment.mjs --profile mixed --locale en --hold
```

- `/af` assessment prose comes back in Afrikaans; `/en` unchanged in English
- Same attempt, both locales → two cache entries, neither overwriting the other
- Re-open either → cached, no API call
- Bump `PROMPT_VERSION` → next open regenerates
- Spot-check that no Afrikaans output states a rule absent from the English
  explanations it was given

## Done when

- [ ] `/af` returns an Afrikaans assessment, `/en` unaffected
- [ ] Cache keyed `(locale, promptVersion)`; races cannot drop a locale
- [ ] Locale validated server-side against `routing.locales`
- [ ] Legacy flat rows read or cleared
- [ ] Louwrens has read one Afrikaans assessment
- [ ] `docs/ai-assessment.md` updated; `npm test` / lint / typecheck pass
