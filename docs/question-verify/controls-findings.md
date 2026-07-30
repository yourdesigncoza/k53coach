# The 37 approved controls questions — citation sweep (2026-07-30)

Five adversarial reviewers, one per batch, each given the extracted **National Road Traffic Act 93
of 1996** and **National Road Traffic Regulations 2000** and told to refute rather than confirm.
Every citation had to carry a verbatim quote grepped out of the source, or be recorded as *none*.

This completes the sweep of the 125 approved questions begun in `approved-bank-findings.md`.
Per-item verdicts with the verbatim quotes are in `controls-batch-1.md` … `controls-batch-5.md`.

| Verdict | n |
|---|---|
| **SOUND** | **32** |
| EXPLANATION_DEFECT | 4 |
| AMBIGUOUS | 1 |
| **WRONG_ANSWER** | **0** |
| UNSUPPORTED | 0 |

**No wrong answers, and no fabricated citations.** This is the cleanest of the three topics — better
than the signs batch (3 wrong answers) and better than the rules batch.

## The brief was written to make a blank citation the easy answer, and it was taken

Vehicle controls is mostly K53 *technique* — clutch, hill starts, mirror checks, braking. There is
genuinely no statute behind "don't ride the clutch". The reviewers were told in terms that
`CITATION_NONE` was the expected verdict and that a high rate of it was a successful review, because
the drafting pipeline had already produced five items citing a non-existent `NRTA s 4(3)`.

**23 of 37 came back with no citation. 14 have a real provision, each quoted.** That ratio is the
result worth having: nobody reached for a plausible-looking reg to fill a blank field.

Two reviewers went further and flagged *traps* — provisions that look on-point and are not:

- **reg 150** (motorcycles: two independent braking systems) does **not** legislate which hand or
  foot operates which brake. Citing it on `VC-027`/`VC-029` would be a misattribution.
- **reg 204(1)(b)** requires a vehicle to be *fitted* with a rearview mirror. It says nothing about
  reversing procedure, so it is not a citation for `VC-018`.
- **reg 155(1)(c)** sets the parking brake's gradient-holding standard (1 in 8,33). It is not
  authority for hill-start technique.

Recording those is worth as much as the citations themselves.

## The four defects, all in explanations, none in a marked answer

**`VC-001` — the handbrake claim is too absolute.** The explanation says the handbrake *"only keeps
a stationary vehicle still"*. Reg 149's proviso (a) says *"the emergency brake and parking brake may
be one and the same brake"*, and reg 1 defines an emergency brake as *"a brake, other than a service
brake, which can stop a vehicle"*. So in law the handbrake may well be the emergency brake. The
marked answer (foot brake) is right; the reasoning given for it is not.

**`VC-025` — "worn at all times" is wider than the regulation.** Reg 213(4) carries an express
proviso: *"the provisions of this regulation do not apply while reversing or moving in or out of a
parking bay or area"*, and reg 213(5) permits an adult to occupy an unbelted seat once all belted
seats in that row are taken. The keyed answer ("before the vehicle moves off") stands.

**`VC-027` — false for scooters, which are in its own scope.** The explanation adds *"the rear brake
is the right-foot pedal and the clutch is the left-hand lever"*. On a twist-and-go scooter there is
no clutch lever and no foot pedal — the left lever **is** the rear brake. The item is scoped
`vehicle_codes: {A}`, so scooters are squarely inside it. The keyed answer (right hand, front brake)
holds for both layouts.

**`VC-032` — the defect is in the option text, not the explanation.** The keyed option reads *"An
automatic has no clutch and selects gears itself"*. A torque-converter automatic contains clutch
packs; a DCT has two. What it has no *driver-operated* clutch pedal. The explanation already says
"no clutch **control**", which is correct — so the option and the explanation disagree with each
other. Same shape as `RS-020` in the signs batch, where the keyed option carried the error while the
explanation was sound.

## `VC-019` asks a Code A learner about a control a motorcycle does not have

*"Which control actually changes the direction the vehicle travels?"* → **the steering wheel**,
scoped `{A,B,C,EB}`. A motorcycle has handlebars. The two distractors (indicator, hooter) are still
wrong, so the item is answerable, but for a Code A candidate the keyed answer names a control that is
not on the vehicle.

**This is the same defect that was just fixed in `RR-019`** — an item scoped to a vehicle class the
rule does not fit. Fix the same way: drop `A`, or reword to "steering wheel or handlebars".

Three more items are scoped to `A` while their wording is car-only. None breaks:

| | |
|---|---|
| `q-controls-1` | *"usually the middle pedal in a manual car"* — a motorcycle's rear brake is still a foot pedal, so the answer survives |
| `VC-003` | *"regulates the fuel supply"* — a motorcycle uses a twist grip, and on an EFI engine the pedal commands torque while the ECU meters fuel |

## Corrections to the reviewers

Two claims came back that do not survive checking, recorded so they are not actioned later:

- **`q-controls-3` and `VC-012` sharing `objective_code: VC11` is not a mis-mapping.** `VC11` is
  **"Cockpit setup"** (`src/content/vehicle-controls.ts`), which properly covers the cockpit drill,
  the head restraint and the seatbelt. Shared objective codes are the *norm* here, not a defect —
  11 of the codes in this topic carry more than one question, which is what a learning objective is
  for.
- **`CLAUDE.md` says controls objectives are `VC1`–`VC11`. That is stale** — `VC1`–`VC22` exist and
  are all in use. Worth correcting in the project doc.

## The four-option cohort is consistent across all three topics

All five `q-controls-*` items have **4 options**; every `VC-*` item has 3. They are also the only
five controls questions with a null `topic_tag` **and** a null `source_basis`.

That now holds across the whole bank: `q-signs-*`, `q-rules-*` and `q-controls-*` are one defective
generation — wrong option count for the real exam (3 options,
`docs/exam-format-analysis/`), missing metadata, and a disproportionate share of the content
defects. Retiring or converting the cohort is one decision, not fifteen.

---

## Recommended order

1. **`VC-019`** — drop `A` from `vehicle_codes` (or reword). Same fix as `RR-019`, already precedented.
2. Fix the four explanations: `VC-001`, `VC-025`, `VC-027`, `VC-032` (option text).
3. Backfill `source_citation` for the 14 items that have a real provision — all quoted, so this is
   transcription, not research.
4. Fold into the outstanding `q-*` cohort decision.

Nothing here is approved. Per constraint 9 these verdicts are triage for a human, not a sign-off —
but every one carries a quote that can be checked in seconds.
