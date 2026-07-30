# Item construction patterns — how the live terminal builds a question

A writing spec derived from the observed items. Each pattern gives the stem frame, the
option structure, and the distractor logic — enough to author new items that feel like the
real paper, without reproducing any of its content.

Notation: `<X>` is a slot we fill from our own verified content.

---

## P1 · sign-meaning

- **Stem frame:** `This sign shows you that …` / `This sign indicates …` /
  `What does this sign inform you about?` / `This sign shows the driver of the vehicle that …`
- **Artwork:** one sign, right-hand side of the panel.
- **Options:** 3, prose, sentence-completing the stem.
- **Distractor logic:** the two wrong options are *meanings of visually similar signs* or
  *over-literal readings of the pictogram*. They are never absurd.
  - e.g. for a route-marker with an arrow: correct = "there is an alternative route at the
    next intersection to the right"; distractors = "the driver must turn right at the next
    intersection" (turns guidance into a command) and "the road turns right only"
    (reads the arrow as geometry).
- **Our gap:** none — this is the archetype we already produce.

## P2 · sign-classification

- **Stem frame:** `This type of sign is known as a …`
- **Options:** 3, each a sign *category* name.
- **Distractor logic:** the other two categories in the same family (regulatory /
  warning / guidance / information).
- **Note:** the bank reuses one artwork across P1 and P2 — the same green-T sign appears
  once asking meaning, once asking classification. Cheap coverage per asset.

## P3 · sign-meaning-numeric

- **Stem frame:** `This sign indicates to a driver that <thing> is … ahead.`
- **Options:** 3, bare quantities (`1 km` / `100 meters` / `10 meters`).
- **Distractor logic:** order-of-magnitude neighbours of the correct distance. No prose.
- **Our gap:** we have no numeric-answer items.

## P4 · marking-meaning

- **Stem frame:** `This road marking indicates to drivers to …` /
  `This road marking warns the road user that …` / `This road marking informs drivers that …`
- **Artwork:** plan-view diagram of a carriageway, green verges, white/yellow lines.
- **Options:** 3, prose.
- **Distractor logic:** meanings of *other* markings that share a visual feature (broken vs
  solid, edge vs centre).
- **Our gap:** total — zero markings in `road_signs`.

## P5 · marking-to-sign-link

- **Stem frame:** `Before this road marking one would usually find the following sign …`
- **Artwork:** a marking diagram; options describe or show signs.
- **Distractor logic:** signs that are plausible at the same location.
- **Our gap:** total. This is a *cross-topic* item — it tests whether the learner connects
  the marking to its advance sign, which no single-topic bank can produce.

## P6 · combination-select

- **Stem frame:**
  ```
  <lead-in clause> …
  (i) <statement>
  (ii) <statement>
  (iii) <statement>

  SELECT THE CORRECT COMBINATION
  ```
- **Options:** 3, drawn from a fixed vocabulary:
  `All the above are correct` / `Only (i) is correct` / `Only (i) and (iii) are correct` /
  `None of the above are correct` / `Only (ii) only is correct`
- **Distractor logic:** the option set is *structural*, not semantic — the learner must
  evaluate each of the three statements independently. One partially-true statement makes
  "All the above" wrong.
- **Our gap:** total. This is the highest-value archetype to add: it tests three facts per
  item and is far harder to guess than a 1-of-3 prose choice.

## P7 · control-number

- **Stem frame:** `The following control is used to <function>:` or
  `When control number <n> is used, <consequence> …`
- **Artwork:** line drawing of the dashboard / steering column / pedals with **numbered
  callouts**.
- **Options:** 3, bare integers (`A. 6` / `B. 4` / `C. 5`) when asking *which control*.
- **Distractor logic:** callout numbers of adjacent or functionally-confusable controls.
- **Composition:** P7 **composes with P6** — one observed item gives a control number in the
  stem, then asks a three-statement combination about braking distance. That is the hardest
  observed item form.
- **Our gap:** total. Requires a numbered controls diagram as an asset, which we do not have.

## P8 · which-statement-correct

