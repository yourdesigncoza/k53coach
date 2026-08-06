import { test } from "node:test";
import assert from "node:assert/strict";
import type { Topic } from "@/lib/types";
import { pointTitle, type AssessmentPoint } from "./assessment-core.ts";

/** Stand-in for the `topics` namespace — Afrikaans, since /af is the failure case. */
const AF_TOPIC: Record<Topic, string> = {
  signs: "Padtekens",
  rules: "Reëls van die Pad",
  controls: "Voertuigkontroles",
};
const topicLabel = (topic: Topic) => AF_TOPIC[topic];

const point = (title: string, topic: Topic): AssessmentPoint => ({
  title,
  note: "",
  topic,
});

test("model output renders our topic label, not the model's own wording", () => {
  // The live defect: the model returned "Voertuigbeheer" for a section the app
  // calls "Voertuigkontroles", so one page carried two words for one section.
  const p = point("Voertuigbeheer", "controls");
  assert.equal(pointTitle(p, {}, topicLabel), "Voertuigkontroles");
});

test("model titles are replaced even when they happen to be plausible", () => {
  // "Reëls van die pad" differs from ours only in casing. Substituting on
  // mismatch alone would let near-misses through; the rule is unconditional.
  const p = point("Reëls van die pad", "rules");
  assert.equal(pointTitle(p, {}, topicLabel), "Reëls van die Pad");
});

test("fallback titles are left alone", () => {
  // Fallback points are built from `topics` already — re-deriving is a no-op at
  // best, and at worst re-translates a string that was never the model's.
  const p = point("Padtekens", "signs");
  assert.equal(pointTitle(p, { fallback: true }, topicLabel), "Padtekens");
});

test("a fallback title that is not a section name survives", () => {
  // `examFocusPassingTitle` is advice, not a heading. This is the case that
  // makes the fallback exemption load-bearing rather than tidy.
  const p = point("Hou jou konsekwentheid", "controls");
  assert.equal(
    pointTitle(p, { fallback: true }, topicLabel),
    "Hou jou konsekwentheid",
  );
});
