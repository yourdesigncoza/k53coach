import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  rankWeakAreas,
  wilsonLowerBound,
  type AttemptJoin,
} from "./weak-areas.ts";
import type { Topic } from "./types.ts";

/**
 * Tests for the weak-area ranking (docs/design-weak-area-next-lesson.md).
 *
 * These exist because the scoring heuristic changed twice under test during
 * development: an adversarial review killed the raw error rate, and then the
 * Laplace-smoothed replacement failed its own test (1-of-2 wrong scored 0.500
 * against 7-of-20 at 0.364 — still the wrong order) which is how it ended up on
 * the Wilson lower bound. Anyone tempted to "simplify" the scorer should have to
 * break these first.
 *
 * Run with: npm test
 */

const att = (
  objectiveCode: string | null,
  correct: boolean,
  createdAt: string,
  topic: Topic = "rules",
): AttemptJoin => ({ objectiveCode, topic, correct, createdAt });

describe("wilsonLowerBound", () => {
  test("a small sample does not outrank stronger evidence", () => {
    // The bug that killed both earlier scorers: 1-of-2 wrong (50%) must not
    // beat 7-of-20 (35%), because the latter is ten times the evidence.
    assert.ok(wilsonLowerBound(1, 2) < wilsonLowerBound(7, 20));
  });

  test("total failure still surfaces even on a small sample", () => {
    // Getting every attempt wrong is a real signal, so 2-of-2 should outrank
    // 7-of-20 — smoothing must not flatten this away.
    assert.ok(wilsonLowerBound(2, 2) > wilsonLowerBound(7, 20));
  });

  test("returns 0 for no attempts rather than dividing by zero", () => {
    assert.equal(wilsonLowerBound(0, 0), 0);
  });
});

describe("rankWeakAreas — ordering", () => {
  test("ranks the better-evidenced weakness first", () => {
    const rows = [
      att("RR1", false, "2026-07-01"),
      att("RR1", true, "2026-07-02"), // 1 of 2 wrong
      ...Array.from({ length: 13 }, (_, i) =>
        att("RR2", true, `2026-07-${String(i + 1).padStart(2, "0")}`),
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        att("RR2", false, `2026-07-${String(i + 14).padStart(2, "0")}`),
      ), // 7 of 20 wrong
    ];
    assert.equal(rankWeakAreas(rows).objectives[0]?.objectiveCode, "RR2");
  });

  test("breaks ties on the most recent struggle, not the oldest", () => {
    // v1 of the design sorted lastSeen ASC and called it "older struggles
    // first" — a next-lesson recommender that recommends what you already fixed.
    const rows = [
      att("RR3", false, "2026-05-01"),
      att("RR3", false, "2026-05-02"),
      att("RR4", false, "2026-07-20"),
      att("RR4", false, "2026-07-21"),
    ];
    assert.equal(rankWeakAreas(rows).objectives[0]?.objectiveCode, "RR4");
  });
});

describe("rankWeakAreas — eligibility", () => {
  test("ignores a single unlucky answer", () => {
    assert.equal(rankWeakAreas([att("RR5", false, "2026-07-20")]).objectives.length, 0);
  });

  test("a perfect record is not a weakness", () => {
    const rows = [att("RR6", true, "2026-07-20"), att("RR6", true, "2026-07-21")];
    assert.equal(rankWeakAreas(rows).objectives.length, 0);
  });

  test("empty input is safe", () => {
    assert.deepEqual(rankWeakAreas([]), { objectives: [], topics: [] });
  });

  test("respects the limit", () => {
    const rows = ["A", "B", "C", "D", "E"].flatMap((c) => [
      att(`RR${c}`, false, "2026-07-20"),
      att(`RR${c}`, false, "2026-07-21"),
    ]);
    assert.equal(rankWeakAreas(rows, 3).objectives.length, 3);
  });
});

describe("rankWeakAreas — coverage rule", () => {
  // Live case: 12 of 47 signs questions still have no objective_code because
  // the warning/guidance marking series isn't written. A learner failing those
  // must not be told their weakest area is whatever we happened to map.
  test("surfaces a topic card when most wrong answers are unmapped", () => {
    const rows = [
      att(null, false, "2026-07-20", "signs"),
      att(null, false, "2026-07-21", "signs"),
      att("R1", false, "2026-07-20", "signs"),
      att("R1", true, "2026-07-21", "signs"),
    ];
    const r = rankWeakAreas(rows);
    assert.ok(r.topics.some((t) => t.topic === "signs"));
    assert.ok(r.objectives.some((o) => o.objectiveCode === "R1"));
  });

  test("stays quiet when the topic is mostly mapped", () => {
    const rows = [
      att("R1", false, "2026-07-20", "signs"),
      att("R1", false, "2026-07-21", "signs"),
      att("R2", false, "2026-07-20", "signs"),
      att("R2", false, "2026-07-21", "signs"),
      att(null, false, "2026-07-20", "signs"),
    ];
    assert.equal(rankWeakAreas(rows).topics.length, 0);
  });
});
