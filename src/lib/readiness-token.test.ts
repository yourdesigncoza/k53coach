import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PAPER_TOKEN_TTL_MS,
  paperTokenHash,
  signPaperToken,
  verifyPaperToken,
} from "./readiness-token.ts";

const SECRET = "test-secret-not-a-real-one";
const IDS = ["q-signs-1", "q-rules-4", "q-controls-2"];
const NOW = 1_760_000_000_000;

test("a freshly signed token verifies and returns its ids", () => {
  const token = signPaperToken(IDS, SECRET, NOW);
  const out = verifyPaperToken(token, SECRET, NOW + 1000);
  assert.deepEqual(out?.ids, IDS);
});

test("a token signed with another secret is rejected", () => {
  const token = signPaperToken(IDS, "some-other-secret", NOW);
  assert.equal(verifyPaperToken(token, SECRET, NOW), null);
});

test("tampering with the payload is rejected", () => {
  // The whole point: widening the ids must not survive verification, or the
  // assess route could be pointed at the entire question bank.
  const token = signPaperToken(IDS, SECRET, NOW);
  const [, signature] = token.split(".");
  const forged = Buffer.from(
    JSON.stringify({ ids: [...IDS, "q-rules-99"], iat: NOW }),
    "utf8",
  ).toString("base64url");
  assert.equal(verifyPaperToken(`${forged}.${signature}`, SECRET, NOW), null);
});

test("an expired token is rejected", () => {
  const token = signPaperToken(IDS, SECRET, NOW);
  assert.ok(verifyPaperToken(token, SECRET, NOW + PAPER_TOKEN_TTL_MS - 1));
  assert.equal(verifyPaperToken(token, SECRET, NOW + PAPER_TOKEN_TTL_MS + 1), null);
});

test("a token issued in the future is rejected", () => {
  const token = signPaperToken(IDS, SECRET, NOW + 10 * 60_000);
  assert.equal(verifyPaperToken(token, SECRET, NOW), null);
});

test("malformed input is rejected rather than thrown on", () => {
  for (const bad of [null, undefined, 42, "", "no-dot", "a.b", ".", "x."]) {
    assert.equal(verifyPaperToken(bad, SECRET, NOW), null);
  }
});

test("the hash is stable and is not the token", () => {
  const token = signPaperToken(IDS, SECRET, NOW);
  const hash = paperTokenHash(token);
  assert.equal(hash, paperTokenHash(token));
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.ok(!hash.includes(token.slice(0, 12)));
});
