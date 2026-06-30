# ToDo — path from beta to a product people pay for & share

Strategic priorities to move K53 Coach from "polished demo" to validated business.
Ordered by leverage. Ranked from a beta code-state audit (2026-06-30): the app
shell is complete-*looking*, but the revenue/learning loop is not closed yet.

Companion to `backlog.md` (durable deferred list). This file is the **prioritised
action plan**; backlog is the parking lot.

## State audit — the gap between "looks done" and "earns/learns"

| Business-critical thing | Reality in the code (2026-06-30) |
|---|---|
| **Mock exam** (the thing people pay to practice) | `(app)/mock/page.tsx` is a 9-line `<ComingSoon />` stub |
| **Question bank** (the moat — PRD wants ~750) | ~15 questions seeded in `20260629150621_questions.sql` |
| **Payments** (validate "parents pay") | `api/pay/payfast/route.ts` is a stub: logs + returns OK |
| **Analytics on our own KPIs** (free→paid, share rate) | none (no Plausible/PostHog/Vercel Analytics) |
| **Beta feedback capture** | none |

The funnel is *free readiness test → score → paywall → app shell*, but the paywall
gates a shell whose flagship feature says "coming soon," and can't take money — so a
beta user can't complete the loop we want to learn from.

---

## P1 — Close the loop we're trying to learn from  ⭐ START HERE
A beta exists to produce *signal*. We currently can't measure either stated KPI.
Small build, days of work, makes every later decision sharper.

- [ ] Add privacy-friendly analytics — Plausible or Vercel Web Analytics
      (POPIA-friendly, cookieless; aligns with CLAUDE.md §POPIA-first).
- [ ] Fire explicit funnel events:
      `readiness_started → score_shown → share_clicked → paywall_viewed → pay_clicked`.
- [ ] One-tap in-app feedback widget (beta users are gold; capture verbatim).
- [ ] Lightweight KPI view: free-test→paid-unlock conversion + parent-share rate.

## P2 — Ship the actual paid product: the mock exam
Every SA competitor leads with "practice tests." The readiness test is the teaser;
the timed mock exam is what justifies R149. Biggest single build gap.

- [ ] Timed mock exam, official SA format: signs/rules/controls split with
      per-section pass thresholds.
- [ ] Post-exam review with "explain my mistake" (reuse hard-coded verified
      explanations — no runtime LLM per CLAUDE.md §No runtime AI).
- [ ] Feed attempts into `attempts` / `readiness_results` (DB7/DB9) so the
      readiness score reflects real mock performance.

## P3 — Grow the question bank (the moat)
15 questions ≠ a product. Reuse the proven signs pipeline:
AI-draft → verify-vs-chart → human-exception only (`docs/sign-accuracy-pipeline.md`).

- [ ] Scale toward the PRD's ~750-question DB4 set, accuracy-gated.
- [ ] Author via admin Content Management (DB-backed bank already exists).
- [ ] Keep two gates honoured: content accuracy + bilingual review status.

## P4 — Make the parent-share genuinely viral
The parent-readable shareable score is the differentiator *and* the growth engine.

- [ ] WhatsApp-first share (SA's dominant channel), not generic share sheet.
- [ ] Dynamic OG image rendering the score for rich link previews.
- [ ] Trackable share link (ties into P1 `share_clicked` → attributed signups).

## P5 — Turn on one real payment rail
Until one cent moves, "parents will pay" is a hypothesis, not a finding.

- [ ] Implement PayFast properly (SA-local, parent-friendly): signature verify,
      source validation, amount check, **idempotent** 90-day access grant.
- [ ] Direct checkout only — never app-store IAP (PRD §Payments).
- [ ] Yoco as sibling rail after PayFast proven.

## P6 — Distribution / GTM (after the loop above is measurable)
- [ ] One driving-school pilot to test the schools channel (R99/learner/90 days).
- [ ] SEO/GEO landing for "K53 learners test online" and related intent.

---

**Recommended sequence:** P1 this week regardless (small, unblocks judgement) →
next real sprint on P2+P3 (the paid product + its ammunition) → P4/P5 as fast
follows → P6 once signal exists.
