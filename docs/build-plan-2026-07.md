# K53 Coach — build plan to launch

**Date:** 2026-07-24 · **Version:** 2 (revised after adversarial review — see Appendix A)
**Status:** for review · **Author:** dev team

> **What changed in v2:** the single launch bar became a **two-stage gate** (paid beta → full
> bank); the pool arithmetic is now derived rather than asserted; verification is specified as a
> mechanism instead of a promise; the audit-trail migration moved to first task; POPIA and the
> claims audit moved *into* the launch bar. Rationale in Appendix A.

---

## 1. Why now

The Western Cape switched to computerised learner's licence testing in May 2025 and the pass rate
fell to **17%** — a 46-point drop from the previous 63% average
(`docs/western-cape-article.md`). The stated causes are the things this product exists to fix:

| What changed | What it means for us |
|---|---|
| Randomised multiple-choice pools replaced memorised booklets | Rote learning stopped working. Practice needs **volume and variety**. |
| Candidates struggle with **question wording** | Plain-language explanation *is* the product. |
| Instant results, standardised nationally | Readiness prediction becomes meaningful. |

Eight in ten candidates now fail, and the same shift is expected to roll out nationally. That is
the market, and it is unusually urgent.

**The problem:** we cannot serve it today. The question bank is too small to feel like real
practice, and **nobody can actually pay us**.

---

## 2. Ground truth — measured against the live database, 2026-07-24

| Asset | State |
|---|---|
| `road_signs` | **362 rows** — 361 approved + SA-relevant, 1 draft. 234 regulatory / 102 warning / 26 guidance. **Zero road markings.** |
| `questions` | **125 rows**, all `review_status='approved'` + `in_exam=true`. Signs 47 / rules 41 / controls 37. 110 three-option, 15 four-option. Provenance: 78 official_manual, 30 legislation, 15 hand-written, 2 generated. |
| Rule learning objects | **10** (`RR1`–`RR10`) |
| Exam format | 68 questions — rules 30 (pass 22) / signs 30 (pass 23) / controls 8 (pass 6), scored independently |
| `exam_attempts` | **0** — no learner has sat a mock in production |
| `entitlements` | **6 rows**, all granted by hand. **No unique constraint on `reference`.** |
| PayFast ITN | **Stub.** Returns 200, grants nothing |
| Client material | 245 question stems, 4-volume rules outline, road-markings list, Coach K artwork |

### The numbers that drive this plan

**Repetition.** The rules section draws 30 questions from a pool of 41 — a learner sees **73% of
every rules question we own in one paper**. Signs: 64%. We aren't simulating the exam; we're
teaching the answers to our 125 questions.

**Revenue.** The paywall renders, the gate works, the webhook grants nothing. Conversion is
currently impossible.

---

## 3. Constraints this plan honours

1. **Accuracy is a hard gate** — every shipped item verified against ground truth, with a
   recorded citation. See §4 W1 for the mechanism.
2. **Third-party guides are a checklist, never a source.** Louwrens's study guide is copyright and
   he doesn't own it. Topic labels only; prose from the National Road Traffic Act. The PDF never
   enters a generation prompt (`docs/rules-coverage-checklist.md`).
3. **No runtime AI in the learner flow.** Explanations are pre-verified stored content.
4. **English + Afrikaans.** No other locales. English first; Afrikaans a following pass.
   **Stage 1 ships English-only questions** — marketing must say so (§4 W6).
5. **Once-off pricing**, R149–R199 for 90 days.

> **POPIA:** raised by the reviewers as launch-gating and **overruled** — the concern was already
> settled (John, 2026-07-24) and K53-17 is closed. Note that `CLAUDE.md` constraint 1 still reads
> as though a review is outstanding; it should be updated to match the settled position.

---

## 4. Workstreams

### W1 — Question bank · **L** · *critical path*

#### The floor is derived, not guessed

A paper draws rules 30 / signs 30 / controls 8. Holding any section to **≤25% of its pool per
paper** gives the minimum pool directly:

| Section | Drawn | Pool for ≤25% | Stage 1 target | Stage 2 target |
|---|---|---|---|---|
| Rules | 30 | 120 | **120** (25%) | 240 (12.5%) |
| Signs | 30 | 120 | **140** (21%) | 480 (6%) |
| Controls | 8 | 32 | **40** (20%) | 80 (10%) |
| **Total** | 68 | 272 | **300** | **800** |

**300 is the paid-beta floor** — the smallest bank at which no section repeats more than a quarter
of itself per paper. It is not a round number chosen for comfort; it falls out of the exam format.

**Repeat suppression makes the floor work harder.** Track served question ids per learner and
deprioritise recently-seen ones when assembling a paper. At 300 questions this yields ~4
effectively non-overlapping papers per section instead of ~25% overlap on the second attempt.
Small change to `assemblePaper` in `src/lib/exam.ts`; disproportionate effect. **Do this in
Stage 1.**

Without suppression, expected paper-over-paper overlap is 25% at Stage 1 and 12.5% at Stage 2.
Stated honestly rather than hidden behind a target we can't hit.

