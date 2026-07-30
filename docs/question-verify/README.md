# Question verification — where things stand

The 2026-07-30 sweep of the approved question bank, and what it produced.

## State of the bank

| | |
|---|---|
| Approved questions | **124** (`RS-041` withdrawn — see below) |
| Option count | **3 across all 124**, matching the real exam |
| `source_citation` | **97** — rules 39/41, signs 45/46, controls 13/37 |
| `verified_at` | **0** — no human has signed anything off yet |

`verified_at is null` is the worklist. Per constraint 9 an AI pass cannot approve its own work, so
every verdict here is triage: it tells a human where to look and hands them a quote to check.

## The documents

| File | What it is |
|---|---|
| `findings.md` | The 79 **draft** rules questions, adversarially verified. 54 sound, 0 wrong answers. |
| `verdicts.json` | Per-item verdicts for those 79. |
| `approved-bank-findings.md` | The **41 rules + 46 signs** approved items. Found 3 wrong answers. |
| `controls-findings.md` | The **37 controls** items. 32 sound, 0 wrong answers. |
| `controls-batch-*.md` | Per-item controls verdicts with verbatim quotes. |
| `citations/batch-*.md` | The rules+signs citation extraction — provision + quote per item. |

## What was applied, and where it lives

All corrections are **data repairs, not migrations** — content decisions keep moving as the bank
grows, and a migration would freeze one moment of that. Each file is a list of targeted writes with
a `why` on every op, replayed by `scripts/data-repairs/apply-repairs.mjs <file>` and idempotent, so
a re-run reports "already applied" rather than writing again.

| File | Ops |
|---|---|
| `data-repairs-2026-07-30.json` | 24 — the urgent live defects |
| `question-rewrites-2026-07-30.json` | 19 — 4-option → 3-option conversion + content rewrites |
| `citations-controls-2026-07-30.json` | 13 — controls citations |
| `citations-rules-signs-2026-07-30.json` | 84 — rules + signs citations |
| `question-fixes-citation-pass-2026-07-30.json` | 4 — defects the citation pass surfaced |
| `question-fixes-round2-2026-07-30.json` | 6 — defects the citation pass recorded in its notes |

On a fresh database: `supabase db push`, then replay these in the order above.

## Three things worth carrying forward

**A blank citation is a result, not a gap.** 27 of the 124 have no `source_citation` and should not
get one. Vehicle controls is mostly K53 technique — there is no provision on head-restraint height,
on demisting, or on what ABS does, and reviewers grepped both instruments to confirm it. This bank
had already shipped five draft items citing `NRTA s 4(3)`, a subsection that does not exist, so the
brief made "none" the easy answer and it was taken 27 times.

**11 citations are marked `(corroborating)`.** That means the provision supports the item's premise
but is *not* the source of the rule tested — reg 150 requires a motorcycle to have two brakes, it
does not tell you to use both. Do not strip that qualifier when this feeds a UI or an audit report,
or the field will assert that technique is law.

**Our copy of the Regulations is the 2000 original.** Two items (`RR-029` child restraints,
`RR-063` learner's-licence validity) turn on post-2000 amendments we do not hold, so they cannot be
cited no matter that their answers are right. Every duration, fee and age in the bank carries the
same exposure until the amending notices are in `init/`.

## Open

1. **Human sign-off** — the actual accuracy gate, and the only item that cannot be delegated.
2. `RS-041` sits at `review_status='draft'`. It is not deleted, so the record of why survives.
3. **Content gaps** — every one is "a lesson does not exist yet", not "a question is wrong":
   - No learning object for **controlled level crossings**, so `RS-042` carries a null objective
     rather than a wrong one.
   - No **motorcycle steering** object (the `VC18`–`VC22` series covers throttle, both brakes,
     clutch and stopping), so `VC-019` was scoped to B/C/EB instead of reworded.
   - No **GD / GF / GFS** codes and no `IN1`–`IN3`, which `RS-017`, `RS-018`, `RS-021` and `RS-022`
     test. Note the sign library *does* hold 26 guidance rows with artwork — the gap is these
     specific codes, not the class.
   - The markings library has no dividing line (WM3), which `RS-038` describes.

## Fixed in this pass

Recorded because several were long-standing and are easy to reintroduce:

- **Foreign signage taught as South African** — the two-diagonal no-stopping sign (`q-signs-5`), the
  blue pedestrian-crossing sign (`RS-041`, withdrawn), the yellow diamond warning (`RS-005`), the
  row of triangles as a yield line (`RS-039` — SARTSM §7.2.2 makes RTM2 a *broken white line*), and
  a blue one-way sign (`RS-016` — Sch 1 R4 is red).
- **Yield-to-the-right at a four-way stop taught as law** in three items. Sch 1 R1.4 gives
  first-to-stop priority; reg 301 is confined to junctions "where vehicular traffic is required to
  move around a traffic island".
- **Rules stated wider than the provision** — L-plates (`RR-019`, no such requirement exists),
  Code C at 3 500 kg (`RR-035`, it is 16 000), seatbelts "at all times" (`VC-025`, reg 213(4) has a
  proviso), a flat minibus cap (`RR-024`, reg 293(1)(b) says "for reward"), and "light vehicles are
  unaffected" by the goods-vehicle prohibition (`RS-033` — reg 1 takes in a bakkie).
- **Warning signs carrying a duty they do not create** — `RS-008` stated the roundabout yield rule
  on W201, which warns of a mini-circle *or* a roundabout, two junctions with different rules.
