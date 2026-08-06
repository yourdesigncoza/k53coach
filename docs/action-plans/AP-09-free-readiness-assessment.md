# AP-09 — AI assessment on the free readiness test

**Priority P1 (product), the highest-leverage item on [AP-08](AP-08-end-user-improvements.md).**
Puts the differentiator in front of every visitor instead of only paying ones.

## Decisions (John, 2026-08-06)

| # | Decision |
|---|---|
| a | **Daily spend ceiling R20.** Enforced as a count, `READINESS_ASSESSMENT_DAILY_CAP`, sized from measured cost per assessment — see §3 |
| b | **Token-only.** No Vercel BotID on the free route for now; revisit only if the cap is actually hit |
| c | **Closing CTA unchanged.** The assessment keeps its own "Practice {weakest} →" button and the existing paywall card stays below it. Practice is free and honest; the paywall card already does the conversion work |
| d | **Short format.** 1–2 focus items, 2-step plan |
| e | **AP-03 is split.** Its *prompt-locale* half (locale-aware system prompt + server-side locale validation) moves **into this plan's shared core**, because both assessments need it and it lives in the shared prompt. AP-03 keeps the *cache-envelope* half, which is exam-only — the free path caches nothing server-side |

## Opportunity

The free readiness test is the highest-traffic surface in the product and the
conversion moment. Today it ends in a ring, a per-topic breakdown, a share button —
and a button labelled "See a sample AI assessment" pointing at
`/readiness/assessment-demo`, which is a **static mockup with no fetch calls**
(`src/components/readiness/assessment-demo.tsx`, 19.9K of hard-coded prose).

So the one thing that makes this not-another-quiz-app is *described* to every visitor
and *delivered* to none of them. It is delivered only at `/mock/result/[attemptId]`,
behind the R179 entitlement, where **no real learner has ever triggered it** (5
`exam_attempts` rows, all e2e fixtures).

Replacing the mockup with a real, shorter, grounded assessment demonstrates the
product instead of promising it — and does it at the exact moment the paywall is
being considered.

## What makes it non-trivial

Three constraints, all real, none blocking:

1. **The free test is anonymous and device-local by design** (constraint 3,
   under-18 learners). `saveReadinessResult` writes only to `localStorage`, and
   nothing about a minor goes to a server. So there is **no attempt row to cache
   against and no user to rate-limit**.
2. **It is the one place in the app where an LLM call sits behind an unauthenticated
   endpoint.** Every existing `llmChat` caller is either admin-only or
   entitlement-gated. There is no rate-limiting primitive in the repo — no Redis, no
   KV, no BotID; `package.json` has 14 dependencies and none of them do this.
3. **The grounded payload is thin.** The readiness pool is **15 questions (5 signs /
   5 rules / 5 controls)** and the sample is **5** (2 rules / 2 signs / 1 control, by
   `readinessQuota`). Maximum 5 misses, typically 1–3, and **zero** for a 5/5 learner.
   The paid assessment is grounded in up to 15 misses from a 64-question paper. The
   free one cannot be the same format at a smaller size — it has to be a different,
   shorter format that is honest about being a 5-question sample.

## Approach

### 1. Keep the misses on the device, generate lazily

The misses are lost today at a route boundary: `QuizRunner` has questions + answers,
scores with `scoreDiagnostic`, saves a `ReadinessResult` (which has no per-question
detail) and `router.push("/readiness/result")`. The result page reads back only the
score.

Extend the device-local payload rather than generating at submit time:

```ts
// src/lib/storage.ts — same key, versioned envelope
{ v: 2, result: ReadinessResult, sitting: { questionIds: string[], chosen: Record<string, number>, paperToken: string } }
```

- **Generate lazily**, when the learner taps the CTA — not on submit. Generating for
  every finisher pays for learners who never ask, and adds 6–7s to the "Finish" click.
- **Store no prose from the questions on the device beyond what is already rendered.**
  Ids and chosen indexes are enough; the server re-derives the rest (§2).
- `loadReadinessResult` must tolerate a v1 payload (a learner mid-flow when this
  deploys) and degrade to "no assessment available, retake the test".

### 2. The server re-derives the grounding — never trusts the client body

The request carries `{ paperToken, chosen: Record<questionId, index> }`. The route
loads the prompts, options, correct answers and **verified explanations from
`questions` itself** and builds the payload server-side.

This is not politeness about trust boundaries. Accepting an `explanation` string from
the client is a **grounding attack**: the whole safety property of this feature is
that the model only restates verified text, and a forged explanation field would let
anyone make the coach state any traffic law they like. Same rule the reporting feature
already follows — `keyed_index` is read server-side, never accepted from the client
(`CLAUDE.md`).

