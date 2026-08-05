# Post-exam AI assessment — live test run, 2026-08-05

Five headed Playwright runs against the real `/api/exam/assess` route, driven by
`scripts/e2e/assessment.mjs`. Each run sits a **complete 64-question Code B paper**
as the entitled e2e buyer (`e2e-buyer@k53coach.dev`, the live PayFast entitlement
from the 2026-08-03 ITN run), submits, and generates the assessment for real.

**Why a real sitting and not a seeded attempt:** the assessment is grounded in the
learner's actual misses, so a hand-built `exam_attempts` row would never exercise
`buildAssessmentPayload` against real question text — which is exactly the part
that can go wrong.

**How the driver knows the correct answers:** the runner persists the assembled
paper to `localStorage` (`k53.exam.draft`) so a refresh cannot lose an hour's
sitting, and scoring is client-side — so the paper on the client necessarily
carries the answer index. The driver reads it, plans a target score per section,
and clicks. Option order is shuffled at assembly, so the draft's index matches
the on-screen A/B/C order.

## Runs

| # | Profile | Score | Sections | Model | ms | Fallback |
|---|---|---|---|---|---|---|
| 1 | weak | 36% ❌ | rules 12/30 ❌ · signs 9/28 ❌ · controls 2/6 ❌ | gpt-5.4-mini | — | no |
| 2 | strong | 94% ✅ | rules 28/30 ✅ · signs 26/28 ✅ · controls 6/6 ✅ | gpt-5.4-mini | 7137 | no |
| 3 | mixed | 70% ❌ | rules 25/30 ✅ · signs 14/28 ❌ · controls 6/6 ✅ | gpt-5.4-mini | 5951 | no |
| 4 | mixed on **/af** | 70% ❌ | same split | gpt-5.4-mini | 6536 | no |
| 5a | cached re-view of run 2 | 94% ✅ | — | (no call) | — | n/a |
| 5b | weak, **no API key** | 36% ❌ | rules 12/30 ❌ · signs 9/28 ❌ · controls 2/6 ❌ | `fallback` | 1761 | **yes** |

Attempts: 1 `6475e652`, 2 `3e9441f4`, 3 `91846049`, 4 `9a6ee95a`, 5b `90e7a803`.

Run 5b was driven against a dev server started with `OPENAI_API_KEY=` empty, then
the server was restored and a regeneration confirmed the real model was live again.

## What works

- **Grounding holds.** Every focus item in all three runs traces to a question the
  learner actually missed. Nothing invented, no foreign-signage failure mode
  (constraint 4 / the recurring UK-US-EU error) in any of the three.
- **Section logic is correct.** Run 3 is the hard case — 70% overall with one
  section failed — and it did not call it a pass, put every focus item in the
  failed section, and weighted the plan toward it (35 of 60 minutes).
- **`ctaTopic` picks the weakest section** in all three runs.
- **Plan hrefs stayed inside the allow-list** every time (`allowedHrefs()` holding).
- **Latency 6-7s** for a fresh generation; cached re-view is instant and makes no
  API call (the page server-renders the stored assessment) — verified in run 5a,
  where no request to `/api/exam/assess` was issued at all.
- **The fallback degrades well** (run 5b). No key → HTTP 200 in 1.8s, `model:
  "fallback"`, the `fallbackNote` ("Based on your section scores.") renders, the
  weakest section still leads, and nothing is invented. It is thin by design —
  one strength ("You showed up"), focus items that restate the section scores, and
  a generic Learn → Practice → Retake plan — but a learner is never shown a broken
  screen. This is the right trade.
- **Tone scales with the score** — encouraging at 36% without being dishonest,
  brisk at 94%.

## Findings to fix / improve

Ranked by how much they'd bother a real learner.

### 1. It leaks its own machinery into learner-facing prose (run 2)

> "Review the rules module for freeway vehicle restrictions and **the exceptions
> mentioned in the explanation**."

