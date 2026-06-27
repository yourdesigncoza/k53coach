import type { AssetProvenance, RoadSign } from "@/lib/types";

/**
 * Sample Road Signs library (DB1).
 *
 * SOURCING (updated): sign SVGs come from the SADC/SA Public-Domain set on
 * Wikimedia Commons (PD under SA Copyright Act §12(8)(a)), licence-audited
 * per file and verified against the official Department of Transport chart
 * (RTSigns_charts.pdf). See docs/road-sign-assets.md for the pipeline.
 *
 * The glyphs currently rendered are local original-redraw PLACEHOLDERS
 * (src/components/signs) shown until the audited Wikimedia SVGs land in
 * /public/signs. The real moat is the ORIGINAL learner content below
 * (plain-English, behaviour, common mistakes, test hints) + questions — never
 * the glyph itself.
 */

/** Default provenance for the current placeholder glyphs. */
const PLACEHOLDER_PROVENANCE: AssetProvenance = {
  source: "original-redraw (placeholder)",
  licence: "Original work — to be replaced by audited PD-SADC SVG",
  attributionRequired: false,
  verifiedAgainst: "RTSigns_charts.pdf (pending)",
  assetStatus: "needs_review",
};

type SignSeed = Omit<RoadSign, "provenance"> & {
  provenance?: AssetProvenance;
};

