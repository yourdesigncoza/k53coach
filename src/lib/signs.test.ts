import { test } from "node:test";
import assert from "node:assert/strict";
import { signName } from "./signs.ts";

/** Only the two fields `signName` reads. */
const row = (name: string, content: unknown) =>
  ({ name, content }) as Parameters<typeof signName>[0];

test("af returns the Afrikaans name when one is recorded", () => {
  const r = row("Keep Right", { name: { af: "Hou Regs" } });
  assert.equal(signName(r, "af"), "Hou Regs");
});

test("af falls back to the English column when no Afrikaans name is set", () => {
  // The state every sign is in until Louwrens's names land — /af must show the
  // English name rather than an empty heading.
  const r = row("Keep Right", { name: {} });
  assert.equal(signName(r, "af"), "Keep Right");
});

test("en ignores the Afrikaans name", () => {
  const r = row("Keep Right", { name: { af: "Hou Regs" } });
  assert.equal(signName(r, "en"), "Keep Right");
});

test("the name column wins over any English stashed in content", () => {
  // `content.name.en` is not a supported place to put the English name. If one
  // ever appears there, the column is still the source of truth.
  const r = row("Keep Right", { name: { en: "STALE", af: "Hou Regs" } });
  assert.equal(signName(r, "en"), "Keep Right");
});

test("a sign with no content at all still renders its name", () => {
  assert.equal(signName(row("Stop", null), "af"), "Stop");
});