Appears twice in run 2 (focus item 4 and plan step 4). The learner never saw "the
explanation" — they saw a question. This is the model narrating its input, and it
breaks **constraint 10**: prose teaches, it does not reference our sources.
**Fix:** forbid meta-references to "the explanation" / "the source" / "the module
text" in `ASSESSMENT_SYSTEM`.

### 2. Plan steps target sections that passed

- Run 2 (94%): steps 3 and 4 are **the same task** — both "rules module, following
  distance + freeway".
- Run 3: step 3 sends the learner to the rules module for "mirror checks and blind
  spots" when **rules passed at 83%**.

**Fix:** either constrain the plan to the failed/weakest sections, or let the plan
be shorter than 4 steps. A 94% paper does not need four study steps; two honest
ones read as more credible.

### 3. "Your best section" can flatter a failing score (run 1)

> "Rules of the road is your best section — You got 12 out of 30 here"

True relative to the others, false as encouragement — 40% is not a section anyone
should feel settled about. **Fix:** suppress "best section" framing when the
section is below its pass mark; say "least weak" or drop the superlative.

### 4. Filler occupies a strength slot (run 1)

> "You are not starting from zero — Even with a low overall score, you have some
> correct answers across the test"

Says nothing actionable. **Fix:** require every strength to name a topic or a
score, not a mood.

### 5. Strengths read templated at high scores (run 2)

Three near-identical lines — "solid / mostly secure / strong" + the raw score —
at the top of an otherwise sharp assessment. **Fix:** vary or merge when all
sections pass.

### 6. Plan step 4 routes back to `/mock` (run 3)

After ~45 min of study it spends the last step on another mock. Defensible, but it
burns a mock attempt where a practice run would do. Product call, not a defect.

### 7. The AI assessment is entirely English on `/af` — the paid feature is not bilingual