### 3. Abuse and cost: a signed paper token, no new infrastructure

`/readiness` already server-renders the sampled questions (`dynamic = "force-dynamic"`).
Issue an HMAC token alongside them:

```
paperToken = base64url({ ids: string[], iat: number }) + "." + HMAC-SHA256(secret, payload)
```

- Signed with a new `READINESS_TOKEN_SECRET` (or a derived value of an existing
  server secret). Verified with `timingSafeEqual`, as `payfast.ts` already does.
- **TTL ~30 minutes.** Expired → deterministic fallback, not an error.
- The route assesses **only ids present in the token**, so the payload cannot be
  widened, forged, or pointed at the full bank.
- Effect: an assessment costs an attacker a real page load of `/readiness` first, and
  each token buys one assessment.

Then two cheap backstops:

- **Single-use nonce.** A `readiness_assessment_grants` table of
  `(token_hash primary key, created_at)` — insert-on-use, so a replay hits the unique
  constraint and is refused. No PII: a hash of a token over question ids, nothing about
  a person. Rows expire with the TTL; a `delete where created_at < now() - interval`
  sweep keeps it small.
- **A global daily cap.** A count over that table for the day; beyond the cap the route
  returns the **deterministic fallback with HTTP 200**, not a 503. The feature degrades
  to useful, never broken — the same trade the paid fallback already makes, and it puts
  a hard ceiling on the spend.

**Sizing the cap (decision a — R20/day).** The cap is a *count*, so it needs a measured
cost per assessment, and we do not have one: `llmChat` discards the API's `usage` block.
So:

1. Add an optional usage return to `llmChat` (`{ text, usage }` via an opt-in flag, so
   no existing caller changes) and log prompt/completion tokens for this route.
2. Ship with a deliberately conservative interim default in
   `READINESS_ASSESSMENT_DAILY_CAP` and **recalibrate from the first real numbers** —
   the payload here is ~5 questions, an order of magnitude smaller than the paid path's
   15 misses, so the per-call cost should be small and the count large.
3. Record the measured figure in this file when it exists. Do not carry a guessed
   rand-per-call number in code comments as if it were measured.

**No bot layer (decision b).** The signed token already means an assessment costs an
attacker a real `/readiness` page load first. Vercel BotID is the right tool if this is
ever actually abused; adding it now puts a new dependency on the highest-traffic path
for a problem that has not happened.

### 4. A shorter format, and no server-side cache at all

Nothing is persisted server-side — no row, no `assessment` column, no locale-keyed
cache. **The two open bugs on the paid assessment ([AP-03](AP-03-bilingual-assessment.md)'s
single-column cache and [AP-04](AP-04-fallback-caching.md)'s permanently-cached
fallback) cannot exist here**, because there is nothing to cache into. The client
caches the returned JSON in `localStorage` keyed by locale so re-viewing is free and
makes no call.

The format, sized to 5 questions:

| Slot | Paid (64q) | Free (5q) |
|---|---|---|
| verdict | 1 sentence | 1 sentence, **explicitly framed as a 5-question sample** |
| strengths | 2–4 | 0–1, and only when a topic is actually clean |
| focus | 2–4 | **1–2**, drawn from real misses only |
| plan | 2–4 steps | **2 steps** |
| oneThing | ✅ | ✅ |
| ctaTopic | ✅ | ✅ |

Two cases the paid format never meets:

- **5/5, no misses.** There is nothing to ground a focus item in. The assessment must
  say the sample was clean, that five questions is not a verdict, and point at a
  fuller paper — it must **not** invent a weakness, and it must not certify readiness
  (the never-tell-a-learner-they-are-ready rule is already in `ASSESSMENT_SYSTEM` and
  carries over verbatim).
- **0/5.** Every topic is weak on a 1-or-2 question sample. Rank by the same
  weakest-first margin, take one, and say plainly that the sample is small.

### 5. Reuse, don't fork (`exam-assessment.ts` is 80% of this)

Split the shared machinery out rather than growing a second copy:

- `src/lib/assessment-core.ts` (new) — `Assessment` / `AssessmentPoint` /
  `AssessmentPlanStep` types, `TOPIC_SLUG`, `allowedHrefs()`, `parseAssessment()`, and
  the shared system-prompt preamble (tone, Grade-8 register, the hard grounding rule,
  the never-certify rule, the JSON scaffold).
- `src/lib/exam-assessment.ts` — keeps `buildAssessmentPayload` +
  `buildFallbackAssessment` for the 64-question case, re-exporting from core so
  existing importers do not churn.
- `src/lib/readiness-assessment.ts` (new) — the 5-question payload builder, its
  format-specific prompt tail, and its own fallback.
