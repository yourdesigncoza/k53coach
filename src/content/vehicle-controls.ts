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
    reviewStatus: "draft",
  },
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
    reviewStatus: "draft",
  },
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
    reviewStatus: "draft",
  },
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
    reviewStatus: "draft",
  },
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
    reviewStatus: "draft",
  },
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
    reviewStatus: "draft",
  },
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
    reviewStatus: "draft",
  },
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
    reviewStatus: "draft",
  },
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
    reviewStatus: "draft",
  },
  {
    code: "VC10",
    name: "Warning lights",
    category: "instruments",
    summary: "Dashboard lights that tell you the car's status.",
    whatItDoes:
      "Signal faults or reminders — a red light usually means stop and check; amber means caution.",
    howToUse:
      "Glance at the dashboard regularly. If a red warning light stays on after starting, investigate before driving.",
    commonMistake:
      "Ignoring a warning light and driving on, risking damage or danger.",
    testHint:
      "You may be asked what a warning light means — know red vs amber.",
    relatedControls: ["VC11"],
    reviewStatus: "draft",
  },
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
    reviewStatus: "draft",
  },

  // ── VC12+ ───────────────────────────────────────────────────────────────
  // Legal duties are grounded in the National Road Traffic Regulations, 2000;
  // operating technique carries no legal claim. VC18-VC22 are the Code A
  // motorcycle set, without which Code A papers (K53-7) cannot be built.

  // Source: NRTR 2000 — reg 203 (windscreen wiper); reg 204(1)(a) (full and clear view)
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
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 204(1)(a) (driving view to be unobstructed)
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
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 198(5)-(6) (switch operating all indicators simultaneously)
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
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 169 (stop lamps), esp. reg 169(1)(e) and (f)
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
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 204(1)(b) (rearview mirror or mirrors)
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
    reviewStatus: "draft",
  },

  // Source: vehicle operation — no legal claim (no regulation prescribes ABS or its use)
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
    reviewStatus: "draft",
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