Run 4 is the worst result of the five. The chrome translates correctly ("Nie
geslaag nie", "Per afdeling", "Waar die punte verlore gaan", "Jou plan") and then
**every word the model wrote is English**, inside it.

Root cause, and it is two separate problems:

1. **`ASSESSMENT_SYSTEM` hard-codes the output language** — *"Second person, warm,
   plain **English** at about a Grade 8 reading level"* (`exam-assessment.ts:144`).
   Neither `POST /api/exam/assess` nor `buildAssessmentPayload` carries the
   learner's locale, so the model is never told which language to answer in.
2. **`exam_attempts.assessment` is a single column.** Even with a localised
   prompt, one attempt can only cache one assessment — whichever locale generated
   it first would then be served to the other. Fixing the prompt alone is not
   enough; the cache needs to be keyed by locale.

This is the highest-value fix in this document. R179 buys mock exams and this
assessment (see CLAUDE.md), and for an Afrikaans learner the AI half of that
arrives in the wrong language.

### 8. Questions, answers and explanations are English throughout `/af`

Observed by John on the run-4 answer review: the review cards read
"Antwoordhersiening" / "Wys alles" / "Coach sê" in Afrikaans, wrapping fully
English question text, options and explanations.

This is the known deferred bilingual **content** pass (`docs/backlog.md`), not a
new defect — but runs 4 shows what it adds up to in practice: an Afrikaans learner
sitting a mock gets Afrikaans furniture around an entirely English exam **and** an
entirely English AI assessment. Worth sizing #7 and the content pass together
before Stage 1 markets `/af` as a real deliverable.

While reading those cards, one explanation also breaks constraint 10 in the
learner register: *"**Section 65** makes it an offence to drive under the influence
of alcohol OR any drug having a narcotic effect…"*. The section number belongs in
`source_citation`, not in front of a 17-year-old. Worth a sweep for other
explanations that open with a section or regulation number.

### 9. `ui_translations` DB overrides silently beat committed `messages/*.json`

Found while chasing why the run-4 CTA rendered **"Bekyk AI-assessering"** when
`messages/af.json:381` says **"Bekyk KI-assessering"** — a string that has never
existed in git history in the AI form.

`src/i18n/request.ts` merges admin-editable overrides from the **`ui_translations`**
table over the shipped JSON. There are **48 `af` override rows**, three of which
pin the old wording:

| key | override value |
|---|---|
| `assessment.cta` | `Bekyk AI-assessering` |
| `viewAssessment` | `Bekyk AI-assessering` |
| `seeAssessment` | `Sien 'n voorbeeld AI-assessering` |

So commit `e05dd48` *"fix(i18n): use one Afrikaans word for the mock exam"* edited
the JSON and **had no effect on what users see** — the stale DB row still wins.

This is a trap for any future i18n work: the file is not the source of truth at
runtime. Either clear overrides that now match/contradict the shipped copy, or
surface in the admin translation manager which keys are being overridden and how
they differ from the shipped string. Worth checking the other 45 `af` rows for the
same drift before trusting any i18n commit.

### 10. A fallback assessment is cached permanently — a brief outage costs the learner the real thing

Found by run 5b. `POST /api/exam/assess` writes the assessment back onto the
attempt **whether or not it is the fallback**, and the cache-hit branch at the top
of the route returns early forever after:

```
if (attempt.assessment) return NextResponse.json({ assessment: ..., cached: true });
```

So if the OpenAI key is missing, rate-limited, or the call throws for any transient
reason at the moment a learner taps "View AI Assessment", they get the template —
and are **stuck with it permanently**. There is no retry, no regeneration path in
the UI, and the real assessment they paid for never arrives even after the key is
back. Confirmed in this run: clearing `assessment` back to `null` by hand was the
only way to regenerate.

**Fix:** don't cache when `assessment.fallback === true` (cheapest), or cache it
but let the CTA re-request when the stored assessment is a fallback. Either way the
learner should not lose the paid feature to a 30-second blip.

## Driver notes (harness traps, all fixed)

- ESM ignores `NODE_PATH`; Playwright has to be resolved by explicit path the way
  `flow.mjs` does it.
- The result page has **two `<main>` elements** (app shell + page content) — a bare
  `locator("main")` is a strict-mode violation. Use `.last()`.
- Full-page screenshots run ~2.6 MB and are rejected by the file-upload path;
  crop + compress before sending.
- Match the CTA on the shared stem (`/assessment|assessering/i`), not on the
  `AI`/`KI` abbreviation — which is exactly the string finding 9 is about.

### ⚠ rtk filters shell output — verify greps through `rtk proxy` when a result decides something

The finding-9 discovery (`AI-assessering` live where `messages/af.json` says
`KI-assessering`) was blocked for several rounds by **wrong grep results**:
`grep -rl "AI-assessering" .next messages src` returned **0 matches** for a string
that `curl … | grep -o` found in the served HTML of the same running app. Re-running
as `rtk proxy grep …` gave the true answer, and the whole `ui_translations`
override problem fell out immediately after.

A second, independent trap in the same class: **`grep -c` counts matching lines,
not occurrences.** On minified or single-line HTML two distinct strings read as
`1`, so a "0 vs 1" verdict means nothing. Count with `grep -o … | wc -l`.

**Rule for any Playwright/e2e debugging where a grep is the evidence: `rtk proxy`
first, conclude second.** The symptom to watch for is two greps over the same
bytes disagreeing, or a string that is plainly visible in a screenshot yet
"absent" from the repo. Treat that as a tooling artifact until proven otherwise —
not as a fact about the code.

The same caution applies to `pgrep`/`pkill` in these runs: `pkill -f "assessment.mjs"`
matches **the Bash tool's own command line**, which contains the pattern, so it
kills the invoking shell. Anchor on the interpreter (`pkill -f "^node .*assessment\.mjs"`).
