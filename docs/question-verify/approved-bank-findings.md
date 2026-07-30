# The 125 approved questions — citation sweep (2026-07-30)

Ten reviewers over the **41 rules** and **47 signs** items, each reading the Act, the Regulations and
Schedule 1. **The 37 controls items are in `controls-findings.md`** — 32 SOUND, 4 explanation
defects, 1 ambiguous, **0 wrong answers, 0 fabricated citations**, and 23 of 37 correctly returned
no citation at all because the topic is technique rather than law.

The brief was to supply the missing citations. It did that — nearly every item turned out to be
citable, mostly to Schedule 1 — but it also surfaced defects in content that is **live and being
served right now**.

| | rules (41) | signs (47) | total |
|---|---|---|---|
| SOUND | 24 | 23 | **47** |
| EXPLANATION_DEFECT | 8 | 14 | **22** |
| WRONG_ANSWER | 0 | **3** | **3** |
| AMBIGUOUS | 2 | 1 | 3 |
| CITATION_NONE | 7 | 6 | 13 |

Citations were supplied with a verbatim quote for **~85%** of items. `source_basis: official_manual`
turned out to be doing no work — almost everything has a real provision behind it.

---

## 1. Three live items are wrong, and all three teach foreign signage as South African

**`RS-041` — pull it, it cannot be patched.** Describes "a blue rectangular pedestrian-crossing
sign". No such sign exists in South Africa. Sch 1 **R5** is a **red** sign for a pedestrian
*precinct*; the project's own chart verification (`data/verify/verdicts/R5.json`) records "red
diamond … white walking-pedestrian symbol". The blue square is the Vienna Convention sign. Premise,
colour, sign class and objective mapping are all wrong.

**`q-signs-5` — rewrite the stem.** Says the no-stopping sign has **two crossed diagonals**. Sch 1
gives *"Border and diagonal: Red retro-reflective"* — singular — for **both** R216 and R217. The
repo's own `public/signs/R216.svg` and `R217.svg` each show **one** diagonal; the discriminator is
the glyph, **P** for no-parking and **S** for no-stopping. The two-diagonal cross is European. As
drafted the keyed answer is no better supported than the distractor.

**`RS-020` — the rule is backwards.** Claims a round P sign would be the regulatory one. Sch 1
**R305P** (parking reservation) is **rectangular and blue**; the only **round** P is **R216**, which
*prohibits* parking. There is also no parking sign in the information class at all.

Two more foreign conventions asserted as fact, in explanations rather than answers: the
**yellow diamond** warning sign (`RS-005`, `RS-036` — SA uses a yellow *triangle*, reg 286A(1)(b)(iii)
changes the background, not the shape) and the **row of white triangles** as a yield line (`RS-039` —
SA yield lines are a broken white line).

These are the errors most likely to survive review, because they feel like general road knowledge.

## 2. Three items render the wrong picture — one shows its own distractor

`src/components/quiz/question-card.tsx:51` renders `public/signs/<sign_code>.svg` above the prompt,
so a wrong `sign_code` puts a contradicting image in front of the learner.

| Item | Coded | Should be | Effect |
|---|---|---|---|
| `RS-023` | `W409` (chevron board) | `W104` | Stem says triangle, image is a chevron board |
| `RS-025` | `W214` (lane ends) | `W328` | Stem says road narrows, image says lane ends |
| `RS-027` | `W325` (gravel begins) | `W333` | **Shows the gravel sign — which is option (0), a distractor** |

Also mis-tagged: **`RS-004`** carries `R201-60` on an **80 km/h** question (`R201-80.svg` exists).

