# Live learner's-test format analysis

Derived from four circulated "memo" PDFs (300 pages) supplied 2026-07-28, held locally at
`resources/restricted/` (gitignored).

**This directory contains format and coverage metadata only** — no question text, no answer
options, and no record of which option was marked correct. The sources are used the way a
competitor's table of contents is used: to learn the *shape* of the exam and find gaps in
our own coverage. Provenance and the reasoning are at the foot of this file.

## Files

| file | contents |
|---|---|
| `index.jsonl` | one row per page — 178 rows |
| `items.md` | 80 distinct topic labels / ~84 distinct items, the writable work-list |
| `items.json` | same, machine-readable |
| `question-patterns.md` | 11 item construction patterns: stem frames, option structure, distractor logic |

## What the four PDFs actually are

They are **not** four papers.

| set | pages | class |
|---|---|---|
| A + D | 170 | photographs of a live DLTC terminal — four sittings (A1–A4) off one item bank |
| B + C | 130 | one third-party "K53 Learners Test Memo (Computer Edition)" app, GUARANTEED PASS branding |

`B-01` and `C-01` are byte-identical covers. D is a Microsoft Lens re-scan of the same
sittings as A, but not redundant — it captures A1 questions A's photo set missed. Together
A+D reconstruct sitting A1 to **51 of 64 questions**.

`D-089`, `D-100` and others carry a Facebook overlay ("[sharer name redacted], YESTERDAY AT 18:24"), so
these propagate by chain-share. Provenance is untraceable and versions drift — which matters
for finding 7 below.

---

## 1. The paper is 64 questions, not 68

Every legible page reads `Question N of 64`. Our engine builds 68 (`EXAM_FORMAT_B`,
`src/lib/exam.ts:44` — 30 rules / 30 signs / 8 controls). That file's own header comment
anticipates this: *"a 64-format variant is a one-line change"*.

The counter is **one continuous 1–64 sequence**. There is no per-section numbering anywhere,
and topics interleave throughout (Q6 rules, Q9 signs, Q17 rules, Q20 signs, Q24 markings…).
Our three-section paper is our own presentation choice, not a mirror of the terminal.

## 2. Three options, not four

Every one of the 165 terminal pages has exactly **A / B / C**. Our bank is 4-option. This
shapes every question written from here on.

(The third-party app in B/C mixes 3 and 4 arbitrarily — it is not a guide to the real format.)

## 3. Option order AND item position shuffle per sitting

`A-17`/`A-25` are the same following-distance item: correct at **A** in sitting A1, at **C**
in A2. `D-028`/`D-022` is the same heavy-vehicle-speed item at **position 40** in A1 and
**position 60** in A2, correct moving B→A.

So papers are assembled per sitting from a pool, with options shuffled — exactly what
`buildPaper` and `shuffleOptions` already do. Good validation of existing design.

A1's Q49 is the clutch item; A2's Q49 is the accelerator item. Position carries no identity.

## 4. Topic mix — we over-weight signs and carry no markings

Measured on the 84 deduplicated items (not page counts, which are inflated by duplicate
photographs):

| topic | observed | `EXAM_FORMAT_B` | |
|---|---|---|---|
| rules | 47% | 44% | ok |
| signs | **32%** | **44%** | over by ~12pp |
| controls | 11% | 12% | ok |
| markings | **9%** | **0%** | absent |

Rules and controls are already right. The gaps are the sign over-weighting and markings.

Also: **~54% of items carry no artwork at all**, so a sign-heavy content strategy
over-invests in the visual half of the exam.

## 5. Road markings ARE examined — 8 topics identified

We hold **zero** road markings in `road_signs` (362 rows, all signs). The written markings
library is already a Stage 1 gate in **K53-32**; this is direct evidence it is examined.

Observed marking topics: yield · railway-yield · railway level crossing · bus lane ·
pedestrian crossing · no-parking · reversible lane · lane reduction from right.

The third-party app also covers markings, using SARTSM codes (`RT2`). We are behind a sloppy
competitor here.

## 6. Question archetypes — three we cannot currently produce

Full spec with distractor logic in `question-patterns.md`. The gaps:

