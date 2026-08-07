# AI integration — where it stands and what to do about it

**Written 2026-08-06.** A read of every AI call site in the repo against the product
goal, plus a ranked TODO. Measured, not assumed — every claim below has a file and
line behind it.

Findings from the five live test runs are `docs/ai-assessment-test-run-2026-08-05.md`;
the scoped plans they produced are `docs/action-plans/`. This file is the layer above
those: what the AI *is*, and which improvements are worth the money.

## The goal every one of these has to serve

Get a South African learner through the K53 learner's licence test. The stated
differentiator is **an AI tutor over verified content** that explains *why* an answer
is wrong, tracks weak areas and produces a parent-readable readiness score —
explicitly not "another quiz app" (`CLAUDE.md`, `docs/product/`).

The hard limit on all of it: **AI never invents a legal or safety claim.** The
recurring failure mode in this project is UK/US/EU convention taught as SA law
(memory: foreign-signage-failure-mode), and it is the reason per-question runtime AI
was removed once already.

## Where the AI actually is

One entry point — `src/lib/llm.ts` (`llmChat` + `hasLlmKey`, **OpenRouter**
`openai/gpt-5.4-mini`, direct fetch, throws with no key so callers degrade).
Provider switched 2026-08-06; the model is the same one, reached through
OpenRouter's OpenAI-compatible endpoint, but the dated snapshot pin is gone.
Five call sites:

| Call site | Audience | Runtime? |
|---|---|---|
| `POST /api/exam/assess` → post-mock coaching report | **paying learners** | ✅ the only one |
| `POST /api/admin/draft-sign` | admin | offline drafting |
| `POST /api/admin/draft-question` | admin | offline drafting |
| `src/lib/translation-actions.ts` — Afrikaans AI draft | admin | offline |
| `src/lib/feedback-actions.ts` — triage summary for Linear | admin | offline |

**Everything a learner might read as AI coaching is not AI.** Practice-mode
"Coach Says" is `question.explanation`, hard-coded verified content
(`src/components/quiz/question-card.tsx`). Dashboard weak areas and next-lesson cards
are deterministic (`src/lib/weak-area-cards.ts`). The free readiness result has no AI
at all, and `/readiness/assessment-demo` — linked from the landing page twice and from
the result page — is a **static mockup with zero fetch calls**.

Consequences worth stating plainly:

1. **The differentiator is invisible until after someone pays R179.** `/mock` is the
   only entitlement-gated surface, so R179 buys mock papers plus this one report.
2. **Almost nobody has ever triggered it.** `exam_attempts` is 6 rows: 5 e2e fixtures
   and one real sitting by Louwrens (89%, 2026-08-05). No paying learner from the
   market has run it. Corrected 2026-08-06 — the "all fixtures" reading was already
   a day out of date when it was written.
3. The gap between "AI tutor layer" and "one report after a paid mock" is partly
   deliberate — `/api/ai/explain` was removed because per-question runtime AI risked
   inventing law. Any new AI surface has to solve grounding the way
   `exam-assessment.ts` does, or it will confidently teach the wrong country's rules.

## What the live runs proved about the one runtime surface

Holding up: grounding held in every run (nothing invented, no foreign-signage error),
section logic correct on the hard case (70% overall with one section failed), plan
hrefs stayed inside the allow-list, 6–7s fresh / instant cached, and the no-key
fallback degrades to something honest rather than a broken screen.

Not holding up, in learner-impact order:

1. The paid AI is **English-only on `/af`** — the prompt hardcodes English and
   `exam_attempts.assessment` is one column, so it cannot cache per locale.
2. A **fallback is cached permanently** — a transient blip costs a paying learner the
   feature forever, with no regenerate path.
3. Prose **leaks its own machinery** ("the exceptions mentioned in the explanation") —
   breaks constraint 10.
4. Plan steps target sections that already passed, and duplicate each other at 94%.
5. "Your best section" flatters 12/30.

## TODO — ranked

Cost/risk are mine; the ordering assumes John's call on scope. `[ ]` items are not
started.

- [x] **1. Free-readiness AI assessment** — **built and verified 2026-08-06, not yet
      deployed.** The differentiator now reaches every visitor rather than only buyers.
      Spend control is a signed single-use paper token plus a derived 400/day cap
      (R20/day at measured token counts); over the cap it degrades to a localised
      template rather than an error. **[AP-09](action-plans/AP-09-free-readiness-assessment.md)**.
- [x] **2. Fix the paid feature for Afrikaans buyers** — **done 2026-08-06.** Both
      assessments share one locale-aware prompt; the column now holds a per-locale
      envelope so an `/af` view no longer evicts the `/en` one
      ([AP-03](action-plans/AP-03-bilingual-assessment.md)); the deterministic fallback
      is translated; and a fallback is never written or counted, with "Try again" shown
      only when a retry could help ([AP-04](action-plans/AP-04-fallback-caching.md)).
      Verified on live data: a fallback frozen in production since 2026-08-05
      regenerated, and both locales now coexist on the same attempt.
- [x] **3. Prompt hardening** — **done 2026-08-06.** All six
      [AP-05](action-plans/AP-05-prompt-hardening.md) defects are gone, and the rules are
      now *enforced* in `parseAssessment` rather than only asked for in the prompt —
      which was the half that mattered, since a prompt rule the model ignores still ends
      up cached and shown to someone who paid. Repair before reject: 0 rejections across
      8 real generations, so the fallback rate did not move.
- [ ] **4. Per-section retry instead of "retake the mock"** — after ~45 min of study,
      burning a full 64-question sitting to re-check one section is the wrong next
      action. Touches `assemblePaper` repeat suppression, so it needs thought about the
      pool. *Days · medium risk.*
- [ ] **5. Afrikaans content pass** — questions, options and explanations are English
      throughout `/af`. Not "if" but "when", and its answer decides what `/af` may claim
      at Stage 1 (constraint 8). Size it even if it isn't built yet.
      *Weeks · needs Louwrens for all of it.*

### Not doing, and why

- ~~**A chat interface.**~~ **BUILT — Ask Coach, 2026-08-07.** It did get its own plan
  with an explicit refusal-and-grounding strategy: `docs/product/PRD-ask-coach.md`.
  The strategy that survived an adversarial review is *not* the obvious one — lexical
  retrieval turned out to be a cost filter rather than a scope gate (append one K53
  token to anything and it passes), so scope is enforced on the OUTPUT: sources
  required, prose must overlap the passages it cites, and every number carrying a unit
  must appear in one of them. See §4 of the PRD before changing any of it.
- **Per-question AI rephrasing.** Reverted once already, deliberately.

### Housekeeping

- [x] `src/lib/llm.ts` — the doc comment claimed "gpt-4o-mini" while `LLM_MODEL` was
      `gpt-5.4-mini-2026-03-17`. Fixed 2026-08-06 to point at the constant, so it cannot
      go stale again on the next model change.