- `src/components/exam/exam-assessment.tsx` → generalise to a shared renderer taking
  the endpoint and request body as props. It is already a pure renderer over
  `Assessment`; only `generate()` is exam-specific. **Do not build a second set of
  cards** — that is exactly how the coach card drifted last time.

### 6. Locale — AP-03's prompt half lands here (decision e)

The free test is the surface where `/af` matters most, so this ships bilingual or it
does not ship. Moving into `assessment-core.ts`, verbatim from
[AP-03](AP-03-bilingual-assessment.md) §1–§2:

- The system prompt becomes a **function of locale** instead of hardcoding *"plain
  English at about a Grade 8 reading level"*. Every grounding rule stays exactly as-is —
  that is the part that must not regress.
- The payload's verified explanations stay **English** (our verified content; this is
  not the question-bank translation pass). The model translates **its own prose only**,
  and still may not state a rule absent from the supplied text.
- Section labels keep travelling as English keys; the UI renders its own translated
  headings, which it already does.
- Locale is **derived and validated server-side** against `routing.locales`, never taken
  as an arbitrary string — unbounded keys are unbounded spend.
- `PROMPT_VERSION` is exported beside the prompt so [AP-05](AP-05-prompt-hardening.md)'s
  changes can invalidate the exam-side cache.

Both assessment routes then use the same locale-aware prompt. AP-03 shrinks to its
cache-envelope half, which is exam-only.

### 7. The CTA that follows (decision c — unchanged)

The assessment keeps its own closing "Practice {weakest topic} →", and the existing
R179 paywall card stays where it is, below. Practice is genuinely free, so pointing at
it is the honest next action and it proves the product; the paywall card does the
conversion work without the assessment having to.

It renders **inline on `/readiness/result`**, expanding under the ring — no new route,
no redirect. The existing "See a sample AI assessment" button is replaced by the real
generation. `/readiness/assessment-demo` **stays** — it is linked twice from the landing
page and from `lesson-demo`, where a static marketing sample is the right thing.

## Files

| File | Change |
|---|---|
| `src/lib/assessment-core.ts` | **new** — shared types, validator, allow-list, prompt preamble |
| `src/lib/readiness-assessment.ts` | **new** — 5-question payload, prompt tail, fallback |
| `src/lib/readiness-token.ts` | **new** — HMAC sign/verify, TTL, `timingSafeEqual` |
| `src/lib/exam-assessment.ts` | slim to the exam-specific half, re-export core |
| `src/app/api/readiness/assess/route.ts` | **new** — token verify → nonce → DB re-derive → `llmChat` → validate → fallback |
| `src/app/[locale]/readiness/page.tsx` | issue the paper token with the sampled questions |
| `src/components/quiz/quiz-runner.tsx` | persist the sitting (ids + chosen + token) |
| `src/lib/storage.ts` | v2 envelope, v1-tolerant read |
| `src/app/[locale]/readiness/result/page.tsx` | real assessment inline, replacing the demo link |
| `src/components/exam/exam-assessment.tsx` | generalise to a shared renderer |
| `supabase/migrations/<ts>_readiness_assessment_grants.sql` | nonce table + expiry index |
| `messages/{en,af}.json` | free-assessment strings |
| `src/lib/readiness-assessment.test.ts`, `readiness-token.test.ts` | **new** unit tests |
| `scripts/e2e/readiness-assessment.mjs` | **new** driver over `lib.mjs` |

## Risks

- **Unbounded spend is the real one.** The token + nonce + daily cap are three
  independent limits; the cap is the only one that is *hard*. Set it deliberately with
  John rather than picking a number here.
- **Prompt injection through question content** is not a concern (all content is our
  own verified rows) — but it becomes one the moment anything learner-supplied enters
  the payload. It must not.
- **Thin grounding invites invention.** A 1-miss payload is the case most likely to
  produce padding. The validator cannot catch an invented rule; the prompt and the
  test runs have to. Budget a run of the driver across 0/5, 1/5, 3/5 and 5/5 before
  this goes near production.
- **POPIA.** Nothing about a minor is stored server-side: the nonce row is a hash of a
  token over question ids, and the request body carries no identifier. Keep it that
  way — do not add an IP column as a rate-limit shortcut without asking, since an IP is
  personal information.
- **A learner mid-flow when this deploys** has a v1 localStorage payload. Degrade, do
  not throw.
- **Latency.** 6–7s on the paid path with a 15-miss payload; a 5-question payload
  should be faster, but the loading state has to be real, and the CTA must not look
  broken while it waits.

## Verification

