// Relative + explicit .ts: this module is unit-tested under node --experimental-strip-types,
// which does not resolve the "@/" alias for VALUE imports (see readiness-sample.test.ts).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  assemblePaper,
  EXAM_FORMAT_B,
  RECENT_ATTEMPTS_SUPPRESSED,
  type PoolQuestion,
} from "./exam.ts";
import type { Topic } from "@/lib/types";

/** A pool of `n` questions per topic, ids like "rules-0". */
function makePool(perTopic: number): PoolQuestion[] {
  const topics: Topic[] = ["rules", "signs", "controls"];
  return topics.flatMap((topic) =>
    Array.from({ length: perTopic }, (_, i) => ({
      id: `${topic}-${i}`,
      topic,
      difficulty: 2 as const,
      prompt: `${topic} question ${i}`,
      options: ["a", "b", "c"],
      answer: 0,
      explanation: "because",
    })),
  );
}

/** Deterministic RNG so a failure is reproducible rather than "sometimes". */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const idsOf = (paper: ReturnType<typeof assemblePaper>) =>
  paper.sections.flatMap((s) => s.questions.map((q) => q.id));

describe("assemblePaper — repeat suppression", () => {
  test("suppression is off by default (no history passed)", () => {
    const paper = assemblePaper(makePool(60), EXAM_FORMAT_B, seeded(1));
    assert.equal(idsOf(paper).length, 64);
    assert.equal(paper.shortened, false);
  });

  test("a healthy pool yields a paper with zero overlap against the last one", () => {
    const pool = makePool(60); // rules 60 ≥ 30 drawn ×2, signs 60 ≥ 28 ×2
    const first = assemblePaper(pool, EXAM_FORMAT_B, seeded(7));
    const second = assemblePaper(pool, EXAM_FORMAT_B, seeded(8), idsOf(first));

    const overlap = idsOf(second).filter((id) => idsOf(first).includes(id));
    assert.deepEqual(overlap, [], "second paper reused a question it didn't need to");
  });

  test("still returns a full paper when history covers most of the pool", () => {
    // 32 per topic: rules draws 30, so only 2 unseen remain and 28 must be repeats.
    const pool = makePool(32);
    const first = assemblePaper(pool, EXAM_FORMAT_B, seeded(3));
    const second = assemblePaper(pool, EXAM_FORMAT_B, seeded(4), idsOf(first));

    assert.equal(idsOf(second).length, 64, "suppression must never starve a section");
    assert.equal(second.shortened, false);
    assert.equal(new Set(idsOf(second)).size, 64, "no duplicates within one paper");
  });

  test("top-up prefers the least recently seen question", () => {
    // One topic, pool of 7, draw 6 — so exactly one question can be unseen-only.
    const pool: PoolQuestion[] = Array.from({ length: 7 }, (_, i) => ({
      id: `controls-${i}`,
      topic: "controls" as Topic,
      difficulty: 2 as const,
      prompt: `q${i}`,
      options: ["a", "b", "c"],
      answer: 0,
      explanation: "because",
    }));
    const format = {
      ...EXAM_FORMAT_B,
      sections: [{ topic: "controls" as Topic, count: 6, pass: 5 }],
    };

    // controls-0 is the MOST recent, controls-6 the least. Only 6 of 7 fit, so
    // exactly one must be dropped — it has to be the freshest repeat.
    const history = ["controls-0", "controls-1", "controls-2", "controls-3", "controls-4", "controls-5"];
    const paper = assemblePaper(pool, format, seeded(11), history);
    const picked = idsOf(paper);

    assert.equal(picked.length, 6);
    assert.ok(picked.includes("controls-6"), "the unseen question must appear");
    assert.ok(
      !picked.includes("controls-0"),
      "the most recently seen question should be the one dropped",
    );
  });

  test("a question in both recent papers ranks by its more recent sitting", () => {
    const pool: PoolQuestion[] = Array.from({ length: 3 }, (_, i) => ({
      id: `controls-${i}`,
      topic: "controls" as Topic,
      difficulty: 2 as const,
      prompt: `q${i}`,
      options: ["a", "b", "c"],
      answer: 0,
      explanation: "because",
    }));
    const format = {
      ...EXAM_FORMAT_B,
      sections: [{ topic: "controls" as Topic, count: 2, pass: 2 }],
    };

    // controls-2 appears in the older paper AND the newer one. Ranked by its
    // newest appearance (index 0) it is the freshest repeat, so it is dropped —
    // if duplicates were ranked by their LAST occurrence it would survive.
    const history = ["controls-2", "controls-0", "controls-1", "controls-2"];
    const picked = idsOf(assemblePaper(pool, format, seeded(5), history));

    assert.equal(picked.length, 2);
    assert.ok(!picked.includes("controls-2"));
  });

  test("history containing ids outside the pool is harmless", () => {
    const pool = makePool(60);
    const paper = assemblePaper(pool, EXAM_FORMAT_B, seeded(9), [
      "withdrawn-1",
      "rules-0",
      "not-a-question",
    ]);
    assert.equal(idsOf(paper).length, 64);
    assert.ok(!idsOf(paper).includes("rules-0"));
  });

  test("a short pool still shortens and scales its pass mark", () => {
    // 4 controls only: section wants 6 at pass 5 → 4 at pass ceil(5*4/6) = 4.
    const pool = makePool(60).filter(
      (q) => q.topic !== "controls" || Number(q.id.split("-")[1]) < 4,
    );
    const paper = assemblePaper(pool, EXAM_FORMAT_B, seeded(2), []);
    const controls = paper.sections.find((s) => s.topic === "controls")!;

    assert.equal(paper.shortened, true);
    assert.equal(controls.questions.length, 4);
    assert.equal(controls.passRequired, 4);
  });

  test("the suppression window is two papers", () => {
    assert.equal(RECENT_ATTEMPTS_SUPPRESSED, 2);
  });
});