- **Stem frame:** `Which statement is true?` / `Which one of the following statements is correct?`
- **Options:** 3 full standalone sentences (long — often two lines each).
- **Distractor logic:** the wrong options are the correct rule with a **scope error** —
  a correct statement narrowed to the wrong context ("in an urban area" / "outside a built-up
  area" / "during the day only") where the real rule is unqualified.
- **Note:** this is the most reliably *teachable* pattern — the mistake being tested is
  always over- or under-generalising a rule.

## P9 · stem-completion

- **Stem frame:** stem ends in `…`, options complete the sentence grammatically.
- **Options:** 3, prose fragments.
- **Distractor logic:** plausible completions that are true of a *related* rule.

## P10 · direct-question

- **Stem frame:** a plain question, no artwork.
- **Options:** 3 prose, or 3 distances/speeds.

## P11 · scenario

- **Stem frame:** 2–3 sentences establishing a situation (traffic state, position, other
  road users' behaviour), ending `What should you do?`
- **Options:** 3 candidate actions.
- **Distractor logic:** one impatient/aggressive action, one passive-but-wrong action, one
  correct defensive action. The correct answer is always the K53 defensive-driving choice.
- **Note:** this is the archetype closest to what an AI tutor can add real value on, because
  the *reasoning* matters more than the fact.

---

## Structural rules observed across all items

| property | value |
|---|---|
| options per item | **3** (A/B/C) — no exceptions in the live terminal |
| option order | shuffled per sitting; correct answer position carries no signal |
| item position | varies per sitting; the paper is assembled from a pool |
| paper length | 64, one continuous counter, topics interleaved |
| negative marking | none observed |
| artwork | ~46% of items carry artwork; ~54% are text-only |
| emphasis | a `NOT` in a stem is rendered in red caps (seen in the third-party app) |

## Topic mix (84 deduplicated terminal items)

Measured on unique items, not page counts — page counts are inflated by duplicate photographs.

| topic | observed | `EXAM_FORMAT_B` | |
|---|---|---|---|
| rules | 47% | 44% | ok |
| signs | 32% | 44% | over by ~12pp |
| controls | 11% | 12% | ok |
| markings | 9% | 0% | absent |

Markings appear to count *inside* the signs section rather than as a fourth section:
signs + markings ≈ 26 of 64, against the 28 reported for the signs section. On that reading
our section sizes are broadly right and the real gap is purely the missing markings content.

## Marking topics identified — 13

**From the live terminal (8):** yield · railway-yield · railway level crossing · bus lane ·
pedestrian crossing · no-parking · reversible lane · lane reduction from right.

**From the third-party app (5 more):** parking permitted · ambulance parking bay ·
lane-direction arrows · no-overtaking barrier lines · RT2 pedestrian lines.

These are the writing targets for the K53-32 markings gate. Content for each is drafted
from the National Road Traffic Act regulations and the SARTSM, not from these scans.

---

# Additional patterns (from the third-party app)

These were not seen in the terminal photographs but are consistent with the exam's style
and are worth building.

## P14 · procedure-sequence

- **Stem frame:** `If you wish to <manoeuvre>, which of the following is the correct procedure:`
- **Options:** 3–4, each an ordered sequence of actions.
- **Distractor logic:** the correct full sequence with **one or more steps omitted**. For a
  lane change the correct answer is the complete K53 observation drill (blind spot → behind →
  blind spot → indicate → proceed when safe); distractors drop the second blind-spot check,
  or the rear check, or the indication.
- **Why it matters:** this is the highest-value archetype we could add after `combination-select`.
  It tests the *observation discipline* that the practical test also grades, so the same content
  serves Phase 2. It is also naturally explainable — every omitted step has a specific hazard
  attached to it, which is exactly what an AI tutor can articulate.

## P15 · qualified true/false

- **Stem frame:** a statement, then True / False options where **one option carries a qualifier**
  (e.g. `True, however only if you have clear visibility for 150 m ahead`).
- **Distractor logic:** the bare `True` and bare `False` are both wrong; the answer is the
  conditional. Tests whether the learner knows the *condition attached to a permission*, not
  the permission itself.
- **Caution:** the app also produces malformed versions of this (`False / True / Neither`, or
  mixing `Only if it is an emergency` with `True`/`False`). Do **not** copy those — options must
  be mutually exclusive and parallel.

---

# Distractor techniques catalogue

Collected across both sources. These are the reusable levers for writing new items.

| technique | how it works | seen in |
|---|---|---|
| **scope error** | correct rule narrowed to a wrong context ("in an urban area", "at night only") | terminal, heavily |
| **mirror image** | two options identical but for left/right, or from-the-left vs from-the-right | app (concealed driveways, traffic circle) |
| **magnitude neighbour** | numeric answers an order of magnitude apart (10 m / 100 m / 1 km) | both |
| **step omission** | correct procedure minus a step | app (P14) |
| **irrelevant attribute** | options vary on a detail that does not matter (cap *colour*) so the learner must spot that the real requirement is elsewhere | app (fuel tank cap) |
| **near-miss meaning** | meaning of a visually similar sign | terminal |
| **over-literal reading** | reads the pictogram geometrically rather than legally (arrow = "road turns right" vs "alternative route right") | terminal |
| **partial truth in a combination** | one of the three (i)/(ii)/(iii) statements is *nearly* true, which kills "All of the above" | both |
| **absurd filler** | obviously wrong option ("Old gas station") — **anti-pattern**, lowers difficulty; the terminal does not do this | app only |

The last row is the quality line between the real exam and the competitor. Our items should
use the techniques above the line and never the one below it.
