# Verification worklist — 43 draft learning objects

**Status:** ✅ **CLOSED 2026-08-05** · **Created:** 2026-07-24 · **Gate:** Stage 1 launch — met

> ## ✅ The question pass is done
>
> John exported the question bank to CSV and sent it to Louwrens, who read it and approved. The
> result is recorded on all 228 remaining rows by
> `scripts/data-repairs/louwrens-csv-signoff-2026-08-05.json`, so **`approved_by = 'system'` no
> longer exists in `questions`** and all **274/274** approved questions carry `verified_at`.
> That closes the last open Stage 1 gate row (K53-32).
>
> **Read the rest of this file as the record of what was flagged going in, not as open work.**
> Two things it says are now historical: the per-item tick-box instructions below, and the framing
> that nothing has been verified. What still matters is the **⚠️ partial-citation table** further
> down — those 16 are where the source supports the item but not the keyed answer, they were
> inside the CSV, and they remain the first place to look if a learner ever reports a wrong answer.
>
> Note the granularity: this batch shares **one** `verified_at` instant because it was signed off
> as a CSV, unlike the 46 signs ticked individually in the admin UI on 2026-08-03. Both are
> Louwrens; only the resolution differs.
>
> ⚠️ **This closes the QUESTIONS, not the lesson prose this file is titled after.** The 30 rule
> objects (`RR1`–`RR30`) and 22 control objects (`VC1`–`VC22`) in `src/content/*.ts` are still
> `reviewStatus: "draft"` — the CSV was the question bank. Stage 1 gates on questions, so the
> launch bar is met either way, but don't read "closed" as covering the lesson bodies.

> **Original framing (2026-07-24), superseded above.** Every object is `reviewStatus: "draft"` (rules, controls) or
> `review_status: 'draft'` (markings). Per the accuracy gate (`CLAUDE.md` constraint 9) **AI drafts but
> never self-certifies** — a second pass by the same model against the same sources is circular and
> proves nothing. This is the *worklist*, not a result.

## How to work through it

1. Open the provision in **Cites**.
2. Confirm each claim in **Check** against it. These are the sentences carrying a figure — where a
   wrong answer actually costs a learner their test.
3. Tick the box. When a whole topic is ticked, flip its `reviewStatus` to `approved`.

**35 number-bearing claims across 43 objects.** Prose without figures still needs a read for sense,
but the figures are the priority.

## ✅ RESOLVED — the `-600` artwork was the European form (2026-08-03)

Closed by looking at it. Both our SVGs and the chart's own artwork were rendered to
images and compared:

| | marker |
|---|---|
| Official DoT chart, sheet 1, block labelled **"De-Restriction signs"** | a red **CROSS** over the original sign |
| `public/signs/R*-600.svg` (ours) | a single red **diagonal slash** |

SARTSM Vol 1 Ch 2 §2.9 agrees with the chart: *"DE-RESTRICTION is achieved by
displaying the original sign with a RED CROSS (R)600 superimposed on the face of the
sign."* In South Africa a diagonal slash means **prohibited**; in the European system a
slash is how an end-of-restriction is drawn. So this was foreign artwork in an SA
library — the same defect as the withdrawn R360 Vienna pedestrian-crossing sign.

All seven (`R101-600`, `R132-600`, `R133-600`, `R202-600`, `R401-600`, `R402-600`,
`R403-600`) had `asset_status` returned to `needs_review`, dropping them from the served
set (375 → 368) without deleting the record. Each row's own provenance told the same
story: `in_official_chart: false`, `alignment: not_in_chart`, sourced from Wikimedia and
approved by `ai:claude-code+brave` — never chart-verified by anyone.

**Restore only when the artwork is redrawn or re-sourced with a red cross and verified
against the chart.** No question references a `-600` sign; the one that was drafted was
dropped before load, so nothing is orphaned.

**The lesson worth keeping:** the wording fix earlier the same day was necessary and not
sufficient. The text said "red cross" while the picture said "slash", and the picture is
what a learner studies. Correcting content without looking at the artwork it describes
leaves the defect in place.

## ⚠️ Start here — three items short of a primary source

Flagged *by the drafting pass itself*. These are the most likely to be wrong.