- **`combination-select` (P6)** — stem lists (i)/(ii)/(iii), then `SELECT THE CORRECT
  COMBINATION`; options come from a fixed structural vocabulary ("All the above are
  correct" / "Only (i) and (iii) are correct"). Tests three facts per item and is far harder
  to guess than 1-of-3 prose. **Highest-value archetype to add.**
- **`control-number` (P7)** — a numbered dashboard/steering-column diagram. One asset
  supports four question directions: number→name, function→number, function→number-pair,
  and number→consequence (which composes with P6 for the hardest observed item). The
  third-party app uses the *same* diagram, so it is the standard official artwork — we need
  our own equivalent commissioned.
- **`marking-meaning` (P4)** and **`marking-to-sign-link` (P5)** — the latter is cross-topic
  ("Before this road marking one would usually find the following sign…"), which a
  single-topic bank cannot produce.

A useful production pattern observed in P8 (`which-statement-correct`): distractors are the
correct rule with a **scope error** — the true rule narrowed to "in an urban area" / "during
the day only" / "outside a built-up area" where the real regulation is unqualified. Two
different items (`D-024` Q46, `D-027` Q54) are built from the same noise regulation this way.

That is a defensible, scalable route to the Stage 1 floor: take a cited regulation, write the
unqualified statement, generate two scope-error distractors. Every item traces to its
regulation, satisfying the accuracy gate (constraint 9) by construction.

## 7. The circulating memos contain contradictory answer keys — verified

The same item appears twice with the **same stem, same three options, opposite keys**:

| page | sitting | position | marked correct |
|---|---|---|---|
| `D-009` / `D-062` | A1 | Q61 @ 16:57 | "shall be fitted … to the **sides and the rear**" |
| `D-080` / `A-33` | A3 | Q1 @ 39:16 | "**are not required** to fit yellow reflective material" |

Stem in both: *"Trailers of which the gross vehicle mass does not exceed 10000 kg …"*.
Verified by re-rendering both at 220 dpi.

This is an isolated anomaly, which is what makes it credible: **every other** cross-sitting
item checked has consistent keys (following distance, parked lights, legal stopping,
heavy-vehicle speed, high-speed exit, toll route, spot lamps). So one of these two keys is
simply wrong, and both circulate under a "GUARANTEED PASS" cover.

A second suspect key at `D-054` (Q14, which side of the roadway) is flagged in the index but
the stem was partially cut — unverified.

Two consequences:

1. **The memos are unreliable even for someone willing to use them.** A learner drilling this
   set memorises a wrong answer on that item roughly half the time, with no way to tell which
   key is right. Only the regulation settles it.
2. **It is a marketing asset.** "Every answer cites the regulation it rests on, with a named
   approver and a date" is a concrete differentiator against chain-shared screenshots, and
   this is the evidence for the claim.

**Open action:** resolve the trailer question against the NRTA regulations on retro-reflective
markings — not by picking whichever memo looks more confident.

## 8. The timer is a sitting fingerprint, not a paper duration

Sitting A1's readings form a near-perfect line — Q5→19:30, Q6→19:28, Q9→19:19, Q17→18:59,
Q26→18:31, Q33→18:10, Q48→17:32, Q63→16:52 — a constant **~2.74 s/question**. Far too fast
to be answering: it is someone clicking **Review Questions** after finishing and
photographing each screen.

So the timer says nothing about how long the paper allows. What it gives us is a fingerprint
that reconstructs shot order and separates sittings:

| sitting | timer range | framing |
|---|---|---|
| A1 | 16:49–19:30 | tight/angled, one continuous review pass |
| A2 | 19:55–26:09 | full-screen, different device |
| A3 | 39:16 | single page |
| A4 | 49:55–49:59 | two pages |

## 9. The third-party app (B/C) is a low-quality competitor

Characterised from a sample. Worth knowing because it is what learners are actually buying:

- **Malformed option sets** — one item offers "Only if it is an emergency / True / False /
  None of the above"; another offers "False / True / **Neither**".
- **Inconsistent option counts** — 3 and 4 mixed, unlike the terminal's uniform 3.
- **Grammar errors in stems** — "This road sign informs you of what." as a question.
- **"Likely choice: 0.0%" on every option** — an analytics feature that exists but is
  unpopulated. Dead feature.
- It does cover **road markings** with SARTSM codes, and uses the **same official controls
  diagram** as the live terminal.

---

## 10. The third-party app adds 48 topics the terminal photos never showed

Reading B/C properly changed the picture. They are not just a competitor to characterise —
they extend the coverage checklist substantially:

| topic | labels seen only in B/C |
|---|---|
| signs | 26 |
| rules | 13 |
| markings | 5 |
| controls | 4 |

Notably they surface whole **sign families absent from the terminal sample**: variable message
signs, brown tourism signs, green service signs, reserved-lane signs with mass limits,
prohibition signs with supplementary time-plates, and the CD (diplomatic corps) reservation
sign. Our `road_signs` breakdown is 234 regulatory / 102 warning / **26 guidance** — and
tourism, service, route-marker, destination and freeway signs all live in that thin guidance
bucket, so it is likely under-populated.

They also confirm a taxonomy gap. Stems use the official SA sub-classifications
("**command sign**"), where regulatory splits into control / command / prohibition /
reservation / comprehensive. Our `SignCategory` has four values total, so it **cannot support
the `sign-classification` archetype (P2)** — that needs a sub-category field.

**Caveat on provenance:** `C-60` is the same braking-distance item as the terminal's Q44
(`A-54`/`D-005`) — same stem, same three statements, same diagram. So the app is not
independently authored content; it is the same bank re-skinned. It is used here exactly as the
photographs are: patterns and coverage only.

Quality-wise it is poor — malformed option sets (`False / True / Neither`), inconsistent
option counts (3 and 4 mixed), grammar errors in stems, a dead "Likely choice: 0.0%" analytics
feature, and lazy distractors ("Old gas station" for an arrestor bed) where the terminal uses
plausible near-misses. Two things worth copying: **NOT rendered in red caps** in negative
stems, and their use of a reference diagram with labelled variants (A–E lane arrows).

## Status

- Papers A and D: **fully read** (170 pages → ~84 unique items; sitting A1 reconstructed to
  51/64).
- Papers B and C: **read across the full range** (~50 of 130 pages, sampled evenly). The
  remaining pages repeat established patterns; the coverage inventory they yielded is in
  `items.md` marked `src = A`.

Combined: **128 distinct topic labels** across both sources.

## Provenance and use

The A/D sources are photographs of a live licence-test terminal, circulated via TikTok and
Facebook chain-shares. They are not a lawful content source, and **nothing in them is
transcribed into the question bank** — no stems, no options, no answer keys. What is recorded
here is exam *shape*: counts, positions, archetypes, topic labels, and which artwork appears.

Questions for the bank are drafted from the National Road Traffic Act 93 of 1996, its
regulations, and the official DoT sign chart, per `CLAUDE.md` constraint 9 and
`docs/rules-coverage-checklist.md`.

The source PDFs are excluded from git via `.gitignore`. They must not be committed.
