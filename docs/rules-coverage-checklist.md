# Rules of the Road — coverage checklist (DB2 expansion)

**Purpose:** answer one question only — *have we covered every topic the learner's licence test
can ask about?* This file is a **checklist of topic labels**. It is not a source, and nothing here
is drafting material.

## Method — and the legal reason for it

Louwrens supplied a commercial study guide ("The Complete K53 Study Guide", 2026 Edition,
k-53.co.za, 78pp) on Linear **K53-31**. Commercial guides like it **are copyright**: the
underlying traffic law, road signs and rules are public domain, but the publisher's prose,
original illustrations, formatting and arrangement are protected. Rewording that book into our
database would still be copying it — AI in the middle changes nothing.

So we invert it. Three passes, strictly separated:

| Pass | Input | Output | May it touch a generation prompt? |
|---|---|---|---|
| **1. Extract** | the guide | bare topic labels (short noun phrases) | — |
| **2. Draft** | National Road Traffic Act 93 of 1996 + regulations; official DoT sign chart (`resources/charts/RTSigns_charts.pdf`) | our own rule explanations | ✅ these are the only sources |
| **3. Check** | this file | gap list → new work | ✅ labels only |

> **Hard guardrail.** The guide PDF, and any prose extracted from it, **must never be passed as
> context to `llmChat` or any drafting prompt.** That is where regurgitation of protected
> expression happens. Only the short topic labels below cross into the build. Never reproduce its
> illustrations, and never mirror its chapter arrangement in shipped navigation.

Government sources are safe under SA Copyright Act §12(8)(a) — the same basis already used for the
road-sign artwork (`docs/road-sign-assets.md`).

**Settled:** Louwrens does **not** own the guide and holds no licence to it, so the three-pass
method above is permanent, not provisional. The guide stays genuinely useful — as a map of what to
cover, never as text to draw from.

---

## Current state

- **Rule learning objects:** 10 (`src/content/road-rules.ts`, codes `RR1`–`RR10`)
- **Rules questions:** 41 of 125, across 12 `topic_tag` values
- **Target:** ~30 rule objects across Louwrens's four volumes (K53-31)

## The checklist

Topic universe = the guide's contents ∪ Louwrens's four volumes (K53-31) ∪ his 245 question stems
(K53-28). Status is against `road-rules.ts` and the question bank's `topic_tag`s.

Legend: **✅ have** (rule object exists) · **◐ partial** (questions exist, no rule object) ·
**❌ gap**

### Volume 1 — General rules

| Topic | Status | Anchor |
|---|---|---|
| General rules of the road | ❌ | — |
| Following distance | ✅ | `RR2` + 3 Q |
| Mirrors and blind spots | ✅ | `RR5` |
| Speed limits (general) | ✅ | `RR8` + 5 Q |
| Speed limits by licence code | ◐ | Q only (`vehicle_codes`) |
| Speed in poor conditions | ✅ | `RR10` |

### Volume 2 — Road position

| Topic | Status | Anchor |
|---|---|---|
| Overtaking | ✅ | `RR3` + 3 Q |
| Being overtaken | ❌ | — |
| Lane discipline | ❌ | — |
| Divided roads / dual carriageways | ❌ | — |
| Hand signals | ❌ | — |
| Driving signals (indicators) | ◐ | 2 Q ("Turning and Signals") |

### Volume 3 — Intersections

| Topic | Status | Anchor |
|---|---|---|
| Turning at intersections | ◐ | 2 Q |
| Four-way stops | ✅ | `RR1` |
| Right of way | ✅ | `RR6` + 4 Q |
| Mini-circles / traffic circles | ✅ | `RR6` |
| Traffic signals (robots) | ✅ | `RR7` + 2 Q |
| Parking rules | ✅ | `RR9` |
| Stopping rules | ✅ | `RR9` + 3 Q |
| Pedestrian right of way | ✅ | `RR4` + 2 Q |

### Volume 4 — Safety

