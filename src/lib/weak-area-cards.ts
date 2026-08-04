import { getRule } from "@/content/road-rules";
import { getControl } from "@/content/vehicle-controls";
import { getApprovedSignByCode } from "@/lib/supabase/queries";
import type { Topic } from "@/lib/types";
import type { WeakAreas } from "@/lib/weak-areas";

/** A resolved "recommended next" card. */
export interface WeakAreaCard {
  href: string;
  title: string;
  /** Why this surfaced, e.g. "3 of 5 wrong". */
  reason: string;
  topic: Topic;
}

const TOPIC_HREF: Record<Topic, string> = {
  signs: "/learn/road-signs",
  rules: "/learn/rules",
  controls: "/learn/controls",
};

const TOPIC_LABEL: Record<Topic, string> = {
  signs: "Road signs",
  rules: "Rules of the road",
  controls: "Vehicle controls",
};

/**
 * Resolve ranked weak areas into cards (design §3, §4).
 *
 * An objective code may not resolve — a sign can be unapproved or removed after
 * a learner answered a question about it. Those are dropped and the shortfall is
 * backfilled from the next eligible objective, so the row keeps its size instead
 * of silently shrinking.
 *
 * Topic cards come last and only exist where the coverage rule fired: the
 * learner is weak in a topic whose questions we can't map to a lesson. As of
 * 2026-08-04 that shortfall is closed — all 274 approved questions resolve to a
 * written lesson (markings included, so the K53-30 caveat that used to sit here
 * is gone). The fallback stays because resolution is per-request: a sign can be
 * withdrawn after a learner answered a question about it, and then "road signs
 * need work" is honest where naming one objective would be a confident guess.
 */
export async function resolveWeakAreaCards(
  weak: WeakAreas,
  limit = 3,
): Promise<WeakAreaCard[]> {
  const cards: WeakAreaCard[] = [];

  for (const o of weak.objectives) {
    if (cards.length >= limit) break;
    const reason = `${o.wrong} of ${o.attempted} wrong`;

    if (o.objectiveCode.startsWith("RR")) {
      const rule = getRule(o.objectiveCode);
      if (rule) {
        cards.push({
          href: `/learn/rules/${rule.code}`,
          title: rule.title,
          reason,
          topic: o.topic,
        });
      }
      continue;
    }

    if (o.objectiveCode.startsWith("VC")) {
      const control = getControl(o.objectiveCode);
      if (control) {
        cards.push({
          href: `/learn/controls/${control.code}`,
          title: control.name,
          reason,
          topic: o.topic,
        });
      }
      continue;
    }

    // Anything else is a sign code — a DB lookup that gates on both review
    // gates, so it can legitimately return nothing.
    const sign = await getApprovedSignByCode(o.objectiveCode);
    if (sign) {
      cards.push({
        href: `/learn/road-signs/${sign.code}`,
        title: sign.name,
        reason,
        topic: o.topic,
      });
    }
  }

  for (const t of weak.topics) {
    if (cards.length >= limit) break;
    // Don't stack a vague topic card on top of a precise one for the same topic.
    if (cards.some((c) => c.topic === t.topic)) continue;
    cards.push({
      href: TOPIC_HREF[t.topic],
      title: TOPIC_LABEL[t.topic],
      reason: `${t.wrong} wrong recently`,
      topic: t.topic,
    });
  }

  return cards;
}
