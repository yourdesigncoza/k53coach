/**
 * Spend-bound arithmetic and redaction.
 *
 * The claim/release path itself is exercised end to end in `scripts/e2e/ask.mjs`
 * — it is a Postgres advisory lock, and a unit test with a stubbed client would
 * assert that the stub was called, not that concurrent turns cannot both win.
 * What is worth pinning here is the arithmetic the caps rest on, because that is
 * what silently stops being true when someone raises a limit.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DAILY_MESSAGE_CAP,
  HISTORY_TURNS,
  MAX_COMPLETION_TOKENS,
  PERIOD_MESSAGE_CAP,
  globalDailyCap,
  isCapped,
} from "./coach-limits.ts";
import { MAX_ANSWER_CHARS, MAX_HISTORY_CHARS, MAX_PASSAGE_CHARS } from "./coach-reply.ts";
import { DEFAULT_K, MAX_QUERY_CHARS } from "./coach-retrieval.ts";
import { redactPii, UNANSWERED_RETENTION_DAYS } from "./coach-privacy.ts";

// Prices used to size the caps (docs/product/PRD-ask-coach.md §7). If these move,
// the caps are wrong and this test is where that gets noticed.
const USD_PER_M_INPUT = 0.75;
const USD_PER_M_OUTPUT = 4.5;
const RAND_PER_USD = 20;
const SYSTEM_TOKENS = 1000;
const CHARS_PER_TOKEN = 4;

function randPerMessage(): number {
  const promptChars =
    DEFAULT_K * MAX_PASSAGE_CHARS + HISTORY_TURNS * MAX_HISTORY_CHARS + MAX_QUERY_CHARS;
  const promptTokens = SYSTEM_TOKENS + promptChars / CHARS_PER_TOKEN;
  const usd =
    (promptTokens / 1_000_000) * USD_PER_M_INPUT +
    (MAX_COMPLETION_TOKENS / 1_000_000) * USD_PER_M_OUTPUT;
  return usd * RAND_PER_USD;
}

test("the per-message cost is a ceiling, and it is the one the PRD quotes", () => {
  const rand = randPerMessage();
  assert.ok(rand < 0.08, `R${rand.toFixed(3)} per message exceeds the quoted R0.07`);
});

test("a full entitlement of messages stays well inside the R179 sale", () => {
  const worstCase = randPerMessage() * PERIOD_MESSAGE_CAP;
  assert.ok(worstCase < 40, `R${worstCase.toFixed(2)} of inference against a R179 sale`);
});

test("the daily cap cannot outrun the period cap in a 90-day window", () => {
  // Not a tautology: a daily cap high enough to exhaust the period in a few days
  // would make the period cap the only real limit and the daily one decorative.
  assert.ok(DAILY_MESSAGE_CAP * 90 > PERIOD_MESSAGE_CAP, "period cap binds first, as intended");
  assert.ok(PERIOD_MESSAGE_CAP / DAILY_MESSAGE_CAP >= 14, "a heavy user gets at least two solid weeks");
});

test("the global ceiling is always set", () => {
  // Mandatory, not optional: per-user caps do nothing against several accounts,
  // so there must be a total bound even with no env var configured.
  delete process.env.COACH_GLOBAL_DAILY_CAP;
  assert.ok(globalDailyCap() > 0);

  process.env.COACH_GLOBAL_DAILY_CAP = "50";
  assert.equal(globalDailyCap(), 50);
  process.env.COACH_GLOBAL_DAILY_CAP = "nonsense";
  assert.ok(globalDailyCap() > 0, "a bad value falls back rather than disabling the ceiling");
  delete process.env.COACH_GLOBAL_DAILY_CAP;
});

test("only a granted claim permits a model call", () => {
  assert.equal(isCapped("granted"), false);
  for (const outcome of ["capped_day", "capped_period", "capped_global", "unauthenticated", "unavailable"] as const) {
    assert.equal(isCapped(outcome), true, `${outcome} must not spend`);
  }
});

test("an answer cannot be longer than the completion budget allows", () => {
  assert.ok(
    MAX_ANSWER_CHARS <= MAX_COMPLETION_TOKENS * CHARS_PER_TOKEN,
    "the character cap must be reachable within max_tokens, or answers get truncated mid-sentence",
  );
});

// ── redaction ────────────────────────────────────────────────────────────────

test("obvious identifiers are stripped before anything leaves the box", () => {
  const id = redactPii("My ID is 9203155012087, when can I book my test?");
  assert.ok(!id.text.includes("9203155012087"));
  assert.ok(id.removed.includes("[ID number]"));

  const phone = redactPii("Call me on 082 555 1234 about the stop sign");
  assert.ok(!phone.text.includes("082 555 1234"));

  const email = redactPii("email thabo@example.co.za the speed limit rules");
  assert.ok(!email.text.includes("thabo@example.co.za"));
});

test("redaction leaves an ordinary question alone", () => {
  const question = "What is the speed limit on a public road outside an urban area?";
  const result = redactPii(question);
  assert.equal(result.text, question);
  assert.deepEqual(result.removed, []);
});

test("a 13-digit ID is not half-eaten by the phone pattern", () => {
  // The ordering bug this guards: the phone pattern matches the leading 10
  // digits of an ID number, leaving three loose digits and the appearance of a
  // redaction that did not happen.
  const result = redactPii("0203155012087");
  assert.ok(!/\d{3}/.test(result.text), `left digits behind: ${result.text}`);
});

test("every fixture case marked mustRedact is redacted", () => {
  const fixture = JSON.parse(
    readFileSync(new URL("./__fixtures__/coach-adversarial.json", import.meta.url), "utf8"),
  );
  const cases = fixture.queries.filter((q: { mustRedact?: string[] }) => q.mustRedact);
  assert.ok(cases.length > 0, "fixture carries PII cases");
  for (const c of cases as { id: string; text: string; mustRedact: string[] }[]) {
    const { text } = redactPii(c.text);
    for (const secret of c.mustRedact) {
      assert.ok(!text.includes(secret), `${c.id} leaked ${secret}: ${text}`);
    }
  }
});

test("unanswered bodies have a retention limit", () => {
  assert.ok(UNANSWERED_RETENTION_DAYS > 0 && UNANSWERED_RETENTION_DAYS <= 90);
});