```bash
npm test                      # unit: payload builder, token sign/verify, fallback shapes
node scripts/e2e/readiness-assessment.mjs --profile 0of5 --locale en --headed
node scripts/e2e/readiness-assessment.mjs --profile 5of5 --locale af --headed
```

- Every focus item traces to a question the learner **actually missed** — the check
  that mattered in the 2026-08-05 runs, re-run per profile.
- **5/5 invents no weakness** and certifies nothing.
- **`/af` returns Afrikaans prose**, not Afrikaans chrome around English (finding 7).
- A **forged or expired token** yields the fallback at HTTP 200, never a 500, and never
  an assessment over ids not in the token.
- A **replayed token** is refused by the nonce constraint.
- **No key** → fallback in ~2s, nothing persisted anywhere.
- Re-viewing the result page makes **no** second API call.
- Nothing lands in any Supabase table that could identify a person.
- `npm run lint` / `npm run typecheck` clean.

## Done when

- [ ] A real, grounded assessment renders inline on `/readiness/result` in both locales
- [ ] The static demo remains for the marketing surfaces only
- [ ] Exam and readiness assessments share one core, one validator, one renderer
- [ ] Token + single-use nonce + daily cap all enforced, and the cap degrades to the
      fallback rather than an error
- [ ] Zero PII and zero learner answers stored server-side
- [ ] Driver passes across 0/5, 1/5, 3/5, 5/5 × en/af with no invented claim

## Build status — 2026-08-06: built, migrated and verified on both paths

Implemented, migrated to the live database, and exercised end to end.

| | |
|---|---|
| Unit | `npm test` **116/116** (was 92) |
| Build / lint / typecheck | clean |
| e2e, **template** path | 41/41 `/en` across 0of5 / 1of5 / 3of5 / 5of5, 12/12 `/af` |
| e2e, **model** path | 45/45 `/en` across all four profiles, 13/13 `/af` |
| Latency | 2.8–6.4 s fresh, 0 calls on re-view |
| Migration | `20260806140000` applied; remote history confirms it |
| RLS | anon read returns `[]`, anon insert 401, service-role only |
| Nonce accounting | one row per generation, exact; driver deletes its own |

`READINESS_TOKEN_SECRET` is set on Vercel **Production + Development**. Preview is
not set — the CLI (53.3.2) loops on `git_branch_required` — and does not need to be:
previews carry no Supabase keys, so `claimAssessment` returns `"unavailable"` and the
template serves there regardless.

### The cap is now derived, not guessed

Measured against the worst case (five questions, all missed — the largest payload
this format can produce): **1 440 prompt + 300 completion tokens**. At OpenAI's
published `gpt-5.4-mini` rates ($0.75/M in, $4.50/M out) that is **$0.0024 ≈ R0.05**
per assessment at a pessimistic R20/USD, so R20/day = **400**. That is the default in
`readiness-grants.ts`, overridable with `READINESS_ASSESSMENT_DAILY_CAP`.

### What the live runs caught that no unit test could

**One English sentence leaked into an Afrikaans assessment** — *"Voertuigbeheer: 0
uit 1 — Review the controls module"*. The shared prompt's grounding rule told the
model to say the literal English phrase `"review the {section} module"` when a gap
had no supplied explanation, and it copied it verbatim. Reworded to ask for the same
instruction in the model's own words in the output language; `PROMPT_VERSION` bumped
to 2, which invalidates the exam-side cache so the fix reaches assessments already
generated.

The driver's Afrikaans check had passed anyway, because it only asserted that *some*
Afrikaans was present. Two lessons, both now encoded: a language check must look for
an English **leak**, not for Afrikaans presence; and its first version matched the
fallback's own phrasing (`"Leer →"`), so it could only ever pass on the template and
failed every model-written assessment for being fluent.

### Read one before this is called done

The prose is grounded and in register across all four profiles — the 5/5 case says
outright that a few questions cannot prove readiness, and no assessment cited a
regulation number or told anyone to book. But **Louwrens has not read an Afrikaans
one**, and we cannot judge that ourselves. Same principle as the content pass.

Three items were folded in from neighbouring plans rather than left to collide with
this one: AP-03's prompt-locale half (both assessments now share one locale-aware
prompt), AP-04's stored-fallback-is-a-cache-miss line, and three of AP-05's prompt
rules that belong to the shared preamble (no meta-references to "the explanation",
no mood-filler strengths, no "best section" below half). AP-05's remaining items and
AP-03's cache envelope are untouched.

## Still open

- **The cap's real number.** Shipping conservative, recalibrated from the first measured
  `usage` figures against the R20/day ceiling. Record it here when measured.
- **Louwrens on one Afrikaans assessment**, same principle as the content pass — we
  cannot judge the Afrikaans ourselves.
