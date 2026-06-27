import {
  ArrowRightLeft,
  CarFront,
  Footprints,
  Gauge,
  GitFork,
  ParkingSquare,
  Shuffle,
  TrafficCone,
  type LucideIcon,
} from "lucide-react";
import type { RoadRule, RuleCategory } from "@/lib/types";

/**
 * Sample Rules of the Road library (DB2).
 *
 * Content moat rule (PRD-additions §3): every rule, explanation, and hint is
 * written ORIGINALLY — not copied from competitor apps, paid manuals, or PDFs.
 * Starter set for the MVP; the full library is instructor-reviewed before launch.
 */
export const RULE_CATEGORY_META: Record<
  RuleCategory,
  { label: string; icon: LucideIcon }
> = {
  "right-of-way": { label: "Right of way", icon: Shuffle },
  following: { label: "Following distance", icon: CarFront },
  overtaking: { label: "Overtaking", icon: ArrowRightLeft },
  intersections: { label: "Intersections", icon: GitFork },
  signals: { label: "Signalling & lanes", icon: TrafficCone },
  speed: { label: "Speed", icon: Gauge },
  pedestrians: { label: "Pedestrians", icon: Footprints },
  parking: { label: "Stopping & parking", icon: ParkingSquare },
};

export const ROAD_RULES: RoadRule[] = [
  {
    code: "RR1",
    title: "Four-way stop order",
    category: "right-of-way",
    summary: "First to stop goes first; if you arrive together, the right goes.",
    rule: "At a four-way stop, vehicles proceed in the order they came to a complete stop. When two stop at the same time, the vehicle on the right has right of way.",
    whatToDo:
      "Stop fully, note who was already waiting, and take your turn in arrival order. If it's a tie, let the car on your right go first.",
    commonMistake:
      "Going out of turn because you stopped briefly — or waving everyone through and causing confusion.",
    testHint:
      "Examiners watch for a full stop AND correct order. Both matter.",
    relatedRules: ["RR6", "RR7"],
    reviewStatus: "draft",
  },
  {
    code: "RR2",
    title: "Two-second following distance",
    category: "following",
    summary: "Stay at least two seconds behind the car in front.",
    rule: "In good conditions, keep a minimum two-second gap to the vehicle ahead. Pick a fixed point; you should reach it no sooner than two seconds after the car in front passes it.",
    whatToDo:
      "Count 'one-thousand-and-one, one-thousand-and-two' as the car ahead passes a marker. If you reach it first, drop back.",
    commonMistake:
      "Following too closely so you can't stop in time if the car ahead brakes suddenly.",
    testHint:
      "Tailgating is an immediate fault — leave a clear, visible gap.",
    relatedRules: ["RR10"],
    reviewStatus: "draft",
  },
  {
    code: "RR3",
    title: "No overtaking on a solid line",
    category: "overtaking",
    summary: "A solid centre line means do not overtake.",
    rule: "You may not cross a solid white centre line to overtake. You may only cross it to avoid an obstruction, and only when it is safe.",
    whatToDo:
      "Wait for a broken line and a clear road before overtaking. Check oncoming traffic and your blind spot first.",
    commonMistake:
      "Overtaking on a solid line because the car ahead feels slow.",
    testHint:
      "Line markings carry the same weight as signs — read them.",
    relatedRules: ["RR2"],
    reviewStatus: "draft",
  },
  {
    code: "RR4",
    title: "Yield to pedestrians at crossings",
    category: "pedestrians",
    summary: "People crossing have right of way — stop and let them cross.",
    rule: "Drivers must give way to pedestrians at or approaching a pedestrian crossing, and may not enter the crossing until it is clear.",
    whatToDo:
      "Slow down near crossings, stop for anyone waiting or crossing, and only move off once they are safely across.",
    commonMistake:
      "Edging forward or hooting to rush pedestrians instead of waiting.",
    testHint:
      "Failing to yield to a pedestrian is a serious fault.",
    relatedRules: ["RR1"],
    reviewStatus: "draft",
  },
  {
    code: "RR5",
    title: "Mirror, signal, blind spot",
    category: "signals",
    summary: "Check mirrors, signal, then check the blind spot before moving.",
    rule: "Before moving off, changing lanes, or turning, check your mirrors, signal your intention in good time, and physically check your blind spot before moving.",
    whatToDo:
      "Mirror → signal → look over your shoulder → move only when it's clear. Cancel the indicator afterwards.",
    commonMistake:
      "Relying on mirrors alone and missing a vehicle in the blind spot.",
    testHint:
      "Examiners specifically look for the over-the-shoulder blind-spot check.",
    relatedRules: ["RR3"],
    reviewStatus: "draft",
  },
  {
    code: "RR6",
    title: "Mini-circle: yield to the right",
    category: "intersections",
    summary: "At a mini-circle, give way to traffic already in it and to your right.",
    rule: "Approaching a mini-circle (traffic circle), yield to any vehicle already in the circle and, where vehicles arrive together, to the vehicle on your right.",
    whatToDo:
      "Slow down, give way as required, signal your exit, and keep moving smoothly through the circle.",
    commonMistake:
      "Stopping in the circle or failing to signal when leaving it.",
    testHint:
      "Same arrival-order logic as a four-way stop, but you don't always stop.",
    relatedRules: ["RR1", "RR7"],
    reviewStatus: "draft",
  },
  {
    code: "RR7",
    title: "Reading the robot",
    category: "intersections",
    summary: "Green isn't 'go blindly'; amber means stop if you safely can.",
    rule: "Proceed on green only when the way is clear. On amber, stop if you can do so safely; do not speed up to beat the light. Red means stop behind the line.",
    whatToDo:
      "Approach robots ready to stop, scan the intersection on green, and brake smoothly on amber when it's safe.",
    commonMistake:
      "Accelerating on amber to 'make' the light.",
    testHint:
      "Entering on a red or racing an amber is an instant fault.",
    relatedRules: ["RR1", "RR6"],
    reviewStatus: "draft",
  },
  {
    code: "RR8",
    title: "General speed limits",
    category: "speed",
    summary: "60 in town, 100 on rural roads, 120 on freeways — unless signed.",
    rule: "Default limits are 60 km/h in urban areas, 100 km/h on public roads outside urban areas, and 120 km/h on freeways, unless a sign shows otherwise.",
    whatToDo:
      "Match your speed to the area and obey any sign that changes the limit. Slow down further in poor conditions.",
    commonMistake:
      "Assuming the freeway limit applies everywhere, or ignoring lower signed limits.",
    testHint:
      "A speed sign always overrides the default limit for that area.",
    relatedRules: ["RR2"],
    reviewStatus: "draft",
  },
  {
    code: "RR9",
    title: "Where you may not stop or park",
    category: "parking",
    summary: "Keep clear of intersections, crossings, and other hazards.",
    rule: "Do not stop or park where it endangers or obstructs traffic — including on or near an intersection, pedestrian crossing, or where a sign or line marking prohibits it.",
    whatToDo:
      "Choose a legal, safe spot well clear of intersections and crossings, and check for no-stopping or no-parking signs.",
    commonMistake:
      "Confusing no-stopping (stricter) with no-parking, or stopping too close to a corner.",
    testHint:
      "Stopping in a prohibited place during the test costs you marks.",
    relatedRules: ["RR4"],
    reviewStatus: "draft",
  },
  {
    code: "RR10",
    title: "Slow down in poor conditions",
    category: "following",
    summary: "Rain, fog, or dark? Increase your following distance and slow down.",
    rule: "Reduce speed and increase your following distance in rain, fog, low light, or on a slippery road, where stopping distances grow.",
    whatToDo:
      "Lengthen the two-second gap to four or more, switch on headlights when visibility drops, and brake earlier.",
    commonMistake:
      "Driving at the normal limit and following distance in the wet.",
    testHint:
      "Judgement in conditions matters — speed limits are maximums, not targets.",
    relatedRules: ["RR2", "RR8"],
    reviewStatus: "draft",
  },
];

export function getRule(code: string): RoadRule | undefined {
  return ROAD_RULES.find((r) => r.code === code);
}
