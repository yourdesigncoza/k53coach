import {
  Bike,
  Cog,
  Disc3,
  Eye,
  Gauge,
  Lightbulb,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { ControlCategory, VehicleControl } from "@/lib/types";

/**
 * Sample Vehicle Controls library (DB3).
 *
 * Content moat rule (PRD-additions §3): every entry is written ORIGINALLY.
 * Starter set for the MVP; instructor-reviewed before launch.
 */
export const CONTROL_CATEGORY_META: Record<
  ControlCategory,
  { label: string; icon: LucideIcon }
> = {
  primary: { label: "Primary controls", icon: Disc3 },
  transmission: { label: "Gears & handbrake", icon: Cog },
  signals: { label: "Signals & visibility", icon: Lightbulb },
  instruments: { label: "Instruments", icon: Gauge },
  "pre-drive": { label: "Before you drive", icon: SlidersHorizontal },
  visibility: { label: "Seeing & being seen", icon: Eye },
  motorcycle: { label: "Motorcycle controls", icon: Bike },
};

export const VEHICLE_CONTROLS: VehicleControl[] = [
  // ── VC1-VC17: Code B (car) ──────────────────────────────────────────────
  // Grounded 2026-08-03 against resources/legislation/ (NRTR consolidated to
  // GNR.209 of 2012) and re-checked against the 2014 amendment (GNR.846, in force
  // 31 Oct 2014), which SUBSTITUTES reg 149 and amends regs 159, 169, 201, 213 and
  // 215 — every regulation cited below. Each was read in the amended text; the
  // operative words relied on here are unchanged. Do not re-cite the 2000 original.
  //
  // Where a lesson teaches operating technique, there is NO regulation behind it and
  // the citation says so. "no legal claim" is a verified finding, not a gap — writing
  // a plausible-looking reg number against a technique claim is the failure this pass
  // exists to prevent. Naming/scope facts come from the DoT learner-driver manual
  // (resources/manuals/, June 2012), which examines 11 numbered car controls and
  // carries no explanatory prose — see COCKPIT_CALLOUTS at the foot of this file.
  //
  // reviewStatus "reviewed" = grounded and currency-checked, NOT human-approved.
  // Only a named human may set "approved" (CLAUDE.md constraint 9).

  // Source: technique — no legal claim. No regulation prescribes a hand position or
  //   steering method. Adjacent vehicle-condition duty: reg 200(1)(a) — all parts of
  //   the steering gear "maintained in a condition which enables the vehicle to be
  //   steered safely and efficiently"; reg 200(1)(b) caps free play at 45 degrees.
  {
    code: "VC1",
    name: "Steering wheel",
    category: "primary",
    summary: "Steers the car — hold it at the 'quarter to three' position.",
    whatItDoes:
      "Turns the front wheels to point the car where you want to go.",
    howToUse:
      "Hold with both hands at roughly the 9 and 3 o'clock positions, feed the wheel through your hands smoothly, and look where you want to go.",
    commonMistake:
      "Crossing your arms or steering with one hand, which reduces control.",
    testHint:
      "Examiners watch for smooth, controlled steering and both hands on the wheel.",
    relatedControls: ["VC2", "VC3"],
    reviewStatus: "reviewed",
  },

  // Source: technique — no legal claim. No regulation governs accelerator use.
  {
    code: "VC2",
    name: "Accelerator",
    category: "primary",
    summary: "The right-hand pedal — controls how much power reaches the engine.",
    whatItDoes:
      "Increases engine power to make the car speed up or hold speed.",
    howToUse:
      "Press gently and progressively with your right foot. Ease off smoothly rather than lifting suddenly.",
    commonMistake:
      "Stabbing the accelerator, causing jerky, fuel-wasting driving.",
    testHint:
      "Smooth acceleration shows control; over-revving counts against you.",
    relatedControls: ["VC3", "VC4"],
    reviewStatus: "reviewed",
  },

  // Source: NRTR reg 149 — a motor vehicle must be equipped with "a service brake, a
  //   parking brake and an emergency brake" (substituted by GNR.846 of 2014; the
  //   substituted text is materially identical for a motor car). reg 156(1)(a) — a
  //   required brake shall "be in good working order and condition whenever the vehicle
  //   to which it is fitted is operated on a public road". Pedal technique is not
  //   regulated; only the presence and condition of the brake are.
  {
    code: "VC3",
    name: "Footbrake",
    category: "primary",
    summary: "The middle pedal — slows and stops the car.",
    whatItDoes:
      "Applies the brakes on all four wheels to reduce speed or stop.",
    howToUse:
      "Press progressively with your right foot, easing off as you stop so the halt is smooth. Brake in good time, not at the last second.",
    commonMistake:
      "Braking harshly and late instead of smoothly and early.",
    testHint:
      "Late or harsh braking is a fault — plan your stops ahead.",
    relatedControls: ["VC2", "VC6"],
    reviewStatus: "reviewed",
  },

  // Source: technique — no legal claim. Scope note: the DoT manual's car control list
  //   records that "Automatic vehicles do not have a clutch control" (§2.5, item 8),
  //   which is why the clutch is examined as control 8 on manual cars only.
  {
    code: "VC4",
    name: "Clutch",
    category: "primary",
    summary: "The left pedal — connects and disconnects the engine for gear changes.",
    whatItDoes:
      "Temporarily separates the engine from the wheels so you can change gears without grinding them.",
    howToUse:
      "Press fully to change gear, then release smoothly to the biting point when pulling away. Don't rest your foot on it while driving.",
    commonMistake:
      "Riding the clutch (resting your foot on it), which wears it out and reduces control.",
    testHint:
      "Stalling or riding the clutch both lose marks — practise the biting point.",
    relatedControls: ["VC5", "VC2"],
    reviewStatus: "reviewed",
  },

  // Source: technique — no legal claim. No regulation governs gear selection.
  {
    code: "VC5",
    name: "Gear lever",
    category: "transmission",
    summary: "Selects the gear that matches your speed.",
    whatItDoes:
      "Chooses the gear ratio so the engine works efficiently for your speed.",
    howToUse:
      "Press the clutch fully, move the lever to the chosen gear, then release the clutch smoothly. Change up as speed rises, down as it falls.",
    commonMistake:
      "Looking down at the lever instead of keeping your eyes on the road.",
    testHint:
      "Change gear by feel; glancing down repeatedly is unsafe and noticed.",
    relatedControls: ["VC4"],
    reviewStatus: "reviewed",
  },

  // Source: NRTR reg 1 definition — "parking brake" means "a brake, normally a hand
  //   brake, used in the ordinary course of events to keep a vehicle stationary".
  //   reg 149 requires a parking brake and allows the emergency and parking brake to
  //   "be one and the same brake"; reg 156(1)(a) requires good working order.
  //   The hill-start technique carries no legal claim.
  {
    code: "VC6",
    name: "Handbrake",
    category: "transmission",
    summary: "Holds the car still when parked and helps on hill starts.",
    whatItDoes:
      "Locks the rear wheels to keep a stationary car from rolling.",
    howToUse:
      "Apply firmly when parked or stopped on a hill; release fully before pulling away to avoid dragging it.",
    commonMistake:
      "Pulling away with the handbrake still on, or not using it on an incline.",
    testHint:
      "Rolling back on a hill start is a serious fault — use the handbrake.",
    relatedControls: ["VC3", "VC4"],
    reviewStatus: "reviewed",
  },

  // Source: NRTR reg 193(1) — a motor vehicle must be equipped "on both sides" with
  //   flasher-type or illuminated-window-type direction indicators. reg 198(4) — the
  //   indicators on one side must be operable separately from the other. reg 198(8) —
  //   "Direction indicators shall be maintained in good working order." reg 199 — a
  //   driver "shall not make use of any direction indicator not complying with" the
  //   regulations. Signal TIMING ("in good time") is technique, not a regulated interval.
  {
    code: "VC7",
    name: "Indicators",
    category: "signals",
    summary: "Tell other road users which way you intend to go.",
    whatItDoes:
      "Flashes the left or right turn signal to communicate your intention.",
    howToUse:
      "Signal in good time before turning or changing lanes, and check the indicator has cancelled afterwards.",
    commonMistake:
      "Signalling too late, or forgetting to cancel it after a turn.",
    testHint:
      "No signal, or a late one, before a turn or lane change costs marks.",
    relatedControls: ["VC9", "VC8"],
    reviewStatus: "reviewed",
  },

  // Source: NRTR reg 157(1)(b) — head lamps, rear lamps and number plate lamps must be
  //   "kept lighted during the period between sunset and sunrise and at any other time
  //   when, due to insufficient light or unfavourable weather conditions, persons and
  //   vehicles upon the public road are not clearly discernible at a distance of 150
  //   metres". reg 157(3) — a driver "shall extinguish the main-beam ... if such
  //   main-beam could cause a dangerous glare to oncoming traffic" (this is the legal
  //   basis for dipping, and it is a duty, not courtesy). reg 160(b) — the main-beam
  //   must be extinguishable by a device that simultaneously brings up the dipped-beam.
  //   reg 159 was amended by GNR.846 of 2014 (addition only); reg 157 and 160 untouched.
  //   NOTE reg 157(2): a motor cycle's headlamp must be lighted AT ALL TIMES — that is
  //   the Code A rule behind K53-41 and does not apply to a car.
  {
    code: "VC8",
    name: "Headlights & brights",
    category: "signals",
    summary: "Light the road and make you visible; dip for oncoming traffic.",
    whatItDoes:
      "Provides forward lighting; the bright (high) beam lights further but dazzles others.",
    howToUse:
      "Use headlights at night and in poor visibility. Switch to dipped (low) beam for oncoming traffic and when following another vehicle.",
    commonMistake:
      "Leaving brights on and dazzling oncoming drivers.",
    testHint:
      "Knowing when to dip your lights shows good road awareness.",
    relatedControls: ["VC7", "VC10"],
    reviewStatus: "reviewed",
  },

  // Source: NRTR reg 201(1)(a) — a self-propelled motor vehicle must be equipped with
  //   "an efficient warning device which is in good working order and, when used,
  //   capable of emitting a sound which, under normal conditions, is clearly audible by
  //   a person of normal hearing from a distance of at least 90 metres". reg 310A (Use
  //   of hooter) — "No person shall on a public road use the sounding device or hooter
  //   of a vehicle except when such use is necessary in order to comply with the
  //   provisions of these regulations or on the grounds of safety." That makes
  //   "alert, not vent" a legal duty, not etiquette. reg 201 was amended by GNR.846 of
  //   2014, but only the proviso after (1)(d) (sirens/emergency vehicles) — (1)(a) stands.
  {
    code: "VC9",
    name: "Hooter",
    category: "signals",
    summary: "A warning device — use it to alert, not to vent.",
    whatItDoes:
      "Sounds a horn to warn other road users of your presence where needed.",
    howToUse:
      "Use a short, polite warning only when necessary for safety. Avoid using it in anger or where prohibited.",
    commonMistake:
      "Using the hooter aggressively or to hurry pedestrians.",
    testHint:
      "Unnecessary or aggressive use reflects poor attitude in the test.",
    relatedControls: ["VC7"],
    reviewStatus: "reviewed",
  },

  // Source: technique/vehicle operation — no legal claim.
  //
  //   COLOUR CODING CUT 2026-08-03 (John's call). The lesson used to teach "a red light
  //   usually means stop and check; amber means caution", and a testHint told learners to
  //   "know red vs amber". Both were removed because neither is supportable:
  //     · The ONLY occurrence of "warning light" in the consolidated NRTR is reg 181(1)(a),
  //       "a brake anti-lock warning light to the front of a TRAILER" — an exterior lamp.
  //       reg 181 governs the colours a vehicle shows outward (white/amber/yellow front,
  //       yellow/amber sides, red rear) and says nothing about the instrument panel.
  //     · Tell-tale colours are standardised only in ISO 2575 / UN ECE R121, reachable in
  //       SA law at best through reg 216 (compulsory specs via GNs under s.22 of the
  //       Standards Act, Annex A to SABS 047). That is a fitment-and-working-order duty on
  //       the vehicle, not a meaning-of-colour rule for a driver — and we do not hold those
  //       standards in resources/, so citing the chain would be citing what we never read.
  //     · Not examined: the DoT manual's car section lists 11 controls and warning lights
  //       are not among them, and every "amber" item in docs/exam-format-analysis/ (150+
  //       real items) is a road sign or traffic signal, never a dashboard tell-tale.
  //   Do not reinstate the colour coding without a primary source in resources/.
  //
  //   What survives is the behaviour, not the colour code: a warning light that stays on
  //   after starting is worth checking. True, useful, and the grounding for q-controls-5.
  //   The only regulated in-cab warning devices are reg 156(2) (visible or audible warning
  //   of incorrect air/vacuum pressure on air-braked vehicles — not a car) and reg 215(1)
  //   (a speedometer "in a good working order" on any vehicle capable of 60 km/h or more;
  //   amended by GNR.846 of 2014 s.53, in force 6 months after publication).
  {
    code: "VC10",
    name: "Warning lights",
    category: "instruments",
    summary: "Dashboard lights that tell you the car's status.",
    whatItDoes:
      "Signal a fault or a reminder — low oil pressure, a charging problem, brakes, or simply that the handbrake is still on.",
    howToUse:
      "Glance at the dashboard regularly. If a warning light stays on after starting, check what it means in the vehicle's manual before driving.",
    commonMistake:
      "Ignoring a warning light and driving on, risking damage or danger.",
    testHint:
      "Treat a light that stays on as something to check, not something to drive through — the safe answer is always to investigate before moving off.",
    relatedControls: ["VC11"],
    reviewStatus: "reviewed",
  },

  // Source: NRTR reg 213(4) — "No adult shall occupy a seat in a motor vehicle operated
  //   on a public road which is fitted with a seatbelt unless such person wears such
  //   seatbelt: Provided that the provisions of this regulation do not apply while
  //   reversing or moving in or out of a parking bay or area." reg 213(3)(c) — seatbelts
  //   fitted to the vehicle must be "in good working order". reg 204(1)(a) — the vehicle
  //   must afford the driver "a full and clear view of the roadway ahead and to his or
  //   her right and left". reg 213 was amended by GNR.846 of 2014 s.52, which added the
  //   infant definition (1)(c) and the child-restraint duty (6A); (4) is unchanged.
  //   Seat position and mirror-setting order are technique, with no legal claim.
  {
    code: "VC11",
    name: "Cockpit setup",
    category: "pre-drive",
    summary: "Set up seat, mirrors, and seatbelt before you move off.",
    whatItDoes:
      "Gets you in full control with clear visibility before the car moves.",
    howToUse:
      "Adjust the seat so you reach the pedals comfortably, set all mirrors, fasten your seatbelt, and check doors are closed — before starting off.",
    commonMistake:
      "Driving off before adjusting mirrors or fastening the seatbelt.",
    testHint:
      "The examiner expects the full pre-drive check at the start.",
    relatedControls: ["VC1", "VC10"],
    reviewStatus: "reviewed",
  },

  // ── VC12+ ───────────────────────────────────────────────────────────────
  // Legal duties are grounded in the National Road Traffic Regulations, 2000;
  // operating technique carries no legal claim. VC18-VC22 are the Code A
  // motorcycle set, without which Code A papers (K53-7) cannot be built.
  //
  // The reg numbers below were pre-existing. All six on VC12-VC17 were CHECKED
  // 2026-08-03 against the consolidated text and the 2014 amendment: all six are
  // correct and none was disturbed by GNR.846. Verbatim wording added inline.

  // Source: NRTR reg 203 — no motor vehicle with a windscreen may be operated unless
  //   fitted with at least one wiper "capable of operation by other than manual means"
  //   which "shall, when in operation, wipe the outside of the windscreen directly in
  //   front of the driver, continuously, evenly and adequately". reg 204(1)(a) (full and
  //   clear view). CONFIRMED verbatim 2026-08-03; reg 203 untouched by GNR.846 of 2014.
  {
    code: "VC12",
    name: "Windscreen wipers and washers",
    category: "visibility",
    summary: "The stalk that clears rain and dirt off your windscreen.",
    whatItDoes:
      "The wipers sweep rain and dirt off the outside of the windscreen, and the washers spray fluid onto the glass so the blades lift grime instead of smearing it.",
    howToUse:
      "Match the wiper speed to the weather — intermittent for drizzle, fast for a downpour. For dust or insects, hold the washer button for a second so the glass is wet before the blades sweep.",
    commonMistake:
      "Wiping a dry, dusty screen with no washer fluid, which smears mud right across your view.",
    testHint:
      "The law says a vehicle with a windscreen must have a wiper that works on its own and wipes evenly in front of the driver — so keep the washer bottle topped up and check the blades before you drive.",
    relatedControls: ["VC8", "VC13"],
    reviewStatus: "reviewed",
  },

  // Source: NRTR reg 204(1)(a) — a vehicle must be "so constructed and maintained as to
  //   afford the driver thereof a full and clear view of the roadway ahead and to his or
  //   her right and left when the vehicle is in use". A misted or frosted screen defeats
  //   that duty, which is the grounding for clearing it. No regulation prescribes a
  //   demister as equipment. CONFIRMED verbatim 2026-08-03; untouched by GNR.846 of 2014.
  {
    code: "VC13",
    name: "Demister and defroster",
    category: "visibility",
    summary: "Clears the mist that forms on the inside of your glass.",
    whatItDoes:
      "Blows air across the windscreen to clear condensation on the inside, and heats fine wires in the rear window to clear the back glass.",
    howToUse:
      "Turn the fan up and aim the vents at the windscreen — warm air with the air-conditioner on clears mist fastest. Press the rear-window button for the back glass, then switch it off once the glass is clear.",
    commonMistake:
      "Wiping the misted glass with a hand or a cloth, which leaves smears and fogs over again within seconds.",
    testHint:
      "The law requires a vehicle to give the driver a full and clear view of the road ahead and to both sides — clear the glass before you move off, never while you are driving.",
    relatedControls: ["VC12", "VC16"],
    reviewStatus: "reviewed",
  },

  // Source: NRTR reg 198(5)(a) — a motor vehicle must be "fitted with a separate switch
  //   to operate all the direction indicators simultaneously". reg 198(6)(a) — the driver
  //   SHALL operate them all when the vehicle is "(i) stationary in a hazardous position;
  //   or (ii) in motion in an emergency situation", and reg 198(6)(b) — shall NOT operate
  //   them "in a circumstance other than those referred to in paragraph (a)". Both the
  //   duty and the prohibition are testable. CONFIRMED verbatim 2026-08-03; untouched by
  //   GNR.846 of 2014. Exempt vehicles under (5)(b) include motor cycles.
  {
    code: "VC14",
    name: "Hazard warning lights",
    category: "signals",
    summary: "The red triangle button that flashes all your indicators at once.",
    whatItDoes:
      "Switches on every direction indicator at the same time to warn other road users that your vehicle is a danger or is in danger.",
    howToUse:
      "Press the triangle button when you are standing still in a dangerous spot, such as broken down in a lane, or when you hit an emergency while moving, like traffic stopping dead in front of you. Switch them off once the danger has passed.",
    commonMistake:
      "Treating them as a free parking pass — flicking them on to stop where stopping is not allowed.",
    testHint:
      "The rule is narrow: you must use them when stationary in a hazardous position or in motion in an emergency, and you may not use them in any other situation.",
    relatedControls: ["VC7", "VC15"],
    reviewStatus: "reviewed",
  },

  // Source: NRTR reg 169(1)(e) — a stop lamp shall "be so connected that, if the motor
  //   vehicle is in motion, such lamp shall come into operation as soon as the operating
  //   device of the service brake ... is activated"; reg 169(1)(f) — "be maintained in a
  //   clean condition and in good working order". CHECKED 2026-08-03: GNR.846 of 2014 s.47
  //   amended reg 169 by ADDING subreg (4) (optional emergency-braking flashing stop lamps,
  //   SANS 20013/20048). Subregs (1)(e) and (f) are unchanged, so this citation stands.
  {
    code: "VC15",
    name: "Brake lights",
    category: "signals",
    summary: "Red lights at the back that warn drivers behind you are slowing.",
    whatItDoes:
      "Come on by themselves the moment you press the footbrake, telling drivers behind you that you are slowing or stopping.",
    howToUse:
      "You never switch them on — the brake pedal does it for you. Brake early and gently so the driver behind gets plenty of warning instead of one sudden flash.",
    commonMistake:
      "Resting a foot on the brake pedal in traffic, so the lights glow all the time and drivers behind stop believing them.",
    testHint:
      "Stop lamps must be kept clean and in good working order. Check yours by reversing close to a wall or shop window at night, or ask someone to watch while you press the pedal.",
    relatedControls: ["VC3", "VC10"],
    reviewStatus: "reviewed",
  },

  // Source: NRTR reg 204(1)(b) — a vehicle must be "fitted with a rearview mirror or
  //   mirrors enabling the driver ... when he or she is in the driving position, to see in
  //   clear weather a clear reflection of traffic to the rear". For a Code B car the
  //   specific duty is reg 204(1)(c): a motor car not exceeding 3 500 kg first registered
  //   on or after 1 Jan 1987 must have "an exterior rearview mirror on the driving side and
  //   an interior rearview mirror" — and where the interior mirror does not give a clear
  //   rear view, an additional exterior mirror on the opposite side instead. CONFIRMED
  //   verbatim 2026-08-03; untouched by GNR.846 of 2014.
  {
    code: "VC16",
    name: "Mirrors",
    category: "visibility",
    summary: "Your view of everything behind and beside you.",
    whatItDoes:
      "The interior mirror shows the road straight behind through the rear window, and the side mirrors show the lanes next to and behind the car.",
    howToUse:
      "Sit in your normal driving position and adjust all the mirrors before you move off. Then check a mirror before every signal, turn, lane change, stop and pull-away, and add a quick glance over your shoulder for the blind spot the mirrors miss.",
    commonMistake:
      "Trusting the mirrors alone and pulling into a lane where a car is sitting in the blind spot.",
    testHint:
      "The law requires mirrors that show you a clear reflection of the traffic behind. Examiners watch your eyes, so make your mirror checks early and obvious — a look after you have already moved earns nothing.",
    relatedControls: ["VC11", "VC7"],
    reviewStatus: "reviewed",
  },

  // Source: vehicle operation — no legal claim. VERIFIED 2026-08-03: no regulation in the
  //   consolidated NRTR prescribes ABS, its fitment or its use, and GNR.846 of 2014 did not
  //   introduce one (s.42 added UN ECE R116 for anti-theft devices only, not braking aids).
  {
    code: "VC17",
    name: "ABS (anti-lock brakes)",
    category: "primary",
    summary: "Stops the wheels locking in a hard stop so you can still steer.",
    whatItDoes:
      "During hard braking it senses a wheel about to lock, then releases and re-applies that brake many times a second so the tyres keep gripping instead of skidding.",
    howToUse:
      "In an emergency press the brake pedal hard and hold it down. The pedal will shudder and you may hear a buzz — that is the system working, so do not lift off. Keep steering around the hazard while you brake.",
    commonMistake:
      "Pumping the pedal or easing off when it judders, which stops the system helping at the exact moment you need it.",
    testHint:
      "Know what ABS does and does not do: it lets you steer while braking hard, but it does not shorten your stopping distance on every surface and it is no excuse for driving faster in the rain.",
    relatedControls: ["VC3", "VC1", "VC10"],
    reviewStatus: "reviewed",
  },

  // Source: vehicle operation — no legal claim
  {
    code: "VC18",
    name: "Motorcycle: throttle",
    category: "motorcycle",
    summary: "The twist grip on the right handlebar — controls engine speed.",
    whatItDoes:
      "Feeds more or less power to the engine, so the bike speeds up or slows down.",
    howToUse:
      "Twist the right grip towards you to open the throttle and speed up; roll it away from you to close it and slow down. Move it in small, smooth amounts — your wrist should stay relaxed.",
    commonMistake:
      "Snapping the throttle open, which makes the bike lurch and unsettles your balance.",
    testHint:
      "Examiners look for smooth pull-away and steady speed — jerky throttle use shows poor control.",
    relatedControls: ["VC19", "VC21"],
    reviewStatus: "draft",
  },

  // Source: vehicle operation — no legal claim
  {
    code: "VC19",
    name: "Motorcycle: front brake",
    category: "motorcycle",
    summary: "The lever on the right handlebar — your strongest brake.",
    whatItDoes:
      "Brakes the front wheel. As you slow, weight shifts forward onto the front tyre, so it does most of the stopping — rider training puts it at roughly 70%.",
    howToUse:
      "Squeeze the lever progressively with the fingers of your right hand — start gently, then build pressure. Keep the bike upright and straight while you do it.",
    commonMistake:
      "Grabbing the lever hard and fast, which can lock the front wheel and drop the bike.",
    testHint:
      "Avoiding the front brake because you fear it is a mistake — you cannot stop properly on the rear brake alone.",
    relatedControls: ["VC20", "VC22"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 309 (rider's feet on the foot-rests)
  {
    code: "VC20",
    name: "Motorcycle: rear brake",
    category: "motorcycle",
    summary: "The pedal under your right foot — steadies the bike as you brake.",
    whatItDoes:
      "Brakes the rear wheel. It adds stopping power and helps keep the bike settled and straight.",
    howToUse:
      "Press down gently with your right toe at the same time as you squeeze the front lever. Use both brakes together for every normal stop. On a scooter with no gears, the rear brake is usually the left hand lever instead.",
    commonMistake:
      "Stamping on the pedal and locking the rear wheel, which makes the back end slide.",
    testHint:
      "The regulations require your feet to rest on the foot-rests while riding, so keep your right toe over the pedal rather than dangling your leg.",
    relatedControls: ["VC19", "VC22"],
    reviewStatus: "draft",
  },

  // Source: vehicle operation — no legal claim
  {
    code: "VC21",
    name: "Motorcycle: clutch and gear lever",
    category: "motorcycle",
    summary: "Left hand lever for the clutch, left foot lever for the gears.",
    whatItDoes:
      "The clutch separates the engine from the gearbox; the foot lever selects the gear that suits your speed.",
    howToUse:
      "Pull the clutch lever in with your left hand, click the gear lever with your left foot, then let the clutch out smoothly while easing on the throttle. On most bikes it is first gear down, neutral half a click up, then the rest of the gears up.",
    commonMistake:
      "Dropping the clutch too quickly when pulling away, which stalls the bike or makes the front wheel lift.",
    testHint:
      "Practise finding neutral while stopped — hunting for it at a robot looks like poor control.",
    relatedControls: ["VC18", "VC4", "VC5"],
    reviewStatus: "draft",
  },

  // Source: vehicle operation — no legal claim
  {
    code: "VC22",
    name: "Motorcycle: braking to a controlled stop",
    category: "motorcycle",
    summary: "Both brakes, bike straight up, all braking finished before the corner.",
    whatItDoes:
      "Brings the bike to a smooth, balanced halt without losing grip or falling over.",
    howToUse:
      "Roll off the throttle, then squeeze the front lever and press the rear pedal together, building pressure smoothly. Keep the bike upright and in a straight line. Pull the clutch in just before you stop, then put your left foot down.",
    commonMistake:
      "Still braking while leaning into a corner — a leaning tyre has less grip to spare and can slide away.",
    testHint:
      "Do your braking on the straight before the turn, so you enter the corner at the right speed and only need the throttle through it.",
    relatedControls: ["VC19", "VC20", "VC21"],
    reviewStatus: "draft",
  },
];

export function getControl(code: string): VehicleControl | undefined {
  return VEHICLE_CONTROLS.find((c) => c.code === code);
}

/**
 * The numbered callouts on the cockpit diagram (`public/img/cockpit-controls.jpg`),
 * mapped to the control each one points at.
 *
 * Every entry was CONFIRMED BY JOHN against the original artwork, not read off the
 * image — an earlier pass read callout 7 as the pedals and it is the handbrake,
 * which is why none of this is inferred. `label` is what the diagram is pointing
 * at, which is not always the lesson title: 1 and 3 are both the mirrors object,
 * and 8-10 are the three pedals as separate callouts.
 *
 * This is the asset behind the `control-number` question archetype
 * (docs/exam-format-analysis/question-patterns.md P7) — one diagram supporting
 * number->name, function->number and function->number-pair questions.
 *
 * CORROBORATED 2026-08-03 against the official DoT learner-driver manual
 * (resources/manuals/natis-vehicle-controls-manual-v100-2012-06.pdf §2.2/§2.5), whose
 * numbered car control list matches this map 11/11 — including callout 7 as the
 * handbrake, the one an earlier pass got wrong. The manual's own wording:
 *   1 Centre rear view mirror · 2 Window wiper · 3 Left and right rear view mirrors ·
 *   4 Steering wheel · 5 Indicator light switch · 6 Gear lever · 7 Hand brake ·
 *   8 Clutch · 9 Brake · 10 Accelerator · 11 Horn
 * So the numbering is now backed by the official source, not by the artwork alone.
 * The manual notes two variants worth knowing: some vehicles have a foot-operated
 * parking brake (it names Mercedes-Benz), and an automatic has no control 8.
 */
export const COCKPIT_CALLOUTS: {
  n: number;
  code: string;
  label: string;
}[] = [
  { n: 1, code: "VC16", label: "Rear-view mirror" },
  { n: 2, code: "VC12", label: "Windscreen wiper" },
  { n: 3, code: "VC16", label: "Side mirrors" },
  { n: 4, code: "VC1", label: "Steering wheel" },
  { n: 5, code: "VC7", label: "Indicator stalk" },
  { n: 6, code: "VC5", label: "Gear lever" },
  { n: 7, code: "VC6", label: "Handbrake" },
  { n: 8, code: "VC4", label: "Clutch pedal" },
  { n: 9, code: "VC3", label: "Brake pedal" },
  { n: 10, code: "VC2", label: "Accelerator pedal" },
  { n: 11, code: "VC9", label: "Hooter" },
];
