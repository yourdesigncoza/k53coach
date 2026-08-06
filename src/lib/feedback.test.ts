import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MIN_WORDS,
  TRAIL_LIMIT,
  countWords,
  validateBody,
  redactUrl,
  routePattern,
  clamp,
  redactClicks,
  redactErrors,
  redactFetchFailures,
  sanitiseClientContext,
  reportLabel,
  isStale,
  MAX_BODY_CHARS,
} from "./feedback.ts";

// ── Word count / validation ─────────────────────────────────────────────────
// The gate between a report someone can act on and a triage slot wasted.

test("countWords splits on any whitespace run", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords("   \n\t "), 0);
  assert.equal(countWords("one"), 1);
  assert.equal(countWords("one  two\tthree\nfour"), 4);
  assert.equal(countWords("  leading and trailing  "), 3);
});

test("validateBody enforces the minimum word count", () => {
  const short = Array.from({ length: MIN_WORDS - 1 }, (_, i) => `w${i}`).join(" ");
  const exact = Array.from({ length: MIN_WORDS }, (_, i) => `w${i}`).join(" ");

  assert.deepEqual(validateBody(""), { ok: false, error: "empty" });
  assert.deepEqual(validateBody(short), { ok: false, error: "too_short" });
  assert.deepEqual(validateBody(exact), { ok: true });
});

test("validateBody rejects a body past the column budget", () => {
  const long = "word ".repeat(MAX_BODY_CHARS);
  assert.deepEqual(validateBody(long), { ok: false, error: "too_long" });
});

// ── Redaction ───────────────────────────────────────────────────────────────
// Login is magic-link-only, so an auth callback URL really does carry a usable
// session credential. These reports are pushed to Linear, where an external
// collaborator reads them — a leak here is a leak to a third party.

test("redactUrl strips sensitive param values but keeps the keys", () => {
  const out = redactUrl("https://k53coach.co.za/en/auth?token_hash=abc123&next=/dashboard");
  assert.match(out, /token_hash=%5Bredacted%5D/);
  assert.match(out, /next=%2Fdashboard/);
  assert.doesNotMatch(out, /abc123/);
});

