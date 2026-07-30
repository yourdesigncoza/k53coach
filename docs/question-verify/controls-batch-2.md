# Adversarial review — controls batch c2 (8 questions)

Grep sweep run against `nrta.txt` + `nrtr.txt` for: demister/de-mist/condensation, wiper,
parking brake / hand brake / handbrake / parkeerrem, head restraint / headrest / kopstut /
whiplash, anti-lock / ABS, seatbelt / safety belt, rearview mirror, motor cycle brakes.

**Zero hits for `head restraint`, `headrest`, `whiplash`, `demister`, `anti-lock`/`ABS`.**
There is no South African statutory provision on head-restraint height, on demisting, or on
ABS braking technique. Any explanation that framed those as legal requirements would be
UNSUPPORTED — none in this batch does, which is the right outcome.

---

#### VC-009 — SOUND
citation: none — vehicle operation, not law. (Reg 203 does corroborate the explanation's side-claim about wipers.)
quote: "203. No person shall operate on a public road a motor vehicle with a windscreen which is not fitted with at least one windscreen wiper which shall be capable of operation by other than manual means and shall, when in operation, wipe **the outside** of the windscreen directly in front of the driver, continuously, evenly and adequately" (NRTR reg 203)
note: Key is right, both distractors are genuinely wrong, and the explanation's "the wipers clear the outside" is literally what reg 203 says. No number asserted. Nothing to break.

#### q-controls-1 — SOUND (metadata defect)
citation: none — vehicle operation, not law
issue: Not a content defect, but `vehicle_codes` is tagged `A/B/C/EB` while the options and the explanation are car-only — a motorcycle (code A) has no clutch *pedal* and no "middle pedal", so the parenthetical "(usually the middle pedal in a manual car)" does not describe a code-A vehicle. Answer still holds for A (rear brake pedal). Recommend narrowing to `B/C/EB` or dropping the parenthetical. Also note the stem's word "pedal" is what disqualifies distractor 3 ("Handbrake button") — the item depends entirely on that one word, so do not reword the stem to "control".

#### VC-010 — SOUND
citation: NRTR reg 150 (equipment provision, supports the two-system premise — it does **not** legislate stopping technique)
quote: "150. No person shall operate on a public road a motor cycle, motor tricycle or motor quadrucycle which is not equipped with two independent braking systems, one of which shall act on the front wheel or wheels and the other which shall act on the rear wheel or wheels ... and when the two systems are applied simultaneously, the combined efficiency shall be at least equivalent to that specified for a service brake."
note: Attacked the key from three angles — front-only (loses the rear system's contribution; reg 150 sets the combined standard), clutch-only (declutching removes engine braking, it does not brake), and "you must also declutch to avoid stalling" (true, but not offered and not a braking action). Key survives. `source_basis: official_manual` is the honest tag here; the reg is corroboration, not the source.

#### q-controls-2 — SOUND
citation: none — vehicle mechanics, not law
note: "disconnecting the engine from the wheels" is a simplification (the clutch sits between engine and gearbox), but the driven wheels are in fact disconnected while it is depressed, so the statement is not false. The clutch is also used to move off and to control creep — the stem's "what is the clutch used for" is broad enough that a fuller key would be better, but no distractor covers those uses, so there is no second defensible option. All three distractors are unambiguously wrong.

#### VC-011 — SOUND (wording flag)
citation: none — braking technique, not law. **No ABS provision exists in the NRTR** (zero hits for anti-lock/ABS); reg 155 sets braking *performance* standards only, nothing about pedal technique.
note: Key and both distractors are correct as scored — pumping is the *non*-ABS cadence technique and is wrong for an ABS car, and the handbrake acts on the rear wheels only. One imprecision worth a copy-edit: "Pumping defeats ABS" is loose — ABS is not disabled by pumping; releasing the pedal simply removes the pressure ABS needs to modulate, lengthening the stop. Suggest "Pumping wastes braking distance — ABS already does the modulating for you." Not scored as a defect because the claim is directionally true and is standard driver-training phrasing, but it is the only soft spot in this item.

#### VC-012 — SOUND
citation: none — no head-restraint provision exists anywhere in the NRTR or the NRTA (zero hits for head restraint / headrest / kopstut / whiplash)
note: This is the item I expected to break and could not. "Top roughly level with the top of your head" matches mainstream occupant-protection guidance, the word "roughly" pre-empts the usual quibble (top-of-ears vs top-of-head), and no number is asserted. Critically, the explanation says a removed restraint "offers little protection" — a *safety* claim — and does **not** claim removal is illegal, which would have been UNSUPPORTED. Both distractors are genuinely wrong. Leave as is.

#### q-controls-3 — SOUND (metadata defect)
citation: partial — the seatbelt element is law: NRTR reg 213(4). Seat and mirror adjustment are technique, not law.
quote: "213. (4) No adult shall occupy a seat in a motor vehicle operated on a public road which is fitted with a seatbelt unless such person wears such seatbelt: Provided that the provisions of this regulation do not apply while reversing or moving in or out of a parking bay or area." (Reg 204(1)(b) separately requires the vehicle to be *fitted* with a rearview mirror "enabling the driver ... to see in clear weather a clear reflection of traffic to the rear", but says nothing about adjusting it.)
issue: `objective_code` is `VC11`, the same code as VC-012 (head restraint) — two different topics pointing at one learning object. One of them is mis-mapped; fix before objective-code coverage is measured. Content itself survives: the stem says "the first thing", and although the key bundles three actions, no distractor is defensible (starting the engine, selecting fifth, or the radio are all wrong regardless of ordering), so it is not AMBIGUOUS.

#### q-controls-4 — SOUND
citation: NRTR definition of "parking brake" + reg 155(1)(c) (both support the *parked* half only; the hill-start half is K53 technique, not law)
quote: "'parking brake' means a brake, normally a hand brake, used in the ordinary course of events to keep a vehicle stationary" (NRTR reg 1, definitions) — and "155. (1) ... (c) a parking brake, unless such brake, at all times, is capable of keeping such vehicle or combination stationary for an indefinite period with the engine disengaged on a gradient of not more than one in 8,33."
note: Attacked distractor 3 ("Never — it is only for emergencies") hardest, because reg 149(a) says "the emergency brake and parking brake may be one and the same brake" — so there is a sense in which the handbrake *is* the emergency brake. But the option is self-refuting ("Never ... only for emergencies") and its "never" clause is flatly contradicted by the definition above, which makes keeping the vehicle stationary the brake's ordinary-course purpose. Distractor stays wrong; key stays best. No fabricated number — note that if this item is ever extended with a gradient figure, the only real one is **1 in 8,33** from reg 155(1)(c).

---

SOUND 8 | EXPLANATION_DEFECT 0 | AMBIGUOUS 0 | WRONG_ANSWER 0 | UNSUPPORTED 0 | CITATION_NONE 5

(CITATION_NONE = VC-009, q-controls-1, q-controls-2, VC-011, VC-012. The three with real
provisions are VC-010 → reg 150, q-controls-3 → reg 213(4), q-controls-4 → reg 1 definition +
reg 155(1)(c). In all three the provision is *corroborating equipment/wearing law*, not the
source of the driving technique being tested — tag them accordingly and do not let a
`source_citation` field imply the technique itself is statutory.)

## Cross-cutting notes for the batch

1. **No fabricated citations found, and no explanation in this batch asserts technique as law.** This is the clean outcome the "NRTA s 4(3)" incident was meant to prevent.
2. **No numbers asserted anywhere in the batch** — no distances, depths, masses, times, or percentages. Nothing to fabricate, nothing to verify. This is why the batch scores so well.
3. **No truncated explanations.** All eight terminate on a complete sentence.
4. **Two objective_code / vehicle_codes defects** (q-controls-1 over-scoped to code A; q-controls-3 and VC-012 share `VC11`). Both are metadata, not content, but both will corrupt coverage reporting if left.
5. **Option-count inconsistency:** the `VC-*` items have 3 options, the `q-controls-*` items have 4. Per the live-exam format finding (3 options), the four-option items are the odd ones out.
