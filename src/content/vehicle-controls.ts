import {
  Cog,
  Disc3,
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
];

export function getControl(code: string): VehicleControl | undefined {
  return VEHICLE_CONTROLS.find((c) => c.code === code);
}