| Topic | Status | Anchor |
|---|---|---|
| Vehicle lights | ◐ | 2 Q |
| Freeway rules | ❌ | — |
| Towing | ❌ | — |
| Hooter | ❌ | — |
| Seatbelts and helmets | ◐ | 2 Q |
| Alcohol and drug limits | ◐ | 4 Q |
| Accidents | ◐ | 3 Q ("Emergency Vehicles and Accidents") |
| Tyres | ❌ | — |
| Number plates | ❌ | — |
| Emergency rules | ◐ | shares the accidents tag |
| Driver documents / roadworthiness | ◐ | 3 Q |

### Beyond the four volumes — surfaced by the checklist

Topics the guide covers that Louwrens's volumes don't mention, and neither do we. Worth a scope
decision rather than silent omission:

| Topic | Status | Note |
|---|---|---|
| Road markings (RTM/RM series) | ❌ | **K53-30** — zero marking rows in `road_signs`; 3 Q only |
| Overhead lane direction signals | ❌ | K53-30 |
| Traffic officer hand signals | ❌ | K53-30 |
| Railway crossings | ❌ | K53-30 |
| Licence codes / code conversion | ❌ | Q bank has `vehicle_codes` but no learning content |
| Professional Driving Permit (PrDP) | ❌ | out of MVP scope? |
| Practical driving test (K53 yard/road) | ❌ | **deliberately deferred** — Phase 2 |
| Pre-trip inspection | ◐ | controls questions cover the cockpit drill |

## Tally

- **10 covered** by a rule object
- **12 partial** — questions exist but no learning object to send a weak learner to
- **~14 gaps** in the four volumes, plus 8 outside them

The partials matter more than they look: a learner who gets a lights or towing question wrong has
nowhere to be sent, which breaks the "here's your exact next lesson" promise the landing page
makes.

---

## Objective-code coverage (measured 2026-07-24)

`questions.objective_code` links each question to the lesson a learner is sent to when they get it
wrong. After the first backfill pass:

| Topic | Mapped | Total | Blocking gap |
|---|---|---|---|
| Signs | **35** | 47 | 12 unmapped — all need **new content**, not lookups (see below) |
| Rules | **41** | 41 | ✅ none — `RR11`–`RR26` written 2026-07-24 |
| Controls | **37** | 37 | ✅ none — `VC12`–`VC22` written 2026-07-24 |
| **Total** | **113** | **125** | **90%, from 21% this morning** |

Nine of the "unmapped signs" turned out not to be a content gap at all — they were questions about
signs already in the library that had simply never been given a code (minimum speed → `R101`,
one-way → `R4.1`, no left turn → `R211`, width limit → `R239`, goods vehicles → `R229`, turn left
ahead → `R108`, keep left → `R103`, railway crossings → `W318`). Check for an existing lesson
before writing a new one.

**The last 12 genuinely need new content:**

| Group | Count | Needs |
|---|---|---|
| Guidance / information signs | 5 | Green direction signs, `P` parking, `H` hospital, freeway countdown markers — the library has 26 guidance rows and none of these |
| Traffic signals | 2 | A signals learning object (flashing red, steady amber) — client confirmed signals are in scope |
| Sign colour code / shapes | 3 | Conceptual lessons ("what does a yellow diamond mean", "what shape is an information sign") with no single sign to point at |
| Road markings | 2 | `WM3` dividing line and a yield-control marking — the **warning (WM)** series, §7.3 |

Mapping was **deliberately conservative**: a question is linked only where a learning object
genuinely covers its topic. Pointing a learner at an approximate lesson is worse than pointing them
at none — it burns the "here's your exact next lesson" promise on a wrong answer.

### ✅ Closed 2026-07-24 — rules `RR11`–`RR26`, controls `VC12`–`VC22`

27 learning objects written from the National Road Traffic Act 93 of 1996 and the National Road
Traffic Regulations, 2000, by a 6-agent research team. Every object carries the provision it rests
on as a source comment. All ship as `reviewStatus: "draft"`.

