# Design — weak-area → next lesson

**Status:** v2, revised after adversarial review (Grok + Codex) · **Date:** 2026-07-24

> **v1 verdict: DO-NOT-SHIP** — 3 HIGH findings. The important one: v1 ranked ties by
> `lastSeen asc` and described it as "older struggles surface first". That is a *next lesson*
> recommender that recommends what you have already moved past. Fixed in §2. Full review record
> in Appendix A.

## The problem

The landing page promises *"the exact next lesson, not 'study everything'"*. It is not
implemented. The dashboard's **"Continue learning"** section is three hardcoded cards — Road Signs,
Mock exam, All modules — identical for every learner regardless of what they got wrong.

The client asked for this explicitly (K53-31). Writing the missing lessons (`RR11`–`RR26`,
`VC12`–`VC22`) closed the content half; nothing routes a learner to them.
`questions.objective_code` is backfilled to 103/125 and referenced **nowhere** in `src/`.

## What exists

| Piece | State |
|---|---|
| `attempts` | `user_id, question_id (text), topic (CHECK in signs/rules/controls), chosen_index, correct, created_at`. Written by `practice-runner.tsx` (per answer) and `exam-runner.tsx` (bulk on submit). RLS own-row. |
| `questions.objective_code` | 103/125. Rules 41/41, controls 37/37, **signs 25/47**. |
| Lesson objects | Rules `RR1`–`RR26` (`getRule`), controls `VC1`–`VC22` (`getControl`), signs in `road_signs` (`getApprovedSignByCode`). |
| Routes | `/learn/rules/[code]`, `/learn/controls/[code]`, `/learn/road-signs/[code]`. |

`attempts.question_id` has no FK to `questions` (deliberate, per the 20260629150621 migration), so
PostgREST cannot embed the join. Note this blocks *embedding*, not SQL joins.

## 1. Data access — bounded fetch, pure-function ranking

```
getWeakObjectives(userId, { limit: 3 }) →
  1. attempts:  select question_id, correct, created_at
                where user_id = $1 and created_at > now() - 90 days
                order by created_at desc limit 500
  2. dedupe question_ids, then
     questions: select id, objective_code, topic where id in (…)
  3. join in JS, aggregate per objective
  4. rankWeakObjectives(rows)  ← pure, exported, unit-testable
```

**Bounded** — 90 days / 500 rows. v1's unbounded select was the review's real complaint.

**Why not a Postgres RPC** (both reviewers preferred one; Codex accepted bounding as the minimum):
the scoring heuristic is the part most likely to change — the review itself demanded two changes to
it before a line was written. A pure TS function is unit-testable with no database and works in
demo mode for free; SQL is the worst place to iterate a heuristic. Revisit on measured need, not
speculation.

**Stale mapping is intentional.** Attempts join to *today's* `objective_code`, so re-pointing a
question moves historical answers to the new lesson. For a recommender that is correct — if we
re-point a question to a better lesson, learners should be sent to the better lesson. Historical
fidelity ("what did this answer indicate at the time") matters for audit, not recommendation, and
the audit trail lives on `questions` (`approved_by`/`verified_at`), not here.

## 2. Ranking — smoothed, recency-windowed

v1 ranked by `1 - correct/attempted` with `attempted >= 2`, tie-broken by `lastSeen asc`. Two
defects: `0/2` outranked `7/20` despite far weaker evidence, and the tie-break surfaced *stale*
weaknesses first.

```ts
// Wilson score interval, lower bound — confidence-adjusted error rate.
score = wilsonLowerBound(wrong, attempted)

eligible = attempted >= 2 && wrong > 0
rank by score desc, then lastSeen DESC   // recent struggles first
```

**Laplace smoothing was tried first and rejected by its own test.** `(wrong+1)/(attempted+2)`
scores 1-of-2 at 0.500 and 7-of-20 at 0.364 — still the wrong order, because it shifts the
estimate without accounting for sample size. Wilson asks "how bad is this *at least*, given how
much we've seen", so evidence raises the floor: 1/2 → 0.09, 7/20 → 0.18. A learner is now sent to
the weakness we actually have evidence for. Total failure still outranks both (2/2 → 0.34), which
is right — getting every attempt wrong is a strong signal even on a small sample.

