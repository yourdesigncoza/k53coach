# AP-06 — Sweep learner prose for citations (constraint 10)

**Priority P2.** Content work, needs Louwrens to re-sign anything reworded.

## Problem

`CLAUDE.md` constraint 10 (John, 2026-08-03, hard rule): learner-facing prose
teaches, it is not a technical spec. **Citations belong in `source_citation`, not in
the explanation** — naming a regulation number at a 17-year-old teaches nothing. The
one sanctioned exception is where the provision's *text is the teaching point*
(`q-signs-5` cites Schedule 1 because the P/S letters inside the sign are literally
the answer).

Spotted during test run 4 while reading the `/af` answer review:

> **Coach sê** — "**Section 65** makes it an offence to drive under the influence of
> alcohol OR any drug having a narcotic effect — including some prescription
> medicines that impair driving. It is not limited to alcohol."

Correct, well written, and it opens with a statute number the learner has no use for.

## Evidence

Measured against the **274 approved questions**, 2026-08-05:

| Pattern in `explanation` | Count |
|---|---|
| `Section <n>` | 1 (`RR-036`) |
| `regulation <n>` / `reg <n>` | 25 |
| `Schedule <n>` | 0 |
| Act by name ("National Road Traffic Act", "Act 93") | 0 |
| SARTSM / RTSM | 0 |
| **Distinct questions affected** | **26** |

Samples:

- `RR-036` — "**Section 65** makes it an offence to drive under the influence…"
- `VC-001` — "…although **regulation 149** allows it to double as…"
- `VC-025` — "**Regulation 213(4)** requires an adult occupying a seat that is fitted
  with a seatbelt to wear it…"

**A second, related drift found in the same measurement.** House length is recorded
in `CLAUDE.md` as *median 187 characters, max 397* — but that was measured across the
71 signs explanations. Across all 274 approved questions it is now **median 200, max
671**. The long tail is worth looking at while the file is open; a 671-character
explanation is very likely explaining the law rather than the driving.

## Approach

1. **Triage, don't bulk-rewrite.** The 26 are not uniformly wrong. Three buckets:
   - **(a) Citation is decoration** — the sentence works better with the number
     removed and nothing else changed. Expect most of the 25 regulation hits here.
   - **(b) Citation is the teaching point** — keep, per the sanctioned exception.
     Judgement call, few if any.
   - **(c) The explanation is arguing the law rather than teaching the driving** —
     needs a genuine rewrite, not a deletion. `VC-025`'s "requires an adult occupying
     a seat that is fitted with a seatbelt" is the register to fix.
2. **Sign codes are a separate judgement.** Several explanations name sign codes in
   prose (`R1.4`, `R2.2`). A code is not a citation, but it is also not something a
   learner reads off a sign — "the mini-circle sign" teaches better than "sign R2.2".
   Decide once, apply consistently, record the decision.
3. **The number moves, it does not vanish.** Anything removed from prose must already
   be present in `source_citation` — check before deleting, since 7 questions are the
   recorded uncited exception and must stay `NULL` (`CLAUDE.md`).
4. **Record as a data repair**, not a migration:
   `scripts/data-repairs/prose-citation-sweep-<date>.json`, one op per question with
   a `why`, matching the existing repair files.
5. **Re-sign.** The 2026-08-05 CSV batch signed off the **current** text. Any question
   whose explanation changes needs Louwrens again — otherwise the audit trail claims
   human approval of prose no human read. Batch them into one export like last time.

## Files

- `scripts/data-repairs/audit-prose-citations.mjs` (new, read-only — emits the 26
  with their bucket and current `source_citation`)
- `scripts/data-repairs/prose-citation-sweep-<date>.json` (new, the record)
- Read-only reference: `CLAUDE.md` constraint 10,
  `docs/verification-worklist.md`, `docs/question-verify/`

## Risks

- **Rewriting introduces an error into verified content.** This is the highest-risk
  plan in the set for exactly that reason: the questions are signed off *as they
  stand*. Prefer minimal excisions (bucket a) over rewrites (bucket c), and treat
  every bucket-c change as new content needing verification against `resources/`,
  not just a style pass.
- **`shuffleOptions` throws on an out-of-range answer index** and
  `scripts/data-repairs/*` write straight through PostgREST, bypassing
  `saveQuestion`'s guard. This sweep touches `explanation` only — do not let it
  touch `options` or `answer`.
- Losing a citation entirely if `source_citation` was empty. Check first, per step 3.

## Verification

- Re-run the audit → 0 remaining bucket-(a) hits; bucket (b) documented as
  deliberate with a per-question reason
- Explanation length distribution re-measured; the >397-character tail explained or
  shortened
- Every changed question has a non-null `source_citation` (except the recorded 7)
- Every changed question carries a fresh `approved_by` + `verified_at` from the
  re-sign batch
- `npm test` (the bank feeds `exam.test.ts` / `readiness-sample.test.ts`)

## Done when

- [ ] 26 questions triaged into (a)/(b)/(c) with reasons
- [ ] Bucket (a) excised, bucket (c) rewritten to the house register
- [ ] Sign-code-in-prose decision made and applied consistently
- [ ] Repair file committed; `CLAUDE.md` length figures updated to the all-topic
      measurement (median 200 / max 671 → whatever it becomes)
- [ ] Louwrens has re-signed every changed row