| New rules | | New controls | |
|---|---|---|---|
| `RR11` Alcohol and drug limits | `RR19` Keep left, pass right | `VC12` Wipers and washers | `VC18` Moto: throttle |
| `RR12` Seatbelts and child restraints | `RR20` When someone overtakes you | `VC13` Demister and defroster | `VC19` Moto: front brake |
| `RR13` Licence and documents | `RR21` Divided roads | `VC14` Hazard warning lights | `VC20` Moto: rear brake |
| `RR14` Use of the hooter | `RR22` Freeway rules | `VC15` Brake lights | `VC21` Moto: clutch and gears |
| `RR15` Tyres and tread depth | `RR23` Hand signals | `VC16` Mirrors | `VC22` Moto: controlled stop |
| `RR16` Plates, disc, roadworthiness | `RR24` Emergency vehicles | `VC17` ABS | |
| `RR17` Towing a trailer | `RR25` After an accident | | |
| `RR18` When your lights must be on | `RR26` Turning at intersections | | |

New taxonomy: `RuleCategory` gained `driver-fitness`, `vehicle-fitness`, `lights`, `freeways`,
`emergencies`, `safety`; `ControlCategory` gained `visibility`, `motorcycle`. The motorcycle set
also unblocks Code A papers (K53-7).

### ⚠️ Flagged for human verification before `reviewStatus` leaves draft

The research pass was explicitly instructed to flag rather than guess. Three items came back
short of primary-source confirmation:

| Item | Issue |
|---|---|
| **`RR22` — learners on freeways** | The pass found **no national provision** barring a learner-licence holder from a freeway; reg 323(1) bans vehicle *types*, not licence classes. This contradicts common belief, so the object deliberately teaches it **neither way**. Resolve before any exam question is written on it. |
| `RR12` — infant restraint rule | Reg 213(6A) (under-3s, approved restraint) is not in the consolidated regulations text; confirmed only from two secondary sources quoting GN R846, GG 38142. Check the gazette. |
| `VC20` — feet on foot-rests | Reg 309 confirmed from two consistent secondary SA sources, not the primary gazette text. |

Two claims were correctly *withheld* as unsupported and should stay withheld: there is no statutory
**minimum speed** on a freeway (only where a sign imposes one), and no regulation requires dipping
headlights for a vehicle you are **following** (reg 157(3) covers oncoming traffic only) — `RR18`
presents that as courtesy, not law.

---

## ✅ Road markings — regulatory series written 2026-07-24 (K53-30)

**16 markings** now exist in `road_signs` under `category='marking'` (was zero). Written from the
official **SADC/SA Road Traffic Signs Manual Vol 1 Chapter 7 (May 2012)** — an official government
text, so a permitted *source*, not merely a checklist.

| Transverse (RTM) | Longitudinal | Parking / lanes | Restrictions |
|---|---|---|---|
| `RTM1` Stop line | `RM1` No overtaking line | `RM6` Parking bays | `RM10` Box junction |
| `RTM2` Yield line | `RM2` No crossing lines | `RM7` Exclusive parking bay | `RM12` No stopping line |
| `RTM3` Pedestrian crossing lines | `RM4.1` Left edge line | `RM9` Exclusive use lane line | `RM13` No parking line |
| `RTM4` Block pedestrian crossing | `RM5` Painted island · `RM8` Mandatory direction arrows · `RM15` Traffic circle arrows | | |