const SIGN_SEEDS: SignSeed[] = [
  {
    code: "R1-STOP",
    name: "Stop",
    category: "regulatory",
    subcategory: "Command",
    glyph: "stop",
    formalMeaning:
      "Bring the vehicle to a complete stop at the stop line and only proceed when it is safe.",
    plainEnglish:
      "Stop completely — wheels not moving — every single time, even if the road looks empty.",
    behaviour:
      "Come to a full stop behind the line, look left, right and ahead, then go only when the way is clear.",
    commonMistake:
      "Rolling slowly through instead of stopping fully. A rolling stop is still a fail.",
    testHint:
      "An eight-sided red sign always means STOP — the shape alone tells you, even from a distance.",
    relatedSigns: ["R2-YIELD"],
    reviewStatus: "draft",
  },
  {
    code: "R2-YIELD",
    name: "Yield",
    category: "regulatory",
    subcategory: "Command",
    glyph: "yield",
    formalMeaning:
      "Give right of way to traffic and pedestrians before entering the road or intersection.",
    plainEnglish:
      "Slow down and let others go first. You only need to stop if something is coming.",
    behaviour:
      "Reduce speed, be ready to stop, and give way to anyone already in or approaching the intersection.",
    commonMistake:
      "Treating yield like stop (stopping when the road is clear) or ignoring it and not giving way.",
    testHint:
      "A downward-pointing triangle with a red border means yield / give way.",
    relatedSigns: ["R1-STOP"],
    reviewStatus: "draft",
  },
  {
    code: "R3-NOENTRY",
    name: "No Entry",
    category: "regulatory",
    subcategory: "Prohibition",
    glyph: "no-entry",
    formalMeaning: "Vehicles may not enter the road beyond this sign.",
    plainEnglish: "Do not drive in here — this way is closed to you.",
    behaviour: "Do not enter. Find an alternative route.",
    commonMistake:
      "Confusing it with the one-way sign. No-entry blocks you; one-way just shows direction.",
    testHint:
      "A solid red circle with a single white horizontal bar means no entry.",
    relatedSigns: ["G3-ONEWAY", "R4-NOSTOP"],
    reviewStatus: "draft",
  },
  {
    code: "R5-SPEED60",
    name: "Speed Limit 60",
    category: "regulatory",
    subcategory: "Prohibition",
    glyph: "speed-60",
    formalMeaning:
      "Maximum speed of 60 km/h applies from this sign until cancelled or changed.",
    plainEnglish: "Do not drive faster than 60 km/h from here onwards.",
    behaviour:
      "Keep your speed at or below 60 km/h until you see a different limit.",
    commonMistake:
      "Thinking the limit ends at the next corner. It stays until another speed sign changes it.",
    testHint:
      "A number inside a red circle is the maximum speed, not a suggestion.",
    relatedSigns: ["R6-NOOVERTAKE"],
    reviewStatus: "draft",
  },
  {
    code: "R6-NOOVERTAKE",
    name: "No Overtaking",
    category: "regulatory",
    subcategory: "Prohibition",
    glyph: "no-overtaking",
    formalMeaning: "Overtaking other vehicles is prohibited beyond this sign.",
    plainEnglish: "Do not pass the car in front until the rule is cancelled.",
    behaviour:
      "Stay in your lane behind the vehicle ahead — no passing, even if it feels slow.",
    commonMistake:
      "Overtaking 'just one slow car'. The prohibition applies the whole way until lifted.",
    testHint:
      "Two cars side by side in a red circle means no overtaking.",
    relatedSigns: ["R5-SPEED60"],
    reviewStatus: "draft",
  },
  {
    code: "R4-NOSTOP",
    name: "No Stopping",
    category: "regulatory",
    subcategory: "Prohibition",
    glyph: "no-stopping",
    formalMeaning:
      "Stopping a vehicle is prohibited along the length of road indicated.",
    plainEnglish:
      "You may not stop here at all — not even briefly to drop someone off.",
    behaviour: "Keep moving; do not halt the vehicle in this zone.",
    commonMistake:
      "Confusing no-stopping with no-parking. No-stopping is stricter — you cannot even pause.",
    testHint:
      "A red circle crossed by two lines means no stopping (stricter than the single-line no-parking).",
    relatedSigns: ["R3-NOENTRY"],
    reviewStatus: "draft",
  },
  {
    code: "W1-PEDCROSS",
    name: "Pedestrian Crossing Ahead",
    category: "warning",
    subcategory: "Warning",
    glyph: "pedestrian",
    formalMeaning:
      "Warns that a pedestrian crossing is ahead; be prepared to give way.",
    plainEnglish:
      "People may be crossing soon — slow down and watch for them.",
    behaviour:
      "Ease off the accelerator, scan both pavements, and be ready to stop for pedestrians.",
    commonMistake:
      "Assuming a warning sign means you must stop. It tells you to prepare, not to stop automatically.",
    testHint:
      "A triangle with a red border is a warning. The picture shows what to watch for.",
    relatedSigns: ["W2-SIGNAL", "W3-CROSSROADS"],
    reviewStatus: "draft",
  },
  {
    code: "W2-SIGNAL",
    name: "Traffic Signals Ahead",
    category: "warning",
    subcategory: "Warning",
    glyph: "signal",
    formalMeaning: "Warns that traffic signals (a robot) are ahead.",
    plainEnglish:
      "There is a robot coming up — get ready to stop if it turns red.",
    behaviour:
      "Check the signal early, cover the brake, and adjust speed so you can stop smoothly.",
    commonMistake:
      "Speeding up to 'beat' the robot when this sign appears.",
    testHint:
      "A triangle showing three stacked circles warns of traffic signals ahead.",
    relatedSigns: ["W1-PEDCROSS", "W3-CROSSROADS"],
    reviewStatus: "draft",
  },
  {
    code: "W3-CROSSROADS",
    name: "Crossroads Ahead",
    category: "warning",
    subcategory: "Warning",
    glyph: "crossroads",
    formalMeaning:
      "Warns of a crossroads ahead where roads intersect.",
    plainEnglish:
      "Roads cross ahead — other traffic may join or cross your path.",
    behaviour:
      "Reduce speed, check side roads, and be ready to give way as the rules require.",
    commonMistake:
      "Ignoring traffic that may enter from the side roads.",
    testHint:
      "A triangle with a plus-shaped symbol warns of a crossroads.",
    relatedSigns: ["W2-SIGNAL"],
    reviewStatus: "draft",
  },
  {
    code: "G3-ONEWAY",
    name: "One Way",
    category: "guidance",
    subcategory: "Direction",
    glyph: "one-way",
    formalMeaning:
      "Traffic on this road may travel in the indicated direction only.",
    plainEnglish:
      "This road runs in one direction — the way the arrow points.",
    behaviour: "Travel only in the direction shown by the arrow.",
    commonMistake:
      "Mistaking it for no-entry. One-way is informational (blue/black arrow); no-entry forbids you.",
    testHint:
      "A long arrow on a blue or black background shows the single permitted direction.",
    relatedSigns: ["R3-NOENTRY"],
    reviewStatus: "draft",
  },
];

/** Final library with provenance guaranteed on every record. */
export const ROAD_SIGNS: RoadSign[] = SIGN_SEEDS.map((s) => ({
  ...s,
  provenance: s.provenance ?? PLACEHOLDER_PROVENANCE,
}));

export function getSign(code: string): RoadSign | undefined {
  return ROAD_SIGNS.find((s) => s.code === code);
}

export const SIGN_CATEGORY_LABEL: Record<RoadSign["category"], string> = {
  regulatory: "Regulatory",
  warning: "Warning",
  guidance: "Guidance",
  marking: "Road Marking",
};
