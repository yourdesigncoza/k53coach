/**
 * Retrieval + gate tests, driven by `__fixtures__/coach-adversarial.json`.
 *
 * The fixture is the spec, not a report: `MIN_SCORE`, `MAX_OOV` and
 * `COVERAGE_EXPONENT` were fitted to make this pass. It asserts BOTH directions
 * — hostile prompts must be refused or contained, and real learner phrasings
 * must never be blocked — so loosening a threshold to rescue one class fails
 * another. That is the point: an earlier design was broken by prompts outside a
 * hand-checked list of fifteen, so the list is now committed and asserted.
 *
 * The corpus is built from real content: rules and controls straight from the
 * TypeScript libraries, signs and questions from a committed snapshot of the
 * live tables (scripts/coach/snapshot-corpus.mjs). Thresholds fitted against toy
 * passages would be fitted against nothing.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCorpus } from "./coach-corpus.ts";
import {
  buildIndex,
  codeFamily,
  extractCodes,
  retrieve,
  stem,
  tokenise,
  topK,
  MAX_QUERY_CHARS,
} from "./coach-retrieval.ts";

const fixtureDir = new URL("./__fixtures__/", import.meta.url);
const readFixture = (name: string) =>
  JSON.parse(readFileSync(new URL(name, fixtureDir), "utf8"));

const snapshot = readFixture("coach-corpus-snapshot.json");
const fixture = readFixture("coach-adversarial.json");

const corpus = buildCorpus(snapshot.signs, snapshot.questions);
const index = buildIndex(corpus.passages);

interface QueryCase {
  id: string;
  class: string;
  text: string;
  expectGate: "pass" | "refuse" | "either" | "reject_empty" | "reject_too_long";
  expectRetrieves?: string;
  priorUserTurn?: string;
  expand?: { repeat: string; times: number };
}

const cases: QueryCase[] = fixture.queries;

const textOf = (c: QueryCase) =>
  c.expand ? c.expand.repeat.repeat(c.expand.times) : c.text;

const results = cases.map((c) => ({
  case: c,
  result: retrieve(textOf(c), index, { priorQuestion: c.priorUserTurn }),
}));

// ── the corpus itself ────────────────────────────────────────────────────────

test("corpus covers all four sources", () => {
  const byKind = new Map<string, number>();
  for (const p of corpus.passages) byKind.set(p.kind, (byKind.get(p.kind) ?? 0) + 1);

  assert.equal(byKind.get("rule"), 30);
  assert.equal(byKind.get("control"), 22);
  assert.ok((byKind.get("sign") ?? 0) > 300, "signs present");
  assert.ok((byKind.get("question") ?? 0) > 200, "questions present");
  assert.equal(corpus.passages.length, snapshot.counts.signs + snapshot.counts.questions + 52);
});

test("every passage carries a body, a resolving href and a hash", () => {
  for (const p of corpus.passages) {
    assert.ok(p.body.trim().length > 0, `${p.id} has a body`);
    assert.match(p.href, /^\/learn\//, `${p.id} href`);
    assert.match(p.hash, /^[0-9a-f]{64}$/, `${p.id} hash`);
  }
});

test("corpus revision changes when content changes", () => {
  const other = buildCorpus(snapshot.signs.slice(0, -1), snapshot.questions);
  assert.notEqual(corpus.revision, other.revision);
});

// ── tokenising ───────────────────────────────────────────────────────────────

test("plural stemming folds the inflection that cost recall", () => {
  assert.equal(stem("crossings"), stem("crossing"));
  assert.equal(stem("pedestrians"), stem("pedestrian"));
  assert.equal(stem("lights"), stem("light"));
  // Not over-eager: "ss" endings and short words are left alone.
  assert.equal(stem("glass"), "glass");
  assert.equal(stem("bus"), "bus");
});

test("frame words are dropped but direction words are kept", () => {
  const tokens = tokenise("What does it mean when I must give way to the right?");
  assert.ok(!tokens.includes("what"));
  assert.ok(!tokens.includes("mean"));
  assert.ok(tokens.includes("right"), "'right' is a direction, not framing");
});

test("code extraction ignores rand amounts", () => {
  assert.deepEqual(extractCodes("What does R1 mean?"), ["R1"]);
  assert.deepEqual(extractCodes("what does w302 mean"), ["W302"]);
  assert.deepEqual(extractCodes("My invoice shows R2 000"), []);
  assert.deepEqual(extractCodes("It cost R1 500 to fix"), []);
});

// ── input bounds (the cost model rests on these) ─────────────────────────────

test("empty and over-long input is rejected before retrieval", () => {
  assert.equal(retrieve("", index).decision, "reject_empty");
  assert.equal(retrieve("    ", index).decision, "reject_empty");

  const padded = "stop sign ".repeat(2000);
  assert.ok(padded.length > MAX_QUERY_CHARS);
  const result = retrieve(padded, index);
  assert.equal(result.decision, "reject_too_long");
  assert.equal(result.passages.length, 0, "no grounding is assembled for a rejected input");
});

// ── the grounding window ─────────────────────────────────────────────────────

test("top-k holds one passage per code family", () => {
  const { scored } = retrieve("what is the speed limit", index);
  const window = topK(scored, 8);
  const families = window.map((p) => `${p.kind}:${codeFamily(p.code)}`);
  assert.equal(new Set(families).size, families.length, "no family appears twice");
});

test("a passing query returns grounding, a refused one returns none", () => {
  const good = retrieve("What does a stop sign mean?", index);
  assert.equal(good.decision, "pass");
  assert.ok(good.passages.length > 0);

  const bad = retrieve("what colour is the sky", index);
  assert.equal(bad.decision, "refuse");
  assert.equal(bad.passages.length, 0);
});

// ── per-case expectations ────────────────────────────────────────────────────

test("no real learner question is ever blocked", () => {
  const blocked = results
    .filter(({ case: c, result }) => c.expectGate === "pass" && result.decision !== "pass")
    .map(({ case: c, result }) => `${c.id} (${result.decision}, top=${result.topScore.toFixed(2)}, oov=${result.oovRatio.toFixed(2)}): ${c.text}`);
  assert.deepEqual(blocked, [], `refused a question a learner would really ask:\n${blocked.join("\n")}`);
});

test("prompts that must never reach the model do not", () => {
  const leaked = results
    .filter(({ case: c, result }) => c.expectGate === "refuse" && result.decision !== "refuse")
    .map(({ case: c, result }) => `${c.id} (top=${result.topScore.toFixed(2)}, oov=${result.oovRatio.toFixed(2)}): ${c.text}`);
  assert.deepEqual(leaked, [], `reached the model:\n${leaked.join("\n")}`);
});

test("an on-topic turn does not launder an off-topic follow-up", () => {
  // The drift bypass: if the previous question's vocabulary counted towards this
  // turn's domain check, one legitimate question would buy an unlimited number
  // of off-topic ones.
  const drift = retrieve("count to a million", index, {
    priorQuestion: "What does a stop sign mean?",
  });
  assert.equal(drift.decision, "refuse");
});

// ── class aggregates ─────────────────────────────────────────────────────────

for (const aggregate of fixture.aggregates) {
  if (aggregate.class === "in_scope_recall") continue;

  test(`${aggregate.class}: ${aggregate.metric} >= ${aggregate.min}`, () => {
    const wanted = aggregate.metric === "refusedRate" ? "refuse" : "pass";
    const opposite = wanted === "refuse" ? "pass" : "refuse";
    // A case with a hard expectation in the OTHER direction is asserted
    // per-item and is not part of this rate — the follow-up class carries both
    // the recall cases and the drift case, and averaging them measures nothing.
    const rows = results.filter(
      ({ case: c }) => c.class === aggregate.class && c.expectGate !== opposite,
    );
    assert.ok(rows.length > 0, "class has cases");
    const hits = rows.filter(({ result }) => result.decision === wanted).length;
    const rate = hits / rows.length;
    assert.ok(
      rate >= aggregate.min,
      `${aggregate.class} ${aggregate.metric} ${rate.toFixed(2)} < ${aggregate.min}\n${aggregate.why}`,
    );
  });
}

test("the expected lesson is in the grounding window", () => {
  const checked = results.filter(({ case: c }) => c.expectRetrieves);
  const misses = checked.filter(({ case: c, result }) => {
    const window = topK(result.scored, 8);
    return !window.some(
      (p) => p.code === c.expectRetrieves || codeFamily(p.code) === codeFamily(c.expectRetrieves!),
    );
  });
  const rate = (checked.length - misses.length) / checked.length;
  const min = fixture.aggregates.find((a: { class: string }) => a.class === "in_scope_recall").min;
  assert.ok(
    rate >= min,
    `recall ${rate.toFixed(2)} < ${min}. Missed:\n${misses
      .map(({ case: c, result }) => `  ${c.id} wanted ${c.expectRetrieves}, got ${topK(result.scored, 3).map((p) => p.code).join(",")}`)
      .join("\n")}`,
  );
});
