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
| **2. Draft** | National Road Traffic Act 93 of 1996 + regulations; official DoT sign chart (`init/RTSigns_charts.pdf`) | our own rule explanations | ✅ these are the only sources |
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

## Next

1. Write the ❌ and ◐ rule objects from the Act, extending `RR11`+.
2. Give every rule a stable code so questions can point at it (K53-28's learning-objective ask).
3. Re-run this checklist and confirm no ❌ remain in Volumes 1–4.
