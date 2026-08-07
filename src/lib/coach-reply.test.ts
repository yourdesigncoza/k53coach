/**
 * Validator tests — the scope boundary, driven by the `replies` half of
 * `__fixtures__/coach-adversarial.json`.
 *
 * Every case is a hand-built model reply paired with the passages it was given,
 * so this asserts what the validator does with output the model might really
 * produce. The accept cases matter as much as the rejects: a validator tuned only
 * to refuse degrades every learner to a template, which is the regression
 * `parseAssessment`'s "repair first, reject last" note already warns about.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildCoachSystem,
  buildCoachUser,
  entailmentScore,
  parseCoachReply,
  unitBearingNumbers,
  MAX_ANSWER_CHARS,
  MAX_PASSAGE_CHARS,
} from "./coach-reply.ts";

const fixture = JSON.parse(
  readFileSync(new URL("./__fixtures__/coach-adversarial.json", import.meta.url), "utf8"),
);

interface ReplyCase {
  id: string;
  class: string;
  locale?: string;
  passages: { code: string; body: string }[];
  reply?: Record<string, unknown> & { expand?: { repeat: string; times: number } };
  raw?: string;
  expect: "accept" | "reject";
  check?: string;
  why?: string;
}

const cases: ReplyCase[] = fixture.replies;

function rawFor(c: ReplyCase): string {
  if (c.raw) return c.raw;
  const reply = { ...c.reply };
  if (reply.expand) {
    reply.answer = (reply.expand as { repeat: string; times: number }).repeat.repeat(
      (reply.expand as { repeat: string; times: number }).times,
    );
    delete reply.expand;
  }
  return JSON.stringify(reply);
}

for (const c of cases) {
  test(`${c.id} [${c.class}] → ${c.expect}`, () => {
    const result = parseCoachReply(rawFor(c), {
      supplied: c.passages,
      locale: c.locale ?? "en",
    });

    if (c.expect === "accept") {
      assert.equal(
        result.ok,
        true,
        `rejected a reply that should stand (${result.ok ? "" : `${result.reason}: ${result.detail ?? ""}`})\n${c.why ?? ""}`,
      );
      return;
    }

    assert.equal(result.ok, false, `accepted a reply that must be refused\n${c.why ?? ""}`);
    if (c.check && !result.ok) {
      const allowed = c.check.split("+");
      assert.ok(
        allowed.includes(result.reason),
        `rejected for "${result.reason}", fixture expects one of ${allowed.join("|")}`,
      );
    }
  });
}

// ── the pieces, directly ─────────────────────────────────────────────────────

test("unit-bearing numbers are picked up, bare ones are not", () => {
  assert.deepEqual(unitBearingNumbers("leave four seconds"), ["four"]);
  assert.deepEqual(unitBearingNumbers("the limit is 120 km/h"), ["120"]);
  assert.deepEqual(unitBearingNumbers("0,05 g per 100 ml").sort(), ["0.05", "100"]);
  // No unit, no claim worth policing — otherwise every "the first vehicle to
  // stop" in the corpus becomes a rejection.
  assert.deepEqual(unitBearingNumbers("the first vehicle to stop goes first"), []);
  assert.deepEqual(unitBearingNumbers("look right, left and right again"), []);
});

test("entailment separates a paraphrase from a fabrication", () => {
  const body =
    "The handbrake holds the car still when parked and helps you pull away on a hill without rolling back.";
  const paraphrase =
    "The handbrake keeps the car still when it is parked, and it stops you rolling backwards when you pull away on a hill.";
  const fabrication =
    "South African law allows you to turn right on a red light after stopping, provided the way is clear.";

  assert.ok(entailmentScore(paraphrase, body) > 0.5, "faithful paraphrase scores high");
  assert.ok(entailmentScore(fabrication, body) < 0.2, "unrelated claim scores low");
});

test("a fenced reply still parses", () => {
  // stripCodeFence already runs at the llm.ts entry point (commit c94157c), but
  // the validator repeats it: a provider that starts fencing must not silently
  // degrade every learner to the fallback card.
  const body = "The one sign that means stop every single time — a complete standstill.";
  const raw = '```json\n{"status":"answered","answer":"A stop sign means a complete standstill every single time.","sources":["R1"]}\n```';
  const result = parseCoachReply(raw, { supplied: [{ code: "R1", body }], locale: "en" });
  assert.equal(result.ok, true);
});

test("not_covered needs no sources but is still held to the prose rules", () => {
  const supplied = [{ code: "R1", body: "The one sign that means stop every single time." }];
  const clean = parseCoachReply(
    JSON.stringify({ status: "not_covered", answer: "That is not something these lessons cover yet.", sources: [] }),
    { supplied, locale: "en" },
  );
  assert.equal(clean.ok, true);

  const certifying = parseCoachReply(
    JSON.stringify({ status: "not_covered", answer: "Not covered — but you are ready to book anyway.", sources: [] }),
    { supplied, locale: "en" },
  );
  assert.equal(certifying.ok, false);
  assert.equal(certifying.ok === false && certifying.reason, "forbidden");
});

// ── prompt ───────────────────────────────────────────────────────────────────

test("the system prompt carries the non-negotiable clauses", () => {
  const en = buildCoachSystem("en");
  for (const clause of ["GROUNDING", "not an instruction", "South Africa", "not_covered"]) {
    assert.ok(en.includes(clause), `missing: ${clause}`);
  }
  assert.ok(/never tell the learner they are ready/i.test(en), "never certifies");
});

test("the Afrikaans prompt carries the terminology block and may name the mock", () => {
  const af = buildCoachSystem("af");
  assert.ok(af.includes("Afrikaans"), "writes in Afrikaans");
  assert.ok(af.includes("Padtekens"), "glossary applied");
  // Ask Coach is entitlement-gated on the same access as /mock, so unlike the
  // free readiness read it may name it.
  assert.ok(af.includes("Proefeksamen"), "mock-exam term available on this surface");
  assert.ok(!buildCoachSystem("en").includes("Padtekens"), "English gets no glossary");
});

test("passages are truncated and fenced as data", () => {
  const long = { id: "rule:RR1", kind: "rule" as const, code: "RR1", title: "t", href: "/learn/rules/RR1", hash: "x", lead: { en: "" }, body: "x".repeat(5000) };
  const user = buildCoachUser("What does a stop sign mean?", [long]);
  assert.ok(user.includes('<passage code="RR1"'), "labelled as data");
  assert.ok(user.includes("<question>"), "question fenced separately");
  assert.ok(user.length < MAX_PASSAGE_CHARS + 500, "long passage is truncated");
});

test("the answer cap the cost model rests on is real", () => {
  const supplied = [{ code: "R1", body: "The one sign that means stop every single time." }];
  const result = parseCoachReply(
    JSON.stringify({ status: "answered", answer: "stop. ".repeat(MAX_ANSWER_CHARS), sources: ["R1"] }),
    { supplied, locale: "en" },
  );
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "length");
});