**Sign ↔ marking linking is live in both directions** (the client's core ask): R1↔RTM1,
R2↔RTM2/RTM4, R216↔RM13, R217↔RM12, and RTM3 to both R1 and R2.

**Both gates are deliberately closed** — `asset_status='needs_review'` (no artwork exists;
markings are road-surface diagrams with no public-domain SVG set, so each must be drawn and
chart-verified) and `review_status='draft'` (AI-drafted, pending human verification). They are
therefore invisible to learners until approved. Seed script:
`scripts/signs/markings/seed-markings.mjs`.

### Errors found in the client's supplied list

His descriptions came from an unreliable source; the manual contradicts six of them:

| Client said | Manual says |
|---|---|
| `RM8` arrows are **white** | **Yellow** (§7.2.12.2) — a likely exam question |
| `RM14` is a bus/tram/bicycle lane | `RM14` is the **No Motor Cycles** marking (§7.2.18). Reserved lanes are `RM9` + `RM17` symbols; there is no RM9/RM14 pairing |
| `RM10` box junction = "may not stop on it" | "May not **enter** if stationary vehicles ahead mean you cannot leave — **except** vehicles turning left or right may enter" (§7.2.14) |
| `RM7` letters: A B L T F P D CD MB SOS | Omitted **R (Rickshaw)** — full set is A B L T F R CD MB SOS D P |
| `RM5` painted island has three exceptions | **Two** only: traffic officer's direction, emergency (§7.2.9.1). "Avoid a collision" is not separate |
| `RM12` "except in an emergency" | No such exception in §7.2.16; the real ones sit in NRTR reg 304. Left out of learner prose |
| `RTM3` = "white stripes" | **Two continuous white lines** forming a corridor (§7.2.3.2); the striped look is `RTM4` |
| `RTM4` = "raised" block pattern | **Flat** painted rectangles (§7.2.4.2) |

### 🐛 Fixed in passing — 13 live signs had corrupted names

Found while searching for codes to map. Thirteen `W4xx` hazard-marker signs carried leaked wiki
markup in `name` — `'alt=|Railway crossing'`, `'alt=|Sharp curve marker'`, and four that were
**just `'alt='` with no name at all**. Every one was `asset_status='approved'` **and**
`review_status='approved'`, so all thirteen were being served to learners.

Repaired from `data/chart-authority.json` (the official DoT chart, our ground truth) rather than
invented: W401/W402 Danger plate, W403 Railway crossing, W404 Railway crossing with two or more
tracks, W405–W408 Sharp curve chevron, W409 T-junction chevron, W410 Dead end or road closed
chevron, W411 Boom barricade, W413 Gore plate, W415 Overhead danger plate.

**A full sweep was then run** across all 361 served rows for wiki artefacts (`[[links]]`,
`{{templates}}`, `alt=`, `thumb|`, `NNpx|`) in both `name` and every `content.*` field. It found
exactly **one** more: `R403` was named `'[[Woonerf|Living Street / Woonerf]] begins'`, now
"Living street (Woonerf) begins". Zero artefacts remain across all 362 rows.

A first pass with a looser pattern reported 347 hits — that was a false alarm from over-broad
matching, caught by inspecting actual rows before reporting it. If you re-run this check, assert on
the *matched substring*, not just on whether the pattern fired.

**The real lesson:** thirteen rows carried visibly broken names while sitting at
`asset_status='approved'` AND `review_status='approved'`. The two-gate approval was designed to
catch content accuracy, and it did not catch a missing name — worth a cheap
"name is non-empty and artefact-free" assertion in the ingest before a row can reach approved.

### 🎨 Artwork — waiting on the client (John, 2026-07-24)

**Decision: do not draw or generate the marking artwork in-house.** Louwrens supplies it.

This was considered and declined. Road markings are geometric (lines, gaps, hatching, blocks,
arrows) and the SARTSM chapter gives exact dimensions — 100 mm line widths, 600 mm line / 300 mm
gap on the yield line, 2,4 m block spacing — so they *could* be rendered deterministically from the
spec. John's call is to wait for the client instead. **Do not re-propose the generator.**

Consequence, so nobody reads it as a bug: all 16 markings stay `asset_status='needs_review'`, keep
their grey placeholder in the admin exceptions queue, and stay invisible to learners. The written
content is complete; only the artwork gate is open.

AI-generated artwork remains rejected — see the errors found in the client's infographics above.

### Still outstanding for markings

- **Warning markings (`WM1`–`WM11`)** and **guidance markings (`GM1`–`GM8`)** — §7.3 and §7.4.
  Two of the three road-marking questions still can't be mapped without them (`RS-038` needs `WM3`
  dividing line, `RS-039` needs a yield-control marking).
- **Artwork** for all 16, plus railway crossings, traffic signals, overhead lane signals and
  traffic officer hand signals (the client confirmed all four are in scope).
- Human verification pass to open `review_status`.

## Next

1. ~~Write the ❌ and ◐ rule objects from the Act, extending `RR11`+.~~ ✅ done
2. ~~Write the missing control objects, extending `VC12`+.~~ ✅ done
3. ~~Re-run the objective-code backfill.~~ ✅ rules and controls at 100%
4. Write the `WM` and `GM` marking series, then map the last signs questions.
5. Draw and chart-verify the marking artwork; run the human review pass.