> **Correction (applied 2026-07-30).** This section first gave `RS-023` as `W105`. That is wrong —
> `W105` is the **skew** T-junction (chart verification: "the crossing bar angled so its high end is
> on the LEFT"), and the stem says *"an inverted T"*. The square-on T is **`W104`**: "a horizontal top
> bar with a vertical stem descending from its centre". `W104` is what was applied.
>
> A second claim here was wrong: **`RS-042` is not mis-mapped.** Its `sign_code` is `null`, so it
> renders no artwork. `W318` is its `objective_code` — the lesson a learner is sent to, not an image.
> Pointing a boom-and-flashing-lights question at the advance-warning triangle is arguably still the
> wrong lesson, but it is not the learner-visible defect this section is about, and it was left alone.

## 3. Eleven live explanations were cut off mid-word — recovered in full

Exactly 200 characters, ending mid-word: `RR-004` `RR-012` `RR-013` `RR-030` `RR-034` `RS-020`
`RS-027` `RS-041` `VC-012` `VC-014` `VC-016`.

> *"…damage-only accidents are not exempt from rep"*
> *"…24 hours if you did not give details to an of"*

**Cause and fix, both found.** The column is `text` with no limit
(`20260629150621_questions.sql:12`) — the truncation is upstream, in the wiki notes: whatever wrote
them cut the frontmatter `explanation:` scalar at 200 characters, and the generator read that copy.
The note's `## Explanation` **body** holds the same prose untruncated, so all eleven were recovered
verbatim rather than rewritten. `build-questions-migration.mjs` now reads the body.

> **Correction.** This section first said *twelve*, listing `VC-001`. `VC-001` is exactly 200
> characters by coincidence and ends in a full stop — it is complete, and so is the draft `RR-079`.
> Eleven were truncated.

## 4. Statements of law that are not law

- **`RR-019` — L-plates.** The explanation says a learner *"must … display L plates"*. There is **no
  L-plate requirement anywhere** in the Act or the Regulations — a reviewer grepped both instruments
  for every variant and found nothing. It is UK law. Delete the clause.
- **`RR-035` — "Code C is for heavy vehicles over 3 500 kg".** Code C is *"exceeds 16 000 kilograms"*;
  3 500–16 000 kg is **C1**. A learner who memorises this fails a C1 question.
- **`RR-033`, `q-rules-1`, `RR-005` — "the one on the right goes" at a four-way stop.** Not in any
  provision. Reg 301's yield-to-the-right is expressly confined to junctions *"where vehicular traffic
  is required to move around a traffic island"* — traffic circles, not four-way stops. Sch 1 R1.4
  legislates first-to-stop priority and is silent on ties. **`RR-005` is additionally mislabelled
  `source_basis: legislation`** for a rule the legislation does not contain.
- **`RS-033` — "light vehicles are unaffected" by R229.** Reg 1 defines a *goods vehicle* to include a
  bakkie. This one has a real-world consequence, not just a recognition one.
- **`RR-024` — minibuses capped at 100 km/h.** Reg 293(1)(b) applies only to *"a minibus used for the
  conveyance of persons for reward"*. A private kombi is on the general limits, so **120 km/h is also
  true** on the question as framed.

## 5. Items that are unanswerable as written

- **`q-rules-3`** — asks when you may cross a solid white centre line. SA has **two** such markings:
  RM1 (which has exceptions) and RM2 (which has none). Against RM2 the distractor *"Never, under any
  circumstances"* is **also true**.
- **`q-rules-1`** — the stem forces a simultaneous arrival, then the keyed answer opens with *"the
  vehicle that arrived first"*.
- **`q-rules-4`** — teaches a duty to yield to a *waiting* pedestrian. Reg 315(2) attaches the duty to
  a pedestrian *"crossing the roadway within a pedestrian crossing"*; reg 315(1) can point the other
  way at a signalled crossing.

## 6. The legacy `q-*` cohort is the problem cohort

All **15 four-option items** are `q-signs-*`, `q-rules-*` and `q-controls-*` — and that same cohort
carries a disproportionate share of the content defects above. The real test uses **three** options
(`docs/exam-format-analysis/`, 165 terminal pages, no exceptions).

Every `RR-*` and `RS-*` item is correctly 3-option. Treat the `q-*` items as one generation and
assume the rest of it is defective until checked.

## 7. Coverage gap this exposed

`RS-017`–`RS-022` test **guidance and information signs**.

> **Correction (2026-07-30).** This section first said *"zero are guidance-class"*. That is wrong —
> `road_signs` holds **26 guidance rows**, every one with artwork on disk and approved on both gates.
> The real gap is narrower and specific: the codes these particular questions test are missing.

| Item | Tests | In the library? |
|---|---|---|
| `RS-017` | Green direction sign (GD series) | **No GD codes at all** |
| `RS-018` | Tourism sign background (GF series) | **No GF codes at all** |
| `RS-019` | Information-sign shape | Generic — no code, correctly |
| `RS-020` | Blue rectangular P | **Yes — `R305-P`**, now mapped |
| `RS-021` | Hospital 'H' (GFS service symbol) | No GFS codes |
| `RS-022` | Freeway exit countdown | **`IN1`/`IN2`/`IN3` absent** (IN4–IN20 exist) |

`RS-039` is now mapped to `RTM2`; `RS-038` describes a dividing line (WM3), which the markings
library does not hold. So four items still test chart areas with no lesson to link to — worth Stage 1
tracking, but a much smaller hole than first recorded.

---

## Applied 2026-07-30

`scripts/data-repairs/data-repairs-2026-07-30.json`, replayed by
`apply-repairs.mjs` — 18 targeted writes, idempotent, each carrying its own `why`:

- **`RS-041` withdrawn** → `review_status='draft'`, `in_exam=false`. Draft, not just un-exammed:
  `getPracticeQuestions` (`src/lib/questions.ts:59`) filters on `review_status` **alone**, so
  `in_exam=false` would have left it live in practice mode.
- **Four `sign_code`/`objective_code` fixes** — `RS-004`→`R201-80`, `RS-023`→`W104`,
  `RS-025`→`W328`, `RS-027`→`W333`.
- **`RR-019`** — L-plate clause deleted and replaced with the reg 99(2)(a) supervision rule. Also
  dropped `A` from `vehicle_codes`: reg 99(2)(a) exempts *"a motor vehicle having no seating
  accommodation for a passenger or … a motor cycle"*, so the keyed answer ("you must **always** be
  supervised") was false for a Code A learner. Scoping the item fixes that without touching the key.
- **`RR-035`** — Code C corrected to *exceeds 16 000 kg*, naming C1 as the 3 500–16 000 kg band.
- **Eleven explanations restored** in full from the wiki bodies.

The generator was fixed in the same pass so a regeneration cannot reintroduce any of it: the three
bad `SIGN_NAME_TO_CODE` entries, the two names that must stay unmapped, `SIGN_CODE_OVERRIDES` for
distractor-named `related_signs`, `WITHDRAWN`, and reading the explanation from the note body.

## Still outstanding

1. Rewrite `q-signs-5` (two diagonals) and `RS-020` — its keyed **option** text still claims
   *"a round/regulatory P would control it"*, though its explanation is now restored in full.
2. Convert the whole `q-*` cohort to 3 options or retire it.
3. Correct the three items teaching yield-to-the-right as law at a four-way stop, and `RS-033`.
4. Backfill `source_citation` from the reviewer output, then a human pass to record `approved_by`.
5. The four controls fixes in `controls-findings.md` (`VC-019` scoping + three explanations).
