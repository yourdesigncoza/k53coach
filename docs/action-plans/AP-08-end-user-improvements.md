# AP-08 — End-user improvements shortlist

**Priority P3. Needs John's decision before any of it is planned in detail.**
Everything below is product scope, not a defect — the four bugs are AP-01 to AP-04.

## Where the AI actually stands (the context for all of this)

Measured this session, not assumed:

- **One runtime AI surface exists**: the post-exam assessment at
  `/mock/result/[attemptId]`, via `POST /api/exam/assess`.
- **Everything else that looks like AI coaching is not.** Practice-mode "Coach Says"
  is `question.explanation` — hard-coded verified content
  (`src/components/quiz/question-card.tsx:81`). The dashboard's weak areas and
  next-lesson cards are deterministic (`src/lib/weak-area-cards.ts`). The free
  readiness result has no AI at all. `/readiness/assessment-demo` is a **static
  mockup** of the assessment with zero fetch calls.
- **The only AI is behind the paywall**, and `/mock` is the only entitlement-gated
  surface. Practice, explanations and the whole library are free — so R179 currently
  buys mock exams plus this one assessment.
- **`exam_attempts` = 6 rows** — 5 the e2e test buyer's, 1 a real sitting by Louwrens
  (89%, 2026-08-05; corrected 2026-08-06). No paying learner has ever
  triggered the feature.

The original intent was a chat/suggestion layer guiding study. What shipped is a
one-shot report after a mock. That gap is deliberate in part — the old
`/api/ai/explain` rephrase route was **removed** because per-question runtime AI
risked inventing legal claims, and explanations became fixed verified content. Any
conversational surface has to solve that same problem: grounded the way
`exam-assessment.ts` is, or it will confidently teach UK/US road rules as SA law
(the recurring failure mode in this project).

## Candidates

### (i) Regenerate control on the assessment
Falls out of [AP-04](AP-04-fallback-caching.md) — offer it only on fallbacks, rate
limited. **Recommend doing it as part of AP-04**, not separately.
*Cost: hours. Risk: low.*

### (ii) AI assessment on the free readiness test — highest leverage
Today the differentiator is invisible until after payment. The free test is the
highest-traffic surface and the conversion moment, and it currently ends in a score
plus a **static mockup** of what the AI would have said. A real, shorter grounded
assessment there would demonstrate the product instead of describing it.

Constraints that make it non-trivial:
- The free test is **anonymous and device-local** (`localStorage`, `src/lib/storage.ts`)
  by design for under-18 users (constraint 3), so there is no attempt row to cache
  against and no user to rate-limit. Needs an abuse story before it ships.
- It is a real per-visitor LLM cost on an unauthenticated endpoint — the one place in
  the app where that is true.
- Readiness questions are a small sample, so the grounded payload is thinner than a
  64-question paper's.

*Cost: days. Risk: medium (cost + abuse). Upside: the largest of anything here.*

### (iii) Per-section retry instead of "Retake the mock exam"
Both run 3 and the fallback ended with a step pointing at `/mock`. After ~45 minutes
of study that burns a whole 64-question sitting to re-check one weak section. A
section-only practice run, or a short section re-test, is the better next action —
and it interacts with repeat suppression (`assemblePaper` draws on the last 2
completed papers), so a cheap "retest signs only" needs thought about what it does to
the pool.
*Cost: days. Risk: medium (touches paper assembly).*

### (iv) Afrikaans content pass — size it with AP-03
[AP-03](AP-03-bilingual-assessment.md) makes the AI *summary* Afrikaans. It does not
touch questions, options or explanations, which are English throughout `/af`
(finding 8, confirmed by John on the run-4 answer review). So an Afrikaans learner
would still sit an English exam and read English explanations inside Afrikaans
chrome.

This is the deferred bilingual content pass in `docs/backlog.md`. The decision to
make is **not** whether to do it but whether `/af` should be marketed as a real
deliverable before it exists — constraint 8 says both languages ship as real
deliverables, and Stage 1 ships English-only *questions* with marketing that must not
imply otherwise. Worth checking the `/af` marketing copy against that, since AP-01
is already in that file.
*Cost: weeks (274 questions + 30 rules + 22 controls + 356 signs). Risk: needs a
native reviewer for all of it.*

## What I would pick

**(i) with AP-04**, then **(ii)** as the next real feature, because it is the only
item that changes the business rather than the product surface: it puts the
differentiator in front of every visitor instead of only paying users. (iii) is a
genuine learner-experience win but smaller. (iv) is unavoidable eventually and should
be *sized* now even if not built — its answer determines what `/af` may claim.

## Not recommended

- **A chat interface.** It is what the original plan described, but it is the hardest
  thing here to keep grounded, and the removal of `/api/ai/explain` was a deliberate
  decision in the other direction. If it is wanted, it needs its own plan with a
  grounding and refusal strategy, not a slot on this list.
- **Per-question AI rephrasing.** Explicitly reverted once already.

## Done when

- [ ] John picks which of (i)-(iv) proceed
- [ ] Each chosen item gets its own AP file with the usual sections
- [ ] (iv)'s answer is reflected in what `/af` marketing copy claims