#### Verification mechanism — what "the accuracy gate" actually means

The gate is not "we'll check them". It is four enforced properties, and **the schema migration
that records them is W1 task #1, before any generation or import**:

1. **Every item carries a citation** — the specific regulation, Act section, or chart entry it
   rests on. Stored, not implied. An item without one cannot be approved.
2. **Every item records who approved it and when** — `approved_by`, `verified_at`,
   `generated_by`. Today `questions` has *none* of these; "approved" is a bare boolean a seed
   migration set.
3. **Item-level review, not sampling.** Every generated question is checked against its cited
   source before approval. AI drafts; it does not self-certify. Verification must not be another
   pass of the same model against the same prompt — that is circular and worthless.
4. **The client spot-check is a *style* calibration, not QA.** ~20 items to Louwrens to confirm
   the distractors feel like the real test. It tells us nothing about legal correctness and is not
   counted as verification.

#### Steps

1. **Migration:** add `approved_by`, `verified_at`, `generated_by`, `source_citation`,
   `objective_code` to `questions`. First task, no exceptions.
2. Ingest the 245 client stems as drafts, tagged to section + learning objective.
3. Split out explainer-style stems ("Why is a clean windscreen important?") — they don't form
   3-option questions; they become Coach K teaching content.
4. Generate options + explanations in the house style, anchored on the 125 existing exemplars
   (whose explanations already name why each distractor is wrong) and grounded only in verified
   content.
5. Verify item-by-item against the cited source; record citation + approver.
6. Client style spot-check at ~20 items.
7. Build to **300** (Stage 1), then **800** (Stage 2).

**Stage 1 acceptance:** ≥300 approved questions at the per-section split above; every item has a
citation and an approver; repeat suppression live; no section exceeds 25% pool draw.

---

### W2 — Payments → entitlements · **S** · *critical path*

Verify the PayFast signature and validate against PayFast's servers; validate amount against the
order; grant `entitlements` (`source:'payfast'`, `expires_at: now()+90d`) via the service-role
client — the same row shape the admin grant UI writes.

**Idempotency needs a migration, not just care.** `entitlements` has **no unique constraint on
`reference`** — two concurrent ITN deliveries would both insert and double-grant. Add a unique
index on `(source, reference)` and upsert on conflict.

**Acceptance:** a sandbox payment grants 90-day access automatically; replayed *and concurrent*
ITNs don't double-grant; a forged ITN is rejected. **(K53-5)**

---

### W3 — Rules of the Road: 10 → ~30 objects · **M**

12 topics currently have exam questions but **no lesson behind them**. A learner who fails a
question on vehicle lights or towing has nowhere to be sent — which breaks the "the exact next
lesson, not study everything" promise the landing page makes.

Source: National Road Traffic Act 93 of 1996 + regulations, structured on Louwrens's four volumes.
Gap list in `docs/rules-coverage-checklist.md`: ~14 missing outright, 12 partial.

Give every rule a stable code so questions can point at it — closes the learning-objective request
and the orphaned-tag problem together. **(K53-31, part of K53-28)**

---

### W4 — Coach K · **S**

Cut the artwork out of its white badge, produce a transparent avatar-size version, add the landing
intro copy, put him on the coaching cards, style the magic-link email. Artwork already matches the
palette (brown ink + gold primary). **(K53-26, K53-29)**

---

### W5a — Road markings, written library · **M** · *in the launch bar*

Zero markings exist in the database. They **are examinable** — Louwrens's stems include 20 marking
questions — so this is a syllabus hole, not polish. All RTM/RM markings in the same
meaning / what-to-do / common-mistake structure as signs.

**W5b (post-launch):** illustrations, plus railway crossings, traffic signals, overhead lane
signals, traffic officer hand signals. Needs an illustration budget — markings are road-surface
diagrams with no public-domain source, so they must be drawn. **(K53-30)**

---

### W6 — Claims audit · **S** · *in the launch bar*

Every marketing claim checked against what the build actually does, before we charge anyone.
Known: the landing page promises **"works offline"** and no service worker exists. Also verify
claims about exam simulation, official-style questions, pass readiness, and bilingualism —
Stage 1 questions are English-only.

Charging money for a product positioned on *accuracy* while making claims we can't back is the
cheapest possible own goal.

---

## 5. Two-stage launch gate

The v1 plan had a single bar requiring the full bank *and* payments — the worst available
schedule, since it built payments early then sat on them through the entire content push.

### Stage 1 — Paid beta ("early access")

| Gate | Workstream |
|---|---|
| ≥300 verified questions, per-section split, repeat suppression live | W1 |
| Payments live, idempotent, sandbox-tested | W2 |
| No orphaned weak-area topics | W3 |
| Road markings written library | W5a |
| Every claim true | W6 |

Positioned honestly as **early access**, English-only questions, with the bank still growing.

### Stage 2 — Full launch

800 questions, Afrikaans content pass, marking illustrations, Code A/C papers.

