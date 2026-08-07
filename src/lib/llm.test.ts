// Relative + explicit .ts: run under node --experimental-strip-types, which does not
// resolve the "@/" alias for VALUE imports.
import assert from "node:assert/strict";
import { test } from "node:test";
import { stripCodeFence } from "./llm.ts";

test("unwraps the fence Sonnet 5 actually returns", () => {
  // Copied from a real OpenRouter reply, 2026-08-07. Four runs in five looked
  // like this and every one of them served the fallback template instead.
  const raw = '```json\n{"verdict":"Dit was net \'n kort toets"}\n```';
  assert.equal(stripCodeFence(raw), '{"verdict":"Dit was net \'n kort toets"}');
  assert.doesNotThrow(() => JSON.parse(stripCodeFence(raw)));
});

test("unwraps a fence with no language tag", () => {
  assert.equal(stripCodeFence("```\n{\"a\":1}\n```"), '{"a":1}');
});

test("leaves unfenced JSON exactly as it is", () => {
  const plain = '{"verdict":"already clean"}';
  assert.equal(stripCodeFence(plain), plain);
});

test("leaves a fence INSIDE prose alone", () => {
  // Packaging is removable; content is not. A learner-facing string that happens
  // to contain a fence must survive byte for byte.
  const prose = 'Here you go:\n```json\n{"a":1}\n```';
  assert.equal(stripCodeFence(prose), prose);
});

test("leaves a one-line fence alone", () => {
  // No newline means no opening-line boundary to trust; better to hand the
  // caller something it can reject than to guess where the payload starts.
  assert.equal(stripCodeFence("```{}```"), "```{}```");
});

test("does not unwrap when the opening line carries text", () => {
  // "```json follows" is not a language tag; treating it as one would eat a line.
  const odd = "```json follows\n{}\n```";
  assert.equal(stripCodeFence(odd), odd);
});
