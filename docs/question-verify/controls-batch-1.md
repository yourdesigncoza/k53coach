# Batch c1 — adversarial review (Vehicle Controls, VC-001 … VC-008)

#### VC-001 — EXPLANATION_DEFECT
citation: NRTR reg 149 proviso (a); NRTR reg 1 definitions of "service brake" and "emergency brake"
quote: "149. No person shall operate on a public road a motor vehicle … which is not equipped with a service brake, a parking brake and an emergency brake: Provided that— (a) the emergency brake and parking brake may be one and the same brake"
quote: "“emergency brake” means a brake, other than a service brake, which can stop a vehicle"
quote: "“service brake” means a brake, normally a footbrake, used in the ordinary course of events to reduce the speed of a vehicle or to stop the vehicle"
issue: Marked answer is right, but the explanation's claim that "The handbrake **only** keeps a stationary vehicle still" is false. Under reg 149(a) the parking brake may lawfully *be* the emergency brake, and an emergency brake is by definition "a brake … which can stop a vehicle". Fix to something like: "the handbrake is designed to hold a stationary vehicle and serves only as a back-up if the service brake fails — it is not the control for a normal emergency stop."

#### VC-002 — SOUND
citation: NRTR reg 308(1)(f); NRTR reg 1 definition of "parking brake"
quote: "“parking brake” means a brake, normally a hand brake, used in the ordinary course of events to keep a vehicle stationary"
quote: "308. (1) No person driving or having a vehicle on a public road shall— … (f) allow such vehicle to remain unattended on such road without setting its brake or adopting such other method as will effectively prevent the vehicle from moving from the position in which it is left"

#### VC-003 — SOUND
citation: none — control function, not law
issue: (non-blocking) "regulates the fuel supply to the engine" is the K53-manual simplification; on a modern EFI engine the pedal commands throttle/torque and the ECU meters fuel, and an EV has no fuel at all. Also `vehicle_codes` includes A (motor cycle), where the control is a twist-grip throttle, not "the accelerator". Neither breaks the item — no distractor is defensible — but the stem is mechanism-loose.

#### VC-004 — SOUND
citation: none — transmission design, not law
issue: (non-blocking) survives only because the stem and both other options say clutch *control*. An automatic (DCT/AMT) does contain clutches; it has no driver-operated clutch control. Do not loosen the wording to "does not have a clutch".

#### VC-005 — SOUND
citation: none — driving technique, not law

#### VC-006 — SOUND
citation: none — K53 observation technique, not law. Nothing in the NRTA or NRTR prescribes a mirror check before a manoeuvre; reg 308(1)(c)/(e) only require the driver to retain complete control and a full view. The explanation correctly attributes the rule to "the manual", not to law — leave that attribution in place.

#### VC-007 — SOUND
citation: NRTR reg 326(1)(a); NRTR reg 1 definition of "direction indicator"
quote: "326. (1) (a) The driver of a vehicle which is fitted with direction indicators in terms of the provisions of regulations 193 to 199 shall signal his or her intention to turn or move to the left or right by operating the direction indicator on the left or right side, as the case may be, of the vehicle."
quote: "“direction indicator” means a device fitted to a motor vehicle for the purpose of enabling the driver of such motor vehicle to intimate his or her intention to change the direction of travel of such motor vehicle to the right or to the left"

#### VC-008 — SOUND
citation: NRTR reg 203
quote: "203. No person shall operate on a public road a motor vehicle with a windscreen which is not fitted with at least one windscreen wiper which shall be capable of operation by other than manual means and shall, when in operation, wipe the **outside** of the windscreen directly in front of the driver, continuously, evenly and adequately"

---

## Cross-cutting checks

- **Objective codes all resolve correctly** against `src/content/vehicle-controls.ts` (VC1–VC22 exist): VC2 Accelerator, VC3 Footbrake, VC4 Clutch, VC5 Gear lever, VC6 Handbrake, VC7 Indicators, VC12 Windscreen wipers and washers, VC16 Mirrors. No orphaned codes in this batch.
- **No fabricated citations.** Every provision above was grepped verbatim from `nrtr.txt`. No item in this batch asserts a number (distance, depth, mass, time, percentage), so there is nothing of the "NRTA s 4(3)" class to inherit.
- **No foreign conventions** stated as South African law.
- **No truncated explanations.**
- **All 8 items are single-key with mutually exclusive distractors** — no distractor in this batch is independently true.

`SOUND 7 | EXPLANATION_DEFECT 1 | AMBIGUOUS 0 | WRONG_ANSWER 0 | UNSUPPORTED 0 | CITATION_NONE 4`
