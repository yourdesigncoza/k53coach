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

test("every unsourced term is marked pending a native review", () => {
  // A term with no UI string behind it is our guess, not Louwrens's ruling. The
  // marker is what stops the list quietly accumulating invented Afrikaans.
  for (const term of GLOSSARIES.af) {
    if (term.source) continue;
    assert.equal(term.pending, true, `"${term.en}" has no source and no pending flag`);
  }
});

test("English gets no glossary block", () => {
  assert.equal(glossaryBlock("en"), "");
  assert.equal(glossaryBlock("zz"), "");
});

test("the Afrikaans block names the term and the term to avoid", () => {
  const block = glossaryBlock("af");
  assert.match(block, /TERMINOLOGY/);
  assert.match(block, /Voertuigkontroles/);
  // The two defects this file was written for, both seen in real output.
  assert.match(block, /never "Voertuigbeheer"/);
  assert.match(block, /never "monster"/);
});
