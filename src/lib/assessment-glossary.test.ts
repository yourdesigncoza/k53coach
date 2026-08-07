// Relative + explicit .ts: run under node --experimental-strip-types, which does not
// resolve the "@/" alias for VALUE imports. `messages/af.json` comes in through
// createRequire because a bare JSON import needs an import attribute here but not
// under Next's bundler — and the point of this file is to read the same values the
// app ships.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { GLOSSARIES, glossaryBlock } from "./assessment-glossary.ts";

const require = createRequire(import.meta.url);
const af: Record<string, Record<string, string>> = require("../../messages/af.json");

test("every sourced term still matches messages/af.json", () => {
  // This is the guard that lets the values be literals. If someone edits a topic
  // label in the JSON — or an admin's change is promoted into it — the glossary
  // stops agreeing with the buttons and this fails instead of the learner seeing
  // two words for one section.
  for (const term of GLOSSARIES.af) {
    if (!term.source) continue;
    const [ns, key] = term.source.split(".");
    const shipped = af[ns]?.[key];
    assert.ok(
      shipped !== undefined,
      `${term.source} no longer exists in messages/af.json`,
    );
    // Prefix, not equality: module.practice ships "Oefen hierdie onderwerp" and
    // the glossary needs the bare verb the model will inflect.
    assert.ok(
      shipped === term.use || shipped.startsWith(term.use),
      `${term.source} ships "${shipped}" but the glossary says "${term.use}"`,
    );
  }
});

test("every term carries a source, a native ruling, or a pending flag", () => {
  // A term with no UI string and no native ruling is our guess. Forcing the
  // third label is what stops the list quietly accumulating invented Afrikaans —
  // which is exactly how "volstruislyn" reached a learner.
  for (const term of GLOSSARIES.af) {
    assert.ok(
      term.source || term.ruled || term.pending,
      `"${term.en}" has no source, no ruling and no pending flag`,
    );
  }
});

test("the road-marking term rules out both invented compounds", () => {
  const block = glossaryBlock("af", "readiness");
  assert.match(block, /soliede lyn wat verbysteek verbied/);
  assert.match(block, /never "volstruislyn" or "geen-oornamelyn"/);
});

test("English gets no glossary block", () => {
  assert.equal(glossaryBlock("en", "exam"), "");
  assert.equal(glossaryBlock("zz", "readiness"), "");
});

test("the Afrikaans block names the term and the term to avoid", () => {
  const block = glossaryBlock("af", "exam");
  assert.match(block, /TERMINOLOGY/);
  assert.match(block, /Voertuigkontroles/);
  // The two defects this file was written for, both seen in real output.
  assert.match(block, /never "Voertuigbeheer"/);
  assert.match(block, /never "monster"/);
});

test("the readiness block never hands over a word for the paid mock", () => {
  // Regression: with "Proefeksamen" in the shared list the model wrote "die
  // volle Proefeksamen-gereedheid" and planned a "Proefeksamen-styl
  // oefensessie" for an unpaid learner. readinessAllowedHrefs already drops
  // /mock; a term the prose can sell defeats that.
  const readiness = glossaryBlock("af", "readiness");
  assert.doesNotMatch(readiness, /Proefeksamen/);
  // …and the paid surface, where the learner just sat one, still gets it.
  assert.match(glossaryBlock("af", "exam"), /Proefeksamen/);
  // The shared terms survive the filter on both.
  assert.match(readiness, /Voertuigkontroles/);
});
