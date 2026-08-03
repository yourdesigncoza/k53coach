import {
  ArrowRightLeft,
  CarFront,
  Footprints,
  Gauge,
  GitFork,
  Lightbulb,
  ParkingSquare,
  Route,
  ShieldCheck,
  Shuffle,
  Siren,
  TrafficCone,
  UserCheck,
  Wrench,
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
  "driver-fitness": { label: "Driver fitness & documents", icon: UserCheck },
  "vehicle-fitness": { label: "Vehicle fitness", icon: Wrench },
  lights: { label: "Lights & visibility", icon: Lightbulb },
  freeways: { label: "Lanes & freeways", icon: Route },
  emergencies: { label: "Emergencies & accidents", icon: Siren },
  safety: { label: "Safety rules", icon: ShieldCheck },
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

  // ── RR11+ ───────────────────────────────────────────────────────────────
  // Written from the National Road Traffic Act 93 of 1996 and the National Road
  // Traffic Regulations, 2000. Each object carries the provision it rests on.
  // No commercial study guide was used as a source — see
  // docs/rules-coverage-checklist.md for the method.

  // Source: NRTA 93 of 1996 — s 65(1),(2),(5),(8),(9); s 32 (professional driving permit)
  {
    code: "RR11",
    title: "Alcohol and drug limits",
    category: "driver-fitness",
    summary: "0,05 in your blood is already over the line — and 0,02 if you drive for a living.",
    rule: "You may not drive, or sit in the driver's seat with the engine running, while under the influence of alcohol or a narcotic drug. It is a separate offence if your blood alcohol reaches 0,05 g per 100 ml or your breath alcohol reaches 0,24 mg per 1 000 ml. For a driver who must hold a professional driving permit, the limits drop to 0,02 g per 100 ml of blood and 0,10 mg per 1 000 ml of breath.",
    whatToDo:
      "If you're driving, don't drink at all — there is no safe number of drinks. Arrange a lift or hand over the keys before you start, not after. If you're stopped, you must allow a blood or breath specimen to be taken.",
    commonMistake:
      "Thinking a reading under the limit is automatically fine — you can still be charged for driving under the influence. Sleeping it off in the driver's seat with the engine running also counts.",
    testHint:
      "Learn the numbers as two pairs: 0,05 blood / 0,24 breath for ordinary drivers, 0,02 blood / 0,10 breath for professional drivers.",
    relatedRules: ["RR10", "RR13"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 213(1),(4),(5),(6),(7),(11); infant rule reg 213(6A) (GN R846, GG 38142)
  {
    code: "RR12",
    title: "Seatbelts and child restraints",
    category: "safety",
    summary: "If a seat has a belt, wear it — and the driver answers for every child on board.",
    rule: "An adult may not occupy a seat fitted with a seatbelt without wearing it. The driver must make sure everyone in the vehicle is belted, that a child uses a child restraint where one is available or a seatbelt if not, and that an infant under three years travels in an approved child restraint.",
    whatToDo:
      "Belt up before you move off and check your passengers. Put a child in the proper restraint, or on a rear seat if no belted seat is free. The belt rule doesn't apply while you're reversing or moving in or out of a parking bay.",
    commonMistake:
      "Thinking back-seat passengers are exempt, or that holding a baby on your lap counts as a restraint. It doesn't.",
    testHint:
      "Know the three age bands: infant is under 3, child is 3 to 14 (unless taller than 1,5 m), adult is over 14 or 1,5 m and taller.",
    relatedRules: ["RR10", "RR14"],
    reviewStatus: "draft",
  },

  // Source: NRTA 93 of 1996 — s 12(a)-(b), 13, 15(1)(a)(ii), 30; NRTR 2000 — reg 99(2), 101(1)
  {
    code: "RR13",
    title: "Licence and documents",
    category: "driver-fitness",
    summary: "A learner never drives alone, and the licence rides with you in the car.",
    rule: "You may drive only under the authority and conditions of your licence, and you must keep that licence with you in the vehicle. A learner must be accompanied by, and under the direct personal supervision of, a fully licensed driver for that class of vehicle, seated next to the learner or immediately behind where there is no seat alongside.",
    whatToDo:
      "Carry your learner's licence every single time you drive, and take a supervisor who holds a full driving licence — not another learner. A motorcycle learner may not carry a passenger, and no learner may carry passengers for reward.",
    commonMistake:
      "Driving alone 'just around the corner', or lending your licence to someone else — both are offences.",
    testHint:
      "Remember: a learner's licence for a light motor vehicle needs you to be 17, and it stays valid for 24 months.",
    relatedRules: ["RR11"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 310A (use of hooter); reg 310 (excessive noise)
  {
    code: "RR14",
    title: "Use of the hooter",
    category: "safety",
    summary: "Hoot for safety, never for temper or a greeting.",
    rule: "You may not use a vehicle's hooter or sounding device on a public road except where it is needed to comply with the traffic regulations or on the grounds of safety. Operating a vehicle so that it makes excessive avoidable noise is a separate offence.",
    whatToDo:
      "Give one short tap only when a warning genuinely prevents a crash — someone reversing into you, or a driver drifting into your lane. Then get back to steering, braking and looking.",
    commonMistake:
      "Hooting to greet a friend, to hurry the car ahead at a green light, or outside a house to call someone out.",
    testHint:
      "If the reason isn't 'to warn someone of danger', the answer is almost certainly unlawful.",
    relatedRules: ["RR5", "RR10"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 212(f),(j),(l),(m) (tyres)
  {
    code: "RR15",
    title: "Tyres and tread depth",
    category: "vehicle-fitness",
    summary: "Every tyre needs at least 1 mm of tread, right across and all the way around.",
    rule: "A tyre used on a public road must show a clearly visible tread pattern across its full breadth and around its whole circumference, at least 1 mm deep. A tyre is also illegal once the tread is worn level with its tread-wear indicator, if the cords are showing, if it has a deep cut, or if it has a lump or bulge.",
    whatToDo:
      "Walk around the car and check all four tyres. Look into the grooves for the raised tread-wear bars, check the inside edge as well as the outside, and feel for cuts or bulges in the sidewall.",
    commonMistake:
      "Only checking the outer edge — the inside shoulder often wears down first and you never see it.",
    testHint:
      "1 mm is the legal minimum, not a safe target. Bald tyres take far longer to stop in the wet.",
    relatedRules: ["RR10", "RR16"],
    reviewStatus: "draft",
  },

  // Source: NRTA 93 of 1996 — s 4(2) (registered and licensed), s 42(1) (roadworthy
  // condition), s 1(lxiii) ("roadworthy"); NRTR 2000 — reg 35(6) (obscured licence
  // number), reg 35(7)(f) (one plate front and back), reg 36(1)(a) (disc on the lower
  // left of the windscreen), reg 36(2)(b) (disc obscured or illegible).
  // NOTE: this previously cited "s 4(3)", which does not exist — s 4 ends at (2). The
  // wrong block propagated from here into all five RR16 questions and the verification
  // worklist. See docs/question-verify/findings.md §1.
  {
    code: "RR16",
    title: "Number plates, licence disc and roadworthiness",
    category: "vehicle-fitness",
    summary: "Plates readable, disc displayed, and the car fit to be on the road.",
    rule: "You may only drive a car on a public road if it is registered and licensed and is in a roadworthy condition. A number plate must be fitted to the front and the back, fully visible and clearly legible, and may not be obscured. The licence disc goes on the lower left of the windscreen so it can be read from outside.",
    whatToDo:
      "Keep both plates clean, straight and unblocked. Check the expiry date on the disc and renew it in time. Fix faults as they come up — lights, brakes, tyres, wipers.",
    commonMistake:
      "Letting a tow ball, bike rack or thick dirt hide part of the plate, or driving on a disc that expired months ago.",
    testHint:
      "'Roadworthy' means the whole vehicle is fit to drive — a valid disc on its own is not enough.",
    relatedRules: ["RR15", "RR18"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 99(4) (licence codes B and EB), reg 151 (trailer brakes), regs 292-293 (speed)
  {
    code: "RR17",
    title: "Towing a trailer",
    category: "vehicle-fitness",
    summary: "A Code B licence only covers a trailer of 750 kg GVM or less.",
    rule: "A Code B licence lets you drive a light vehicle with a trailer whose gross vehicle mass is 750 kg or less. To pull a heavier trailer behind a light vehicle you need a Code EB licence. Every trailer must have the brakes required for its mass, and the normal speed limits still apply to you.",
    whatToDo:
      "Read the GVM on the trailer's own plate before you hitch up, not how heavy it feels. Check the trailer lights work, load the weight low and evenly, and leave a much bigger gap and a longer run for overtaking.",
    commonMistake:
      "Assuming a Code B licence covers any trailer or caravan you can physically tow.",
    testHint:
      "The number to remember is 750 kg GVM — that is the line between Code B and Code EB.",
    relatedRules: ["RR2", "RR8", "RR16"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 157(1)(b) (when lamps must be lit), reg 157(3) (dazzling oncoming traffic)
  {
    code: "RR18",
    title: "When your lights must be on",
    category: "lights",
    summary: "Lights on from sunset to sunrise, and any time you can't see 150 m clearly.",
    rule: "Your headlamps, rear lamps and number plate lamps must be lit between sunset and sunrise, and at any other time when poor light or bad weather means people and vehicles are not clearly visible at 150 metres. You must switch off your main beam whenever it could dangerously dazzle oncoming traffic.",
    whatToDo:
      "Switch on at dusk and in rain, fog, dust or smoke. Dip your lights as soon as you see an oncoming vehicle. Dipping when you come up behind another car is good manners and good practice, though the regulation itself speaks only of oncoming traffic.",
    commonMistake:
      "Leaving lights off in heavy rain because it's still daytime, or waiting for an oncoming driver to flash before dipping.",
    testHint:
      "Two triggers: sunset to sunrise, and whenever you cannot clearly see 150 m ahead.",
    relatedRules: ["RR10", "RR16"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 296 (keep left), reg 298(1) (passing), reg 298A (no driving on the shoulder)
  {
    code: "RR19",
    title: "Keep left, pass right",
    category: "freeways",
    summary: "Drive on the left and only move right to get past someone.",
    rule: "You must drive on the left side of the roadway and not encroach on the half to your right, except briefly when it is safe, when no sign forbids it, or when a sign or officer directs you. To pass a vehicle going the same way, you pass on its right at a safe distance and only return left once you are safely clear.",
    whatToDo:
      "Sit in the left lane by default. Pull right only to overtake, then move back left as soon as you are past. Never use the shoulder or the verge to get by.",
    commonMistake:
      "Staying in the right-hand lane because it is moving well — the right lane is for passing, not cruising.",
    testHint:
      "If an answer lets you pass on the left or on the shoulder, treat it as wrong unless the road is one-way with marked lanes.",
    relatedRules: ["RR3", "RR5", "RR20"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 298(3) (duty of the driver being passed), reg 323(5)-(6) (freeway right lane)
  {
    code: "RR20",
    title: "When someone overtakes you",
    category: "freeways",
    summary: "Being passed? Move left, hold your speed, let them go.",
    rule: "As soon as you realise a vehicle behind you wants to pass, you must move as near to the left edge of the roadway as you safely can, and you may not accelerate until that vehicle has passed. On a freeway, if you are in the right-hand lane you must move into a lane on your left.",
    whatToDo:
      "Check your mirrors, ease left if there is safe space, keep your speed steady, and let them through. A flash of headlights from behind is the legal way for a driver to say they are coming past.",
    commonMistake:
      "Speeding up while being overtaken — it is against the law and it traps the other driver next to you.",
    testHint:
      "The answer is always 'move left and do not accelerate', never 'speed up' or 'hold your position'.",
    relatedRules: ["RR19", "RR2", "RR5"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 297(1) (drive on the left-hand roadway), reg 297(2) AS
  // SUBSTITUTED by GNR.2116 r. 52 w.e.f. 5 October 2001 (no driving on/over/across/within
  // the dividing section, "except through a constructed intersection"), reg 299(2)
  // (entering a road safely).
  // NOTE: the 2000 ORIGINAL read "except through an opening in such space, barrier or
  // section or at a cross-over or intersection" — three routes. The 2001 substitution
  // reduced that to one. docs/question-verify/findings.md §2 was written against the
  // original and briefly widened this lesson to three routes; that was a regression and is
  // reverted here. Anyone checking against an unamended 2000 copy will read three.
  {
    code: "RR21",
    title: "Divided roads and dual carriageways",
    category: "freeways",
    summary:
      "Two roadways split by a median — stay left, and cross only at a constructed intersection.",
    rule: "Where a road is divided into two or more roadways by a gap, a barrier or a dividing section, you may only drive on the left-hand roadway unless a sign or a traffic officer sends you onto another one. You may not drive on, over, across or inside that dividing section, except to cross it through a constructed intersection — and not even there if a sign or a traffic officer forbids it.",
    whatToDo:
      "Missed your turn? Carry on to the next constructed intersection or interchange and come back — never cut through the median anywhere else, however clear it looks. Only enter the roadway when you can do it without endangering other traffic.",
    commonMistake:
      "Using a worn track through the median to make a U-turn because everyone else does it.",
    testHint:
      "'Cross the median wherever it looks clear' is never right — but neither is 'you may never cross at all'. The answer is that you cross only through a constructed intersection.",
    relatedRules: ["RR9", "RR19"],
    reviewStatus: "draft",
  },

  // Source: NRTA 93 of 1996 — s 1 ("freeway"); NRTR 2000 — reg 323 (freeways), reg 292(c) (120 km/h)
  // NOTE(verify): the research pass found NO national provision barring a learner-licence holder
  // from a freeway — reg 323(1) bans vehicle types, not licence classes. That is contrary to
  // common belief, so it is deliberately NOT taught either way here. Confirm before writing any
  // exam question on it. See docs/rules-coverage-checklist.md.
  {
    code: "RR22",
    title: "Freeway rules",
    category: "freeways",
    summary: "A road is only a freeway if a sign says so — and plenty of road users are banned from it.",
    rule: "Bicycles, animal-drawn vehicles, tractors, motor tricycles and quadrucycles, motorcycles of 50 cc or less or driven by electric power, and small disability vehicles under 230 kg may not be operated on a freeway. You may not be on a freeway on foot, or let an animal onto it, except inside a signposted stopping area or for a reason beyond your control. You may not stop, except where a sign, an officer or something outside your control makes you. Hand signals are not allowed on a freeway.",
    whatToDo:
      "Build up speed on the on-ramp, check mirrors and blind spot, indicate, and merge without forcing anyone to brake. Leaving, indicate early and do your slowing down in the off-ramp, not in the through lane. The general limit is 120 km/h unless a sign shows lower.",
    commonMistake:
      "Slowing down or stopping on the hard shoulder to take a call — you may only stop on a freeway where a sign, an officer, or something beyond your control makes you.",
    testHint:
      "Memorise the banned list: bicycles, animal-drawn vehicles, tractors, tricycles, quadrucycles, and small or electric motorcycles.",
    relatedRules: ["RR8", "RR9", "RR19"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 300 (signals), regs 324, 325, 327 (hand signals), reg 326 (indicators)
  {
    code: "RR23",
    title: "Hand signals",
    category: "signals",
    summary: "Three arm signals — all given with the right arm — for turning left, turning right and slowing down.",
    rule: "Before you turn, move across, stop or suddenly slow down, you must give a clear signal early enough and long enough to warn anyone in front, behind or beside you. If your vehicle has working indicators you must use them; hand signals are what you fall back on when they are not working. You may not give hand signals on a freeway.",
    whatToDo:
      "Right turn: right arm straight out of the window, level with the shoulder, palm facing forward. Left turn: right arm out with the forearm bent down, circling anti-clockwise. Slowing or stopping: right arm out with the forearm bent up, palm facing forward.",
    commonMistake:
      "Signalling a left turn by sticking the left arm out the passenger side, where the driver behind you can't see it.",
    testHint:
      "All three signals use the right arm — straight out is right, down and circling is left, up is slowing.",
    relatedRules: ["RR5"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 308(1)(h); NRTA 93 of 1996 — s 58(3), s 60
  {
    code: "RR24",
    title: "Emergency vehicles",
    category: "emergencies",
    summary: "Siren or emergency lamp on? Give way immediately — the law gives you no choice.",
    rule: "You must give immediate and absolute right of way to any vehicle sounding its siren or showing its emergency identification lamp. Those drivers are allowed to pass signs and exceed speed limits that would hold you back, so the road has to open for them.",
    whatToDo:
      "Work out where it is coming from, indicate, and move to the left as soon as you can do it safely. Stop and wait if you need to, then carry on once it has passed.",
    commonMistake:
      "Panic-braking in the middle of the lane, so the ambulance is now stuck behind a stopped car.",
    testHint:
      "The wording is 'immediate and absolute' — there is no situation where you hold your right of way against a siren.",
    relatedRules: ["RR7", "RR9"],
    reviewStatus: "draft",
  },

  // Source: NRTA 93 of 1996 — s 61(1)(a)-(g) (duties after an accident), s 61(2) (moving vehicles)
  {
    code: "RR25",
    title: "After an accident: your duties",
    category: "emergencies",
    summary: "Stop, help, hand over your details, and report it to the police within 24 hours.",
    rule: "If your vehicle is involved in an accident where anyone is killed or injured, or property or an animal is damaged, you must stop immediately, find out what injuries and damage there are, and help anyone who is hurt as far as you are able to.",
    whatToDo:
      "Give your name and address, the owner's name and address, and the vehicle's registration number to anyone with fair reason to ask. If you did not give those details to a traffic officer at the scene, report the accident at a police station as soon as you reasonably can and within 24 hours, with your driving licence and ID number. Where someone was killed or injured, leave the vehicles where they stopped unless an officer allows the move or the road is fully blocked — then mark their position on the road first.",
    commonMistake:
      "Driving off after a small bump because nobody looked hurt — the duty to stop applies to damage too.",
    testHint:
      "Two things you must not do: don't drive away, and don't drink alcohol or take a narcotic drug before you have reported and been medically examined if an officer asks for it.",
    relatedRules: ["RR2", "RR9"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 302(1)-(2) (turning procedure), reg 300 (signal duration)
  {
    code: "RR26",
    title: "Turning at intersections",
    category: "intersections",
    summary: "Position early, signal early, and only turn once you can do it without getting in anyone's way.",
    rule: "For a left turn you must signal before you get there and steer as near to the left of the roadway as conditions allow. For a right turn you must signal, move as near as you can to just left of the middle of the road (or to the right side on a one-way), and you may not start the turn unless you can finish it without obstructing or endangering other traffic.",
    whatToDo:
      "Signal in good time, get into position before the intersection, and wait for a real gap in oncoming traffic before turning right. Cross into the right half of the road only inside the intersection itself, and keep left of any traffic island.",
    commonMistake:
      "Cutting the corner on a right turn and ending up on the wrong side of the road you are turning into.",
    testHint:
      "Examiners mark your position and signal before the turn, not only the turn — drifting across late costs you.",
    relatedRules: ["RR1", "RR5", "RR6"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — reg 286(1)(b) (sign shapes by class), reg 286A(1)(b)(iii)
  // (a temporary version of a sign takes a yellow background: "a white, blue or
  // green background becomes yellow retro-reflective"); Sch 1 sign classes.
  // Added 2026-07-31 to host RS-005, RS-019 and RS-036, which test how the sign
  // CLASSES are told apart. No single sign row can carry a class-level question,
  // which is why they had no objective — see docs/question-verify/README.md.
  {
    code: "RR27",
    title: "Reading road signs: shape and colour",
    category: "signals",
    summary:
      "Shape tells you the class, colour tells you whether it is temporary.",
    rule: "Road signs fall into classes you can tell apart on sight. A triangle with a red border, standing on its base, is a permanent warning. A circle is regulatory — it commands or prohibits. A rectangle is information or guidance. Where a temporary version of a sign is provided, its background becomes yellow, and the temporary sign overrides the permanent one it replaces.",
    whatToDo:
      "Read the shape first to know what kind of instruction you are being given, then the symbol for the detail. At roadworks, obey the yellow signs even where they contradict the permanent ones beside them.",
    commonMistake:
      "Treating a yellow roadworks sign as advisory. It is temporary, not optional, and it outranks the permanent signs.",
    testHint:
      "Shape is the fastest discriminator in the test: triangle = warning, circle = regulatory, rectangle = information. A yellow background never means 'advisory' — it means temporary.",
    relatedRules: ["RR7", "RR29"],
    reviewStatus: "draft",
  },

  // Source: SADC RTSM Vol 2 Ch 7 (Railway Crossings, May 2012) — §7.2.1 modes of
  // control, §7.2.3 sign control, §7.2.4 flashing red disc, §7.2.5 boom operation,
  // Table 7.2 protection classification; NRTR 2000 — Sch 1 W318, reg 286 (8)(b)
  // (flashing red signals mounted below R1, above W403/W404, illuminated only when
  // a train is approaching).
  //
  // REWRITTEN 2026-07-31 against Vol 2 Ch 7, which was obtained after the first
  // draft. Three claims in that draft were wrong and are corrected here:
  //   - it framed crossings as "controlled or uncontrolled". The manual's four
  //     modes are flagman, YIELD R2, STOP R1, and flashing red disc + STOP R1.
  //     R1/R2 control is PERMANENT — you stop or yield every time, train or not.
  //   - it treated the boom as the control. §7.2.5 ¶1: a safety boom "should be
  //     considered as a high visibility hazard marker warning device and not as a
  //     form of railway crossing control". Booms appear only at the highest
  //     protection class, alongside FRD + R1.
  //   - it repeated the claim (from docs/archive/handover-2026-07-30.md) that W318 is the
  //     UNCONTROLLED crossing. Sch 1: W318 "Warns a road user that a railway
  //     crossing is ahead" — an advance warning sign used at EVERY protection
  //     class per Table 7.2. The markers at the crossing are W403 (single line)
  //     and W404 (two or more lines).
  {
    code: "RR28",
    title: "Railway level crossings",
    category: "intersections",
    summary:
      "A stop sign at a crossing means stop every time — not only when a train is coming.",
    rule: "Every railway crossing carries a hazard marker at the rails — W403 for a single line, W404 for two or more — and normally an advance warning sign W318 further back. How you are controlled at the crossing itself varies: by a YIELD sign R2, by a STOP sign R1, by flashing red disc signals used together with a STOP sign R1, or by a flagman. Control by R1 or R2 is permanent and applies whether or not a train is anywhere near. The flashing red signals sit below the stop sign and are lit only when a train is approaching.",
    whatToDo:
      "Read which control you have. At a STOP sign you stop completely every time, then look both ways along the line before moving. At a YIELD sign you slow and give way. If the red signals are flashing, wait — a train is coming. Never move onto the rails unless you can clear them completely on the far side.",
    commonMistake:
      "Driving around a lowered boom because no train is visible. A second train on the other line is exactly what that manoeuvre hides. The other error is treating a stop sign at a crossing as advisory when the line looks quiet — it is not.",
    testHint:
      "The answer is never 'proceed if no train is visible' and never 'sound the hooter and cross'. Note also that the boom is a warning device, not the control: the stop sign and the flashing signals are what oblige you to stop.",
    relatedRules: ["RR7", "RR27"],
    reviewStatus: "draft",
  },

  // Source: NRTR 2000 — Sch 1 guidance and information sign classes; reg 286A
  // (colour). Added 2026-07-31 to host RS-017, RS-018, RS-021 and RS-022, which
  // test the GD / GF / GFS families and IN1-IN3. The sign library holds 26
  // guidance rows but not those specific codes, so the questions had nowhere to
  // point. Ingesting the artwork for those families is separate and still open.
  {
    code: "RR29",
    title: "Guidance and information signs",
    category: "signals",
    summary:
      "The rectangles that tell you where things are — colour says what kind.",
    rule: "Guidance and information signs are rectangular and carry no command: they tell you where routes, places and services are. Colour sorts them. Green carries directions to routes and destinations, with route numbers shown in yellow. Brown marks tourism and places of interest. Service symbols such as a letter H point to a hospital or emergency medical services. On a freeway, countdown markers showing three, two and one diagonal bars stand at 300, 200 and 100 metres before an exit.",
    whatToDo:
      "Read direction signs early and change lanes in good time rather than at the exit itself. Use the countdown markers to judge the distance left, so you leave the freeway without braking hard.",
    commonMistake:
      "Reading a countdown marker as a lane count, or treating a green direction sign as an instruction to turn. Neither commands anything.",
    testHint:
      "Colour is the discriminator: green for routes and destinations, brown for tourism. Countdown bars are metres to the exit, not lanes.",
    relatedRules: ["RR22", "RR27"],
    reviewStatus: "draft",
  },

  // Source: NRTR reg 287(2) — "A temporary road sign shall only be used for a
  //   temporary condition"; reg 287(5)(a) — where two signs conflict, "a temporary
  //   road traffic sign shall take precedence over any other road traffic sign".
  //   SARTSM Vol 1 Ch 3: "All TEMPORARY advance warning signs shall consist of a
  //   black symbol on a yellow background with a red triangular border", and a
  //   temporary sign takes the permanent sign's number with a T prefix (W101 ->
  //   TW101). SARTSM Vol 1 Ch 2: "PERMANENT and TEMPORARY CONTROL signs retain the
  //   same SHAPES and COLOURS" — so a temporary STOP is still a red octagon, which
  //   is why "all temporary signs are yellow" is wrong. SARTSM Vol 2 Ch 3 §3.5.1:
  //   temporary signs are NOT roadworks-only — the manual names accident scenes,
  //   traffic signals out of order, and traffic control at schools and sporting
  //   events, and says the message is that "normal or anticipated conditions may
  //   not apply". Written 2026-08-03 to close the gap in docs/sign-question-coverage.md:
  //   temporary/roadworks is 17 of 82 observed real exam items and we had nothing.
  {
    code: "RR30",
    title: "Temporary road signs",
    category: "signals",
    summary:
      "Yellow means the rules changed today — and a temporary sign beats the permanent one.",
    rule: "A temporary road sign may only be used for a temporary condition. Temporary warning signs carry a black symbol on a yellow background inside a red triangle, and take the permanent sign's number with a T in front — W101 becomes TW101. Control signs are the exception: a temporary stop or yield keeps its normal shape and colour. Where a temporary sign and any other sign conflict, the temporary sign takes precedence.",
    whatToDo:
      "Treat a yellow sign as the instruction that counts, even where a permanent sign beside it says something different. Slow to the temporary limit and expect the layout to have changed since the permanent signs went up.",
    commonMistake:
      "Believing temporary signs only ever mean roadworks, or that a permanent sign outranks them because it is bolted down. Both are wrong: temporary signs also cover accident scenes, signals out of order and traffic control at schools and events, and they take precedence.",
    testHint:
      "Two facts do most of the work: yellow background with a red triangle for a temporary warning, and temporary beats permanent when they disagree. Watch for the trap that a temporary stop sign is still a red octagon.",
    relatedRules: ["RR29", "RR27"],
    reviewStatus: "draft",
  },
];

export function getRule(code: string): RoadRule | undefined {
  return ROAD_RULES.find((r) => r.code === code);
}