| Object | Issue |
|---|---|
| `RR22` | No national provision found barring a learner-licence holder from a freeway — reg 323(1) bans vehicle **types**, not licence classes. Contradicts common belief, so the object deliberately teaches it **neither way**. Resolve before any exam question is written on it. |
| ~~`RR12`~~ | **RESOLVED 2026-08-03.** The infant restraint rule was read in the primary gazette: `resources/legislation/nrtr-amendment-2014-gg38142-gnr846.pdf` s.52 amends reg 213 by adding (1)(c) *"an infant is a person below the age of three years"* and inserting *"(6A) The driver of a motor vehicle operated on a public road shall ensure that an infant traveling in such a motor vehicle is seated on an appropriate child restraint: Provided that this provision shall not apply in a case of a minibus, midibus or bus operating for reward."* In force 31 Oct 2014 (date of publication). It is absent from the consolidated copy only because that consolidation stops at GNR.209 of 2012. No secondary source needed. |
| `VC20` | Reg 309 (rider's feet on the foot-rests) confirmed from two consistent secondary SA sources, not the primary gazette text. |

## Road rules (`RR11`–`RR26`)

| ✓ | Code | Object | Cites | Check |
|---|---|---|---|---|
| ☐ | `RR11` | Alcohol and drug limits | NRTA 93 of 1996 — s 65(1),(2),(5),(8),(9); s 32 (professional driving permit) | 0,05 in your blood is already over the line — and 0,02 if you drive for a living.<br>It is a separate offence if your blood alcohol reaches 0,05 g per 100 ml or your breath alcohol reaches 0,24 mg per 1 000 ml.<br>For a driver who must hold a professional driving permit, the limits drop to 0,02 g per 100 ml of blood and 0,10 mg per 1 000 ml of breath.<br>Learn the numbers as two pairs: 0,05 blood / 0,24 breath for ordinary drivers, 0,02 blood / 0,10 breath for professional drivers. |
| ☐ | `RR12` ⚠️ | Seatbelts and child restraints | NRTR 2000 — reg 213(1),(4),(5),(6),(7),(11); infant rule reg 213(6A) (GN R846, GG 38142) | Know the three age bands: infant is under 3, child is 3 to 14 (unless taller than 1,5 m), adult is over 14 or 1,5 m and taller. |
| ☐ | `RR13` | Licence and documents | NRTA 93 of 1996 — s 12(a)-(b), 13, 15(1)(a)(ii), 30; NRTR 2000 — reg 99(2), 101(1) | Remember: a learner's licence for a light motor vehicle needs you to be 17, and it stays valid for 24 months. |
| ☐ | `RR14` | Use of the hooter | NRTR 2000 — reg 310A (use of hooter); reg 310 (excessive noise) | *prose only — read for sense* |
| ☐ | `RR15` | Tyres and tread depth | NRTR 2000 — reg 212(f),(j),(l),(m) (tyres) | Every tyre needs at least 1 mm of tread, right across and all the way around.<br>A tyre used on a public road must show a clearly visible tread pattern across its full breadth and around its whole circumference, at least 1 mm deep.<br>1 mm is the legal minimum, not a safe target. |
| ☐ | `RR16` | Number plates, licence disc and roadworthiness | NRTA 93 of 1996 — s 4(2), s 42(1), s 1(lxiii); NRTR 2000 — reg 35(6), 35(7)(f), 36(1)(a), 36(2)(b) | *prose only — read for sense.* Previously cited a non-existent `s 4(3)`; corrected 2026-07-30 |
| ☐ | `RR17` | Towing a trailer | NRTR 2000 — reg 99(4) (licence codes B and EB), reg 151 (trailer brakes), regs 292-293 (speed) | A Code B licence only covers a trailer of 750 kg GVM or less.<br>A Code B licence lets you drive a light vehicle with a trailer whose gross vehicle mass is 750 kg or less.<br>The number to remember is 750 kg GVM — that is the line between Code B and Code EB. |
| ☐ | `RR18` | When your lights must be on | NRTR 2000 — reg 157(1)(b) (when lamps must be lit), reg 157(3) (dazzling oncoming traffic) | Lights on from sunset to sunrise, and any time you can't see 150 m clearly.<br>Your headlamps, rear lamps and number plate lamps must be lit between sunset and sunrise, and at any other time when poor light or bad weather means people and vehicles are not clearly visible at 150 metres.<br>Two triggers: sunset to sunrise, and whenever you cannot clearly see 150 m ahead. |
| ☐ | `RR19` | Keep left, pass right | NRTR 2000 — reg 296 (keep left), reg 298(1) (passing), reg 298A (no driving on the shoulder) | *prose only — read for sense* |
| ☐ | `RR20` | When someone overtakes you | NRTR 2000 — reg 298(3) (duty of the driver being passed), reg 323(5)-(6) (freeway right lane) | *prose only — read for sense* |
| ☐ | `RR21` | Divided roads and dual carriageways | NRTR 2000 — reg 297(1)-(2) (divided roads), reg 299(2) (entering a road safely) | *prose only — read for sense* |
| ☐ | `RR22` ⚠️ | Freeway rules | NRTA 93 of 1996 — s 1 ("freeway"); NRTR 2000 — reg 323 (freeways), reg 292(c) (120 km/h) | Bicycles, animal-drawn vehicles, tractors, motor tricycles and quadrucycles, motorcycles of 50 cc or less or driven by electric power, and small disability vehicles under 230 kg may not be operated on a freeway.<br>The general limit is 120 km/h unless a sign shows lower. |
| ☐ | `RR23` | Hand signals | NRTR 2000 — reg 300 (signals), regs 324, 325, 327 (hand signals), reg 326 (indicators) | *prose only — read for sense* |
| ☐ | `RR24` | Emergency vehicles | NRTR 2000 — reg 308(1)(h); NRTA 93 of 1996 — s 58(3), s 60 | *prose only — read for sense* |
| ☐ | `RR25` | After an accident: your duties | NRTA 93 of 1996 — s 61(1)(a)-(g) (duties after an accident), s 61(2) (moving vehicles) | Stop, help, hand over your details, and report it to the police within 24 hours.<br>If you did not give those details to a traffic officer at the scene, report the accident at a police station as soon as you reasonably can and within 24 hours, with your driving licence and ID number. |
| ☐ | `RR26` | Turning at intersections | NRTR 2000 — reg 302(1)-(2) (turning procedure), reg 300 (signal duration) | *prose only — read for sense* |

## Vehicle controls (`VC1`–`VC22`)

**`VC1`–`VC17` (Code B / car) were grounded 2026-08-03** against the consolidated NRTR
*and* re-checked against the 2014 amendment (GNR.846, in force 31 Oct 2014), which
substitutes reg 149 and amends regs 159, 169, 201, 213 and 215. Every citation below was
read in the amended text and the wording relied on is quoted in
`src/content/vehicle-controls.ts`. All 17 moved `draft` → **`reviewed`**.

⚠️ **`reviewed` is not `approved`.** It means grounded and currency-checked by machine.
Constraint 9 needs a *named human* to sign off — that is what the ☐ boxes below are for.
Nobody may set `approved` on the strength of this pass. `VC18`–`VC22` stay `draft`:
motorcycle set, parked by John 2026-08-03 while Code B is completed.

**Read the "no legal claim" rows as findings, not gaps.** Most of these lessons teach
operating technique, and no regulation governs technique. The check for those rows is
whether the prose is *true and useful*, not whether it matches a reg.

| ✓ | Code | Object | Cites | Check |
|---|---|---|---|---|
| ☐ | `VC1` | Steering wheel | *technique — no legal claim.* Adjacent: reg 200(1)(a)-(b) (steering gear condition; 45° free-play cap) | No regulation prescribes a hand position. Confirm "quarter to three" is taught as good practice, **not** as law. |
| ☐ | `VC2` | Accelerator | *technique — no legal claim* | *prose only — read for sense* |
| ☐ | `VC3` | Footbrake | NRTR reg 149 (service + parking + emergency brake required; substituted by GNR.846 of 2014); reg 156(1)(a) (good working order) | The law requires the brake's presence and condition, not a pedal technique. |
| ☐ | `VC4` | Clutch | *technique — no legal claim.* Scope: DoT manual §2.5 item 8 | Manual confirms an automatic has no clutch control — so control 8 is examined on manual cars only. |
| ☐ | `VC5` | Gear lever | *technique — no legal claim* | *prose only — read for sense* |
| ☐ | `VC6` | Handbrake | NRTR reg 1 definition of "parking brake"; reg 149 (emergency and parking brake may be one and the same); reg 156(1)(a) | Definition reads *"a brake, normally a hand brake, used in the ordinary course of events to keep a vehicle stationary"* — note **normally**, so a foot-operated parking brake is still a parking brake (the manual names Mercedes-Benz). |
| ☐ | `VC7` | Indicators | NRTR reg 193(1) (both sides); reg 198(4) (sides operable separately); reg 198(8) (good working order); reg 199 | Signal **timing** ("in good time") is technique — no regulated interval. Don't let a question imply one. |
| ☐ | `VC8` | Headlights & brights | NRTR reg 157(1)(b) (sunset–sunrise + 150 m rule); reg 157(3) (extinguish main-beam causing dangerous glare); reg 160(b) (dip device) | Dipping is a **legal duty**, not courtesy. Note reg 157(2): a motor cycle's headlamp must be lit **at all times** — Code A only, and the basis for K53-41. |
| ☐ | `VC9` | Hooter | NRTR reg 201(1)(a) (audible at 90 m); reg 310A (use of hooter) | reg 310A makes "alert, not vent" a legal duty: use only when *necessary to comply with the regulations or on the grounds of safety*. The 90 m figure is testable. |
| ☐ | `VC10` | Warning lights | *no legal claim* | **Colour coding CUT 2026-08-03** (John's call). "Red means stop and check, amber means caution" and the "know red vs amber" testHint are gone: the only "warning light" in the NRTR is reg 181(1)(a), an exterior lamp on a **trailer**; tell-tale colours live in ISO 2575 / UN ECE R121, reachable only through reg 216's compulsory-specs chain, which we do not hold in `resources/`. Not examined either — not among the manual's 11 car controls, and no dashboard tell-tale appears in 150+ indexed real items. What remains is behaviour, not colour. Check the reworded prose reads true, and **do not reinstate the colour coding without a primary source**. |
| ☐ | `VC11` | Cockpit setup | NRTR reg 213(4) (adults must wear a fitted seatbelt); reg 213(3)(c) (belts in good working order); reg 204(1)(a) | reg 213(4)'s proviso is testable: the wearing duty does **not** apply *"while reversing or moving in or out of a parking bay or area"*. Seat/mirror order is technique. |
| ☐ | `VC12` | Windscreen wipers and washers | NRTR reg 203; reg 204(1)(a) | ✅ Citation confirmed verbatim; reg 203 untouched by GNR.846. Wiper must work "by other than manual means" and wipe "continuously, evenly and adequately". |
| ☐ | `VC13` | Demister and defroster | NRTR reg 204(1)(a) | ✅ Confirmed. No reg prescribes a demister as equipment — the duty is the clear view it protects. |
| ☐ | `VC14` | Hazard warning lights | NRTR reg 198(5)(a), (6)(a)-(b) | ✅ Confirmed, and stronger than recorded: (6)(a) **requires** them when stationary in a hazardous position or in motion in an emergency; (6)(b) **forbids** them otherwise. Both halves are testable. |
| ☐ | `VC15` | Brake lights | NRTR reg 169(1)(e),(f) | ✅ Confirmed. GNR.846 s.47 only **added** subreg (4) (optional emergency-braking flashing lamps); (1)(e)-(f) unchanged. |
| ☐ | `VC16` | Mirrors | NRTR reg 204(1)(b); **and (1)(c) for a car** | ✅ Confirmed, and sharpened: for a motor car ≤3 500 kg first registered on/after 1 Jan 1987 the duty is an exterior mirror on the driving side **plus** an interior mirror. |
| ☐ | `VC17` | ABS (anti-lock brakes) | *no legal claim* | ✅ Verified: no reg prescribes ABS; GNR.846 s.42 added UN ECE R116 for **anti-theft** devices only, not braking aids. |
| ☐ | `VC18` | Motorcycle: throttle | vehicle operation — no legal claim | *prose only — read for sense* |
| ☐ | `VC19` | Motorcycle: front brake | vehicle operation — no legal claim | As you slow, weight shifts forward onto the front tyre, so it does most of the stopping — rider training puts it at roughly 70%. |
| ☐ | `VC20` ⚠️ | Motorcycle: rear brake | NRTR 2000 — reg 309 (rider's feet on the foot-rests) | *prose only — read for sense* |
| ☐ | `VC21` | Motorcycle: clutch and gear lever | vehicle operation — no legal claim | *prose only — read for sense* |
| ☐ | `VC22` | Motorcycle: braking to a controlled stop | vehicle operation — no legal claim | *prose only — read for sense* |

## Road markings (RTM / RM series)

| ✓ | Code | Object | Cites | Check |
|---|---|---|---|---|
| ☐ | `RM1` | No Overtaking Line | SARTSM Vol 1 §7.2.5 | It is white, continuous, and at least 100 mm wide. |
| ☐ | `RM10` | Box Junction | SARTSM Vol 1 §7.2.14 | Continuous yellow boundary lines enclosing yellow cross-hatched diagonals, all at least 100 mm wide. |
| ☐ | `RM12` | No Stopping Line | SARTSM Vol 1 §7.2.16; paired sign R217 per §2.4.14.4; NRTR 2000 reg 304 | Two forms per §7.2.16(2): a continuous solid red line at least 150 mm wide applies 24 hours a day, OR a broken red line at least 100 mm wide applies only during the periods shown on an accompanying sign. |
| ☐ | `RM13` | No Parking Line | SARTSM Vol 1 §7.2.17; paired sign R216 per §2.4.13.4; NRTA 93 of 1996 s1 definition of 'park' | Two forms per §7.2.17(2): a continuous solid yellow line at least 100 mm wide applies 24 hours a day, OR a broken yellow line at least 100 mm wide applies only during the periods shown on an accompanying sign. |
| ☐ | `RM15` | Traffic Circle Mandatory Direction Arrows | SARTSM Vol 1 §7.2.19 | *prose only — read for sense* |
| ☐ | `RM2` | No Crossing Lines | SARTSM Vol 1 §7.2.6 | Two continuous solid white lines, each at least 100 mm wide. |
| ☐ | `RM4.1` | Left Edge Line | SARTSM Vol 1 §7.2.8; NRTR 2000 reg 298A(1)-(2), reg 298(1) proviso | A continuous solid yellow line at least 100 mm wide marking the left edge of the roadway.<br>On a road with one lane in each direction you may move onto the shoulder to let a faster vehicle pass, but only between sunrise and sunset, only if you endanger nobody, and only when people and vehicles are clearly discernible at least 150 m away.<br>The numbers get asked: yellow, minimum 100 mm, sunrise to sunset, 150 m visibility, and only while you are being overtaken.<br>Daylight + 150 m + being overtaken is the only time you may borrow it. |
| ☐ | `RM5` | Painted Island | SARTSM Vol 1 §7.2.9 | *prose only — read for sense* |
| ☐ | `RM6` | Parking Bays | SARTSM Vol 1 §7.2.10; NRTR 2000 reg 305 | A white line marking, at least 100 mm wide, defining the limits of a single parking bay.<br>A driver must park wholly within those lines, and where the bays are angled to the kerb, end up within 150 mm of the kerb line. |
| ☐ | `RM7` | Exclusive Parking Bay | SARTSM Vol 1 §7.2.11 (RM7, RM7.1) | A bay demarcated by a continuous solid yellow line on three sides, carrying an oval marking RM7.1 with a designatory letter. |
| ☐ | `RM8` | Mandatory Direction Arrows | SARTSM Vol 1 §7.2.12 | Yellow arrows (variants RM8.1 to RM8.6) marked in a lane on the approach to a junction. |
| ☐ | `RM9` | Exclusive Use Lane Line | SARTSM Vol 1 §7.2.13, §7.2.21 (RM17.1-RM17.4); NRTR 2000 reg 289 | A broken yellow line at least 150 mm wide, used together with an exclusive use symbol or word marking RM17 and the matching reservation sign.<br>The lane must end at least 20 m before a side road so turning traffic can cross it. |
| ☐ | `RTM1` | Stop line | SARTSM Vol 1 §7.2.1 (Stop Line RTM1), §2.2.1 (Stop sign R1); NRTR 2000 reg 286(2)(c)(i), reg 307 | *prose only — read for sense* |
| ☐ | `RTM2` | Yield line | SARTSM Vol 1 §7.2.2 (Yield Line RTM2), §2.2.2 (Yield sign R2); NRTR 2000 reg 286(2)(c)(ii) | *prose only — read for sense* |
| ☐ | `RTM3` | Pedestrian crossing lines | SARTSM Vol 1 §7.2.3 (Pedestrian Crossing Lines RTM3); NRTR 2000 reg 315(2), reg 315(4), reg 1 definition | *prose only — read for sense* |
| ☐ | `RTM4` | Block pedestrian crossing | SARTSM Vol 1 §7.2.4 (Block Pedestrian Crossing Markings RTM4), §2.2.3 (R2.1); NRTR 2000 reg 286(2)(c)(iii), reg 315 | *prose only — read for sense* |

## Road signs approved on an AI pass, 2026-08-04 — serving now, human read still owed

These five are **live to learners** (`review_status: 'approved'`, `approved_by: 'ai:claude-code'`),
unlike everything above, which is still `draft`. They were approved because the alternative was
worse: R1 is the standard STOP sign and was invisible in the library while R1.1 — the doubled urban
variant — served in its place captioned "This is the stop sign", and two approved in-exam questions
pointed at R1 with no lesson to send a learner to.

Sources were read page-by-page and quoted in
`scripts/data-repairs/stop-and-countdown-content-2026-08-04.json`. **Two substantive errors were
found and corrected in that pass, not transcribed** — so this is a real verification, but it is an
AI one, and constraint 9 is not satisfied until a human reads each against the provision.

| ✓ | Code | Object | Cites | Check |
|---|---|---|---|---|
| ☐ | `R1` | Stop | SADC RTSM Vol 1 §2.2.1 ¶1 (`resources/sartsm/V1C2.pdf`) | Behind the stop line if there is one; **front end in line with the sign** if there is not — the previous text said "before the intersection", which appears in no source.<br>A stop line marked but not visible is treated as no stop line. |
| ☐ | `R1.1` | Stop (additional low-mounted sign) | SADC RTSM Vol 1 §2.2.1 ¶2(a) | Urban use where a narrow footpath, other signs or vegetation restrict visibility of the standard sign; an extra STOP sign on the same support; **same mandatory requirements as R1**. Renamed — the chart prints both R1 and R1.1 as "Stop sign", unusable as a learner label. |
| ☐ | `IN1` | Countdown marker (100 m) | SADC RTSM Vol 1 §5.2.1 ¶1–3 (`V1C5.pdf`); Vol 4 §9.2.1 colour plate (`V4C9.pdf`) | 100 m from a high-speed exit; one bar; set of three with IN3 furthest out; bars **slope down to the right**; background **blue, green or brown** — the previous text taught "blue" as definitional. |
| ☐ | `IN2` | Countdown marker (200 m) | as IN1 | 200 m; two bars. |
| ☐ | `IN3` | Countdown marker (300 m) | as IN1 | 300 m; three bars; **furthest from the exit** — the counter-intuitive fact the set turns on. |

> **Extraction trap, recorded so it is not repeated.** `pdftotext -layout` on `V4C9.pdf` prints the
> CUL-DE-SAC colour block (green background, red and white symbol) directly under the COUNTDOWN
> heading, because the two-column landscape pages interleave. Read these volumes page-by-page with
> `-f`/`-l` before quoting a colour. The naive extraction says countdown signs are green; they are
> not.

## Question citations backfilled 2026-08-04 — 7 flagged items need a decision, not a review

`scripts/data-repairs/question-citations-2026-08-04.json` took the approved bank from **232 of
274** carrying a `source_citation` to **267 of 274**. Every citation was read out of `resources/`
and the governing sentence quoted in the repair file's `why` field.

That closes the blocking half of the problem: a question with no citation cannot be verified at
all, because there is nothing to check it *against*. These 35 are now reviewable. They are **not**
verified — `verified_at` and `approved_by` were deliberately left alone.

### ✅ RESOLVED — the seven uncitable questions stay, as a recorded exception (John, 2026-08-04)

Withdrawn and **restored the same day**. Both steps are kept as a pair —
`withdraw-uncitable-controls-2026-08-04.json`, then
`restore-uncitable-controls-2026-08-04.json` — because the reasoning is the useful part.

| Q | Objective | Topic |
|---|---|---|
| `q-controls-5` | `VC10` | Dashboard warning lights |
| `VC-012`, `VC-026` | `VC11` | Head restraint position and purpose |
| `VC-024` | `VC13` | Demister |
| `VC-030`, `VC-011` | `VC17` | ABS — what it preserves, how to brake with it |
| `VC-016` | `VC22` | Completing motorcycle braking before a turn — **Code A only** |

**Nothing in `resources/` covers any of it.** Checked against the Vehicle Controls manual's
numbered control lists (§1.2, §2.2, §2.5, §2.8), all three of its sample-question banks, and the
consolidated NRTR; an independent three-model review agreed unanimously that none is citable.

**The ruling: the content is fine and reasonable, and losing correct teaching over an absent
citation is the worse trade.** That was always the narrow question — the withdrawal file itself said
none of the seven was believed to state anything false. Constraint 9 is about provenance, and where
the material is plainly standard vehicle knowledge (what a demister does, that ABS lets you steer)
the rule was judged to be costing more than it protected.

Three things keep the exception **visible instead of silent**:

1. **`source_basis = 'uncited_general_knowledge'`** on all seven — one honest label for one
   exception class, greppable as a set. It replaces **six false `official_manual` claims** the
   citation pass disproved, and `VC-016`'s `generated_from_syllabus`, disproved by the same search.
   Treat `source_basis` generally as a claim to check, not a provenance record: it was self-assigned
   at drafting time.
2. **`source_citation` stays NULL.** Do not backfill it with prose. Null is the true statement, and
   `source_citation is null` is the query that returns exactly these seven.
3. **The bank is 267/274 cited, not 274/274.** Anyone quoting full citation coverage is wrong.

#### Two live caveats on the restored set

⚠️ **`q-controls-5` has an unresolved content defect**, independent of the citation question. Its
keyed answer — "Something needs attention — check before driving" — **understates a red
oil-pressure or brake lamp, which means stop and do not drive.** Flagged by an independent
reviewer. Rewrite the answer before this question is ever human-signed-off.

⚠️ **`VC-016` is motorcycle-specific** and correctly tagged `vehicle_codes: ['A']`, so it is **not in
the Code B mock pool** and no car learner can be served it. Since only Code B papers are built
(Code A/C deferred — K53-7), it is approved but **unreachable by any live paper**; it begins serving
the day a Code A paper ships. Five other approved questions are in the same position — `VC-010`,
`VC-027`, `VC-028`, `VC-029` and `RR-062`. Worth re-reading as a group before Code A launches, since
none of them has ever been served to a learner.

#### ✅ `q-controls-5` rewritten (John's wording, 2026-08-04)

`scripts/data-repairs/fix-q-controls-5-2026-08-04.json`. The defect was severity, not correctness —
it keyed *"check before driving"* for a **red** light, when the convention is **red = stop, amber =
check**. It now asks what to *do* and teaches that rule, with plausible distractors replacing
"you must drive faster to clear it". Still `uncited_general_knowledge`, still `verified_at` null —
rewriting it did not make it citable.

### ✅ FIXED — the free readiness test now shuffles options (2026-08-04)

Found while fixing `q-controls-5`. `assemblePaper` had always shuffled option order per sitting,
so the **mock exam was never affected**. Nothing else did: `readiness-sample.ts` shuffled *which*
questions were drawn and their order but never touched `options`, so on the free test **every
learner saw every option in the same position, every time.**

Two things that cost:

- The rotation only ever changed *which* questions appeared. A retake met the same answer in the
  same slot, so re-answering could be recall of position rather than of the rule — defeating half
  the reason the slice rotates at all.
- Answer-index distribution across the 274 approved three-option questions is **101 / 96 / 77**.
  On an unshuffled surface that bias is directly guessable, and "always pick the first" beat chance.

Both undercut the readiness score, which is the number shown to parents and the product's stated
differentiator.

**Fix:** `shuffle` and `shuffleOptions` moved to `src/lib/shuffle.ts` — `exam.ts` and
`readiness-sample.ts` had each grown their own identical Fisher–Yates — and
`sampleReadinessQuestions` now maps `shuffleOptions` over both its return paths. Four tests cover
it, including that `answer` still points at the correct option *text* after the remap, which is the
way this breaks silently. Verified in a browser: the same question rendered in different option
orders across repeated loads.

✅ **Practice mode now shuffles too** (2026-08-04, same day). Applied in `getPracticeQuestions`
rather than the three practice pages, which are otherwise identical and would each have needed the
same line. Question ORDER stays `sort_order` — practice is a walk through a topic, not a random
draw. All three practice routes build as `ƒ` (server-rendered per request), so the shuffle is fresh
per visit rather than baked in at build time; verified in a browser across repeated loads.

⚠️ **`VC20` is a control lesson with no question at all.** Pre-existing, unrelated to this episode.
It is the reverse of the orphan the Stage 1 gate measures (questions with no lesson, which is clean
at 274/274), so it is a content gap rather than a gate failure.
### ⚠️ Thirteen citations are partial — the source supports the item but not the keyed answer

Each carries a `NOTE FOR THE HUMAN VERIFIER` in its repair-file `why`. **Read these first — they
are where a wrong answer is most likely to be hiding.** The first six came from the original pass;
the last seven were added after a three-model adversarial review whose strongest finding was that
composite keyed answers had been backfilled with a citation instead of flagged.

| Q | What the source establishes | What it does **not** |
|---|---|---|
| `RR-054` | The gap "shall be increased" in rain | Any figure — "four seconds" is not in the source |
| `RR-055` | Increase the gap in poor visibility | When to switch headlights on in fog |
| `RR-040` | Mirrors → signal → move | The full five-step order as keyed |
| `RR-041` | You must not change lane unless it is safe | The term "blind spot" appears in **neither manual** |
| `RR-042` | A signal must last long enough to warn | That it must be cancelled afterwards |
| `RR-050` | Green means "go if it is safe" | A distinct "do not enter an intersection you cannot clear" rule |
| `RR-038` | Reg 308(1)(b)'s qualitative duty | The **two-second** figure — that is manual-only, same split as `RR-054` |
| `RR-056` | Reg 292's speed limits | That they are ceilings for good conditions, or any weather-reduction duty |
| `RR-057` | Wet ⇒ longer braking; therefore bigger gap | That tyres have **less grip** — the mechanism the question turns on |
| `RR-047` | Indicators compulsory when turning | That leaving a mini-circle exit counts as such a turn |
| `RR-052` | Amber ⇒ stop unless unsafe | *How* to brake — "firmly but under control" is unsourced |
| `VC-018` | The mirrors show rear and sides | "a direct look over your shoulder" — same gap as `RR-041` |
| `VC-025` | Belt duty while "operated on a public road" | The keyed timing "before the vehicle moves off" |
| `VC-032` | An automatic has no clutch | That it "selects gears itself" |
| `q-controls-2` | Clutch + gear lever change gear | "disconnecting the engine from the **wheels**" (source says gearbox) |
| `VC-001` | Parking brake may double as emergency brake | That the service brake is *the* emergency-stop control, or the "if it fails" fallback prose |

### ⚠️ Currency — regs 149 and 213 were amended AFTER our consolidated copy

The consolidated NRTR in `resources/legislation/` runs to **GNR.209 of 9 Mar 2012**. Two cited
regulations were amended by **GNR.846, GG 38142, 31 Oct 2014**, which is a *later* consolidation
than that file:

- **Reg 149 was substituted in full** (r. 41). The proviso we rely on survives verbatim, but the
  excluded-vehicle list changed — "motor quadrucycle" was dropped and (b)(iii) became "a tractor or
  haulage tractor". **The first pass quoted the superseded wording.** Corrected.
- **Reg 213 was amended** (r. 52) to add the infant definition (1)(c) and the infant-restraint duty
  (6A). Subregs **(4) and (11), which we cite, are untouched.**

This is the trap in `resources/README.md` — *"the 2000 original is not the law in force"* — reaching
one consolidation further forward than expected. **Before citing any regulation, check
`nrtr-amendment-2014-gg38142-gnr846.pdf` as well as the consolidated copy.** Regs 292, 304, 308 and
315 are not mentioned in either 2014 instrument.

> **A verification tool produced a confident, wrong citation — recorded because it is the exact
> failure constraint 9 exists to prevent.** In the adversarial review, one model raised its only
> HIGH claiming reg 304 governs leaving a vehicle unattended and that the stopping prohibitions are
> in reg 305. The consolidated text refutes it outright: **reg 304 *is* "Stopping of vehicles"**, and
> **304(h)** is verbatim the cited rule — no stopping "within nine metres of his or her approaching
> side of a pedestrian crossing demarcated by appropriate road traffic signs". Reg 305 is "Parking
> of vehicles". It cited from recall and inverted the two. Never take a model's regulation number
> without opening the text.

> **Extraction trap, recorded so it is not repeated.** `RS-019` asks the shape of an information
> sign. The obvious place to check is the SA Learner Driver Manual §2 classification table — and
> the answer is **not there**. The table gives Round / Triangular / Rectangular for regulatory,
> warning and guidance signs, then leaves the ORDINARY SHAPE cell **blank** for information signs,
> road markings and traffic signals. That blank is in the document, not in the extraction; it was
> confirmed by re-extracting page 3 alone. The citation is the DoT chart instead. Do not record the
> manual as the source for this fact.

## Already machine-checked — do not repeat

- **All 43 objects carry a source citation.** None asserts a rule without naming the provision.
- **No dangling cross-references.** Every `relatedRules` / `relatedControls` code resolves.
- **Sign↔marking links are reciprocal** — both rows name each other.

None of that tells you whether the cited provision *says what the object claims*. That is the human pass.
