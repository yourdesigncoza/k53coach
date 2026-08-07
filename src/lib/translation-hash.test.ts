// Relative + explicit .ts: run under node --experimental-strip-types, which does not
// resolve the "@/" alias for VALUE imports. This is also why the algorithm lives in
// translation-hash.ts rather than translations.ts — the latter reaches next/headers
// through @/lib/supabase/server and cannot be loaded by the test runner or by the
// plain-node drift check.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hashSeed,
  isOverrideStale,
  isClaimNamespace,
  CLAIM_NAMESPACES,
} from "./translation-hash.ts";

test("identical defaults hash identically", () => {
  assert.equal(hashSeed("Log in", "Teken in"), hashSeed("Log in", "Teken in"));
});

test("an ENGLISH-only edit changes the hash", () => {
  // The reason the seed is joint. When the English claim changes, the Afrikaans
  // translation of the OLD claim is exactly the row that needs flagging — that
  // is the "werk aflyn" / "5 minute" failure, where /en was fixed and /af was not.
  assert.notEqual(
    hashSeed("Takes about a minute", "Neem ongeveer 'n minuut"),
    hashSeed("Takes about 5 minutes", "Neem ongeveer 'n minuut"),
  );
});

test("an AFRIKAANS-only edit changes the hash", () => {
  assert.notEqual(
    hashSeed("Log in", "Teken in"),
    hashSeed("Log in", "Meld aan"),
  );
});

test("the separator is not a space, so the split point cannot be forged", () => {
  // With a space separator these two pairs seed to the same string and a pair of
  // genuinely different defaults would hash identically — i.e. a drifted row
  // would report as fresh. A space is legal inside a UI string; NUL is not.
  assert.notEqual(hashSeed("a b", "c"), hashSeed("a", "b c"));
});

test("a missing default is not the same as an empty one... or rather, it is", () => {
  // undefined coerces to "", deliberately: a key absent from one locale and a key
  // present-but-blank are the same fact for drift purposes.
  assert.equal(hashSeed(undefined, "x"), hashSeed("", "x"));
});

test("a NULL stored hash counts as stale", () => {
  // Rows written before the column existed. We do not know what default they were
  // written against, and the rows we already know drifted are precisely these.
  assert.equal(isOverrideStale(null, "abc"), true);
  assert.equal(isOverrideStale(undefined, "abc"), true);
});

test("a mismatched stored hash is stale, a matching one is not", () => {
  assert.equal(isOverrideStale("abc", "xyz"), true);
  assert.equal(isOverrideStale("abc", "abc"), false);
});

test("claims-bearing namespaces block, wording namespaces warn", () => {
  // Every string that went wrong on live /af sat in one of these: a price, a test
  // duration, an offline capability, a parent-consent promise.
  assert.equal(isClaimNamespace("landing"), true);
  assert.equal(isClaimNamespace("paywall"), true);
  assert.equal(isClaimNamespace("legal"), true);
  assert.equal(isClaimNamespace("module"), false);
  assert.equal(isClaimNamespace("nav"), false);
});

test("CLAIM_NAMESPACES has no duplicates", () => {
  assert.equal(new Set(CLAIM_NAMESPACES).size, CLAIM_NAMESPACES.length);
});
