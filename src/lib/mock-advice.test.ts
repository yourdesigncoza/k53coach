import { test } from "node:test";
import assert from "node:assert/strict";
import { mockAdvice, SUGGESTED_PASSED_MOCKS } from "./mock-advice.ts";

test("counts down to the suggested minimum", () => {
  assert.deepEqual(mockAdvice(0), { passes: 0, remaining: 3, met: false });
  assert.deepEqual(mockAdvice(1), { passes: 1, remaining: 2, met: false });
  assert.deepEqual(mockAdvice(2), { passes: 2, remaining: 1, met: false });
});

test("met at the suggested minimum, and remaining never goes negative", () => {
  assert.deepEqual(mockAdvice(SUGGESTED_PASSED_MOCKS), {
    passes: 3,
    remaining: 0,
    met: true,
  });
  assert.deepEqual(mockAdvice(9), { passes: 9, remaining: 0, met: true });
});

test("garbage in does not produce a negative or fractional count", () => {
  assert.deepEqual(mockAdvice(-4), { passes: 0, remaining: 3, met: false });
  assert.deepEqual(mockAdvice(2.7), { passes: 2, remaining: 1, met: false });
  assert.deepEqual(mockAdvice(NaN), { passes: 0, remaining: 3, met: false });
});