The 90-day window is what makes a fixed weakness drop off: keep answering an objective correctly
and old wrong answers age out of the window entirely. Cards display the raw count ("3 of 5 wrong")
because that is legible; ranking uses the smoothed score because it is stable.

## 3. Resolving a code to a card

| Code | Source | Route |
|---|---|---|
| `RR#` | `getRule()` (sync) | `/learn/rules/RR#` |
| `VC#` | `getControl()` (sync) | `/learn/controls/VC#` |
| anything else | `getApprovedSignByCode()` (async, DB) | `/learn/road-signs/<code>` |

A sign code may fail to resolve (unapproved, deleted). Drop that card and **backfill from the next
eligible objective** so the section keeps its card count rather than silently shrinking.

## 4. States — every branch defined

| Case | Behaviour |
|---|---|
| Demo mode (Supabase client `null`) | `getWeakObjectives` returns `[]`; section renders nothing; static cards unchanged |
| Query error | same as demo mode — return `[]`, never throw into the dashboard render |
| Signed in, no attempts | no weak-area row; static cards only |
| All answers correct | no weak-area row (`wrong > 0` is required for eligibility) |
| Weakness only on **unmapped** questions | **coverage-aware topic card** — "Road signs need work" → `/learn/road-signs`. Never present a mapped objective as "weakest" when the real weakness is invisible |
| Weakness **partly** unmapped | same coverage-aware card appended alongside the mapped ones |

The unmapped cases are live, not theoretical: **22 of 47 signs questions have no
`objective_code`** because road markings don't exist yet (K53-30).

**Coverage rule:** if unmapped wrong answers in a topic outnumber the mapped ones, the topic card
outranks the objective cards for that topic. Being honest that we can't pinpoint it beats a
confident wrong answer.

## 5. UI

Weak areas are an **additional "Recommended next" row above** Continue learning — they do **not**
replace the static cards. v1 replaced them, which would have deleted Mock exam and All modules from
the dashboard for any learner with history.

Reuse the existing `Card` + `Link` row markup already in `dashboard/page.tsx`. No new component.

## Out of scope

- DB9 `weakImprovement` (currently `null` in the blend) — K53-9.
- Any AI call. Ranking is arithmetic; the no-runtime-AI rule stands.
- `objective_code` for the 22 signs questions — blocked on K53-30.

---

## Appendix A — adversarial review, 2026-07-24

Grok (x-ai/grok-4.20) + Codex, depth `deep`. Verdict on v1: **DO-NOT-SHIP**, 3 HIGH.

### Accepted

| Finding | Sev | Fix in v2 |
|---|---|---|
| Unbounded attempts select on every dashboard render | HIGH | 90-day / 500-row bound, dedupe ids before `IN` (§1) |
| `lastSeen asc` surfaces stale weaknesses — contradicts "next lesson" | HIGH | `lastSeen desc` + 90-day window (§2) |
| `attempted >= 2` on raw error rate too noisy; `0/2` beats `7/20` | HIGH | Laplace smoothing (§2) |
| Empty states incomplete; *partial* invisibility unhandled | MEDIUM | Six defined states + coverage rule (§4) |
| Replacing static cards deletes core navigation | MEDIUM | Additional row instead (§5) |
| Demo-mode contract unstated | MEDIUM | Returns `[]`; ranking is a pure function (§1, §4) |
| Section can collapse below 3 cards | LOW | Backfill from next eligible (§3) |

### Overruled

| Claim | Ruling |
|---|---|
| "No index on `questions.id`" (Grok, supporting a HIGH) | **False** — `id text primary key` carries an implicit unique index. The finding survives on unboundedness alone |
| "`attempts.topic` is free-text with no guarantee it matches" (Grok, supporting a HIGH) | **False** — `check (topic in ('signs','rules','controls'))`. The substantive half (a topic card doesn't route to the new lessons) is kept as the coverage rule |
| "N+1 anti-pattern" (Grok) | **Mislabelled** — two queries regardless of row count |
| "Move ranking into a Postgres RPC before any frontend code" (Grok HIGH; Codex preferred) | **Partly overruled** — bounding removes the stated harm, and Codex accepted it as the minimum. Scoring stays in TS because the review itself changed it twice before implementation |
| "Fall back to hard-coded RR11–RR26/VC12–VC22 cards in deterministic order" (Grok) | **Rejected** — recommending lessons a learner has no measured weakness in is noise dressed as personalisation. Codex's coverage-aware state adopted instead |