test("redactUrl drops the fragment entirely", () => {
  // Supabase's implicit flow puts access_token in the hash, not the query.
  const out = redactUrl("https://k53coach.co.za/en#access_token=secret&type=magiclink");
  assert.doesNotMatch(out, /secret/);
  assert.doesNotMatch(out, /#/);
});

test("redactUrl covers every listed sensitive key case-insensitively", () => {
  const out = redactUrl("https://x.test/p?ACCESS_TOKEN=a&Email=b@c.d&signature=s&keep=yes");
  assert.doesNotMatch(out, /a&|b%40c\.d|=s&/);
  assert.match(out, /keep=yes/);
});

test("redactUrl survives unparseable input", () => {
  // A malformed authority is the case that actually throws. Junk that merely
  // looks wrong resolves against the base as a relative path, which is fine —
  // it goes through unchanged rather than being lost.
  assert.equal(redactUrl("http://["), "[unparseable]");
  assert.equal(redactUrl("https://exa mple.com"), "[unparseable]");
  assert.equal(redactUrl("::::"), "/::::");
  assert.equal(redactUrl(""), "");
});

test("redactClicks keeps structure and drops text", () => {
  const clicks = [{ selector: "button#submit.btn", t: 10 }];
  const out = redactClicks(clicks);
  assert.equal(out[0].selector, "button#submit.btn");
  // The entry shape has no text field at all — there is nowhere for an answer
  // choice or question prompt to hide.
  assert.deepEqual(Object.keys(out[0]).sort(), ["selector", "t"]);
});

test("trails are capped at TRAIL_LIMIT, keeping the most recent", () => {
  const many = Array.from({ length: 50 }, (_, i) => ({ selector: `s${i}`, t: i }));
  const out = redactClicks(many);
  assert.equal(out.length, TRAIL_LIMIT);
  assert.equal(out.at(-1)?.selector, "s49");

  const errors = Array.from({ length: 50 }, (_, i) => ({
    type: "error",
    message: `m${i}`,
    t: i,
  }));
  assert.equal(redactErrors(errors).length, TRAIL_LIMIT);
});

test("redactFetchFailures redacts the URL of each failed call", () => {
  const out = redactFetchFailures([
    { url: "https://x.test/api?token=leak", method: "POST", status: 500, ms: 12, t: 3 },
  ]);
  assert.doesNotMatch(out[0].url, /leak/);
  assert.equal(out[0].status, 500);
});

test("clamp truncates and marks, without splitting a surrogate pair", () => {
  assert.equal(clamp("short", 10), "short");
  assert.equal(clamp("abcdefgh", 3), "abc…");
  // Two-code-unit emoji: naive slice(0,3) would emit a lone surrogate.
  const emoji = "🚗🚗🚗🚗";
  const out = clamp(emoji, 2);
  assert.equal(out, "🚗🚗…");
});

// ── Route patterns ──────────────────────────────────────────────────────────
// So twenty reports about twenty different signs group as one broken screen.

test("routePattern strips the locale and collapses dynamic segments", () => {
  assert.equal(routePattern("/en/learn/road-signs/R1"), "/learn/road-signs/[code]");
  assert.equal(routePattern("/af/learn/rules/RR30"), "/learn/rules/[code]");
  assert.equal(routePattern("/en/learn/controls/VC7"), "/learn/controls/[code]");
  assert.equal(routePattern("/en/mock/result/abc"), "/mock/result/[attemptId]");
  assert.equal(routePattern("/en/dashboard"), "/dashboard");
  assert.equal(routePattern("/en"), "/");
  assert.equal(routePattern("/"), "/");
});

test("routePattern keeps practice pages distinct from lesson pages", () => {
  // /learn/road-signs/practice must NOT collapse to [code] — it is a different
  // screen, and merging the two would hide which one is actually broken.
  assert.equal(routePattern("/en/learn/road-signs/practice"), "/learn/road-signs/practice");
  assert.equal(routePattern("/en/learn/rules/practice"), "/learn/rules/practice");
});

// ── Sanitising the whole payload ────────────────────────────────────────────

test("sanitiseClientContext coerces junk into a well-formed record", () => {
  // Everything here is attacker-controlled: a server action's arguments always are.
  const out = sanitiseClientContext({
    page_url: "https://k53coach.co.za/en/mock?token=secret",
    dpr: Number.NaN,
    time_on_page_s: -99,
    scroll_y: 12.7,
    errors: undefined,
    clicks: undefined,
    fetch_failures: undefined,
  });

  assert.doesNotMatch(out.page_url, /secret/);
  assert.equal(out.route_pattern, "/mock");
  assert.equal(out.dpr, 1);
  assert.equal(out.time_on_page_s, 0, "negative time is floored, not stored");
  assert.equal(out.scroll_y, 13);
  assert.deepEqual(out.errors, []);
  assert.deepEqual(out.clicks, []);
  assert.deepEqual(out.fetch_failures, []);
  assert.equal(out.online, true);
});

test("sanitiseClientContext bounds every free-text field", () => {
  const huge = "x".repeat(10_000);
  const out = sanitiseClientContext({
    page_url: `https://k53coach.co.za/${huge}`,
    user_agent: huge,
    timezone: huge,
    referrer: `https://k53coach.co.za/${huge}`,
  });
  assert.ok(out.page_url.length <= 501, `page_url was ${out.page_url.length}`);
  assert.ok(out.user_agent.length <= 401);
  assert.ok(out.timezone.length <= 61);
  assert.ok(out.referrer.length <= 301);
});

// ── Display ─────────────────────────────────────────────────────────────────

test("reportLabel names the flagged item for content reports", () => {
  assert.equal(
    reportLabel({ kind: "content", question_id: "RR-054", sign_code: null, body: "..." }),
    "Content flagged: RR-054",
  );
  assert.equal(
    reportLabel({ kind: "content", question_id: null, sign_code: "R1", body: "..." }),
    "Content flagged: R1",
  );
});

test("reportLabel summarises the body for bug reports", () => {
  const label = reportLabel({
    kind: "bug",
    question_id: null,
    sign_code: null,
    body: "  The   timer\nkeeps resetting when I rotate my phone during the mock exam paper  ",
  });
  assert.equal(label.startsWith("The timer keeps resetting"), true);
  assert.ok(label.length <= 61);
});

test("isStale only flags untriaged reports", () => {
  const now = Date.UTC(2026, 7, 20);
  const old = new Date(Date.UTC(2026, 7, 1)).toISOString();
  const fresh = new Date(Date.UTC(2026, 7, 19)).toISOString();

  assert.equal(isStale("new", old, now), true);
  assert.equal(isStale("new", fresh, now), false);
  // A pushed or resolved report is somebody else's problem now.
  assert.equal(isStale("pushed", old, now), false);
  assert.equal(isStale("resolved", old, now), false);
});