```
W1 migration ─► generation ──────────────────────────────────►  (to 300, then 800)
W2 payments  ─────►                     (small; do early, gate the checkout until Stage 1)
W3 rules     ─────────►                 (slightly leads the rules half of W1)
W4 Coach K   ──►
W5a markings ────────►
W6 claims    ──►                        (do now — it's a copy fix, not a project)
```

Payments get built early because they're small, then held behind a closed checkout until the
Stage 1 content floor is real. That decouples "revenue is possible" from "revenue is deserved".

---

## 6. Explicitly out of scope

Deferred per the MVP guardrails (PRD-additions §5): full pass-prediction modelling, parent/school
dashboards, the practical driving coach (Phase 2), voice tutor, photo/video sign recognition, Code
A/C papers (K53-7), the PWA service worker (K53-14 — unless W6 resolves the offline claim by
building it), and the Afrikaans **content** pass (K53-10/11 — UI chrome is already bilingual).

---

## 7. Risks

| Risk | Severity | Handling |
|---|---|---|
| **Generated questions subtly wrong on law** | **High** | Item-level verification against a recorded citation; AI drafts but never self-certifies; client check is style-only |
| **No per-question audit trail** | **High** | Migration is W1 task #1, before any import — without it "approved" is a label, not a gate |
| **False marketing claims while positioned on accuracy** | **High** | W6 claims audit before charging |
| Payment double-grant / forged ITN | Medium | Unique constraint + upsert + signature verification in acceptance criteria |
| Questions feel unlike the real exam | Medium | Anchored on 125 real-style exemplars + client style check |
| Bank still small at Stage 1 | Medium | Repeat suppression; honest "early access" positioning |
| Marking illustration cost | Low | W5a/W5b split defers the spend |

---

## 8. Open decisions

**For Louwrens** (asked on Linear; none of it blocks W1–W3):
- Railway crossings, overhead lane signals, traffic officer hand signals, licence-code conversion —
  in or out for launch?
- ~20-question style spot-check when W1 reaches that point.

**For John:**
- Confirm the Stage 1 gate in §5 — particularly whether "early access" positioning is acceptable
  commercially.
- "Works offline": cut the copy, or build the service worker?
- Illustration budget for W5b, and when.

---

## Appendix A — adversarial review, 2026-07-24

Reviewed at depth `max` by **Grok** (x-ai/grok-4.20) and **Codex**. Gemini skipped — its MCP
backend migrated to Antigravity CLI and the `agy` binary isn't installed. Verdict on v1:
**DO-NOT-SHIP as written** — four HIGH findings, three structural.

### Accepted and fixed

| Finding | Sev | Fix in v2 |
|---|---|---|
| Launch bar incoherent — required full bank *and* payments while arguing payments should come first | HIGH | Two-stage gate (§5); checkout held closed until the content floor |
| "≤25% pool draw" acceptance was **arithmetically impossible** — plan's own math gave 90 rules questions against a 30-question section (33%) | HIGH | Floor **derived** from the exam format: 120/140/40 = 300 (§4 W1) |
| Audit-trail risk rated Medium; it's the control that makes AI generation defensible | HIGH | Promoted to High; migration is now W1 task #1 |
| Verification method never specified — reviewers both read the 20-question spot-check as the QA system | HIGH | Four enforced properties (§4 W1); spot-check explicitly demoted to style-only |
| `entitlements` has no unique constraint on `reference` — "idempotent" wasn't enforceable | MEDIUM | Unique index on `(source, reference)` added to W2 |
| Road markings treated as depth, not syllabus coverage | MEDIUM | W5a moved into the launch bar |
| "Works offline" treated as a copy tweak, not a trust issue | MEDIUM | W6 claims audit, covering all claims |
| 540+90+90 = 720, but target said "~800" and acceptance "≥750" | LOW | Reconciled: 240/480/80 = 800 |

### Overruled

| Claim | Ruling |
|---|---|
| "POPIA exposure starts at the first paying user — make it launch-gating" (Grok, HIGH) | **Overruled.** The concern was already settled (John, 2026-07-24); K53-17 is closed and the workstream removed. The reviewer reasoned correctly from `CLAUDE.md` constraint 1, which still describes a review as outstanding — **that file is stale on this point and should be corrected**, or the next reviewer (human or otherwise) will raise it again |
| "Afrikaans question content is a missing launch blocker" (Grok, MEDIUM) | **Demoted.** John's 2026-07-24 decision: EN+AF ship, Afrikaans content pass deliberately deferred, African-language speakers prefer English. Residual valid point — don't market as bilingual while questions are English-only — folded into W6 |
| "The 20-question spot-check is the QA system" (both) | **Partially overruled.** v1 did say "verify every question". But both reviewers misreading it the same way was evidence the doc was ambiguous, so the mechanism is now spelled out rather than asserted |
| "300–450 is enough for paid validation" (Codex; Grok said 250–300) | **Not taken on their authority** — but the independently derived floor landed at 300, which corroborates it. Judgment, not fact |
