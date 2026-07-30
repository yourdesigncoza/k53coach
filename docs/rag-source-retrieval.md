# RAG over the legal sources — design notes

**Status: not started, not scheduled.** Direction agreed with John on 2026-07-30; these are notes so
the thinking is not redone from scratch. Nothing here is a commitment to an implementation.

## Two consumers, and they are not the same product

The idea arrived from two directions in one session, and it is worth keeping them separate because
they have different risk profiles.

**A. Verification retrieval (offline / admin).** Resolve a citation to its verbatim text so a claim can
be checked without opening a 350-page gazette. Low risk: the audience is us, the output is a quote,
and a wrong retrieval is visible immediately.

**B. Learner coaching retrieval (runtime).** A student studying a topic asks for more, and the system
pulls supporting material. High risk: the audience is a learner, the output is generated prose about
the law, and a wrong retrieval is invisible.

**A is worth building on its own merits.** B needs a decision first — see below.

## B changes a documented architectural rule

CLAUDE.md is explicit: *"No runtime AI in the learner flow (deliberate)."* Practice and test
explanations are hard-coded verified content shown directly; AI is used **offline** to draft for human
review, and is reserved for a *future post-test coaching* feature — score-improvement suggestions and
recommended next lessons — not per-question rephrasing. The old `/api/ai/explain` route was removed.

A learner-facing RAG is squarely inside that reserved future feature, so it is not a contradiction —
but it is the moment the reservation gets cashed in, and it should be a deliberate decision rather
than something that arrives as a side effect of building A. Worth writing down explicitly when the
time comes: what the learner can ask, what the model may say, and what it must refuse.

The accuracy gate (constraint 9) does not disappear because the answer is grounded. A RAG answer is
still generated text asserting law to a learner. Grounding narrows the failure mode from *invention*
to *misreading*, which is a real improvement — but this session produced a live example of the second
kind, where the SADC RTSM and reg 286(2)(c)(ii) give different yield-line widths and only one binds.
Retrieval alone does not resolve that; a precedence rule does.

## What the corpus is

Five documents, all in `init/`, all gitignored. Listed with their gotchas in
`docs/markings-review-findings.md` §9.

The useful property of legal text is that **it is already addressable**. `NRTA s1(xlvi)`,
`NRTR reg 298A(2)`, `SADC-RTSM §7.2.16(2)(b)` are stable identifiers a human wrote. So:

- **Chunk on the provision, not on a token window.** One row per subsection/paragraph. Arbitrary
  chunking would split `298A(2)(a)–(c)` — a rule whose conditions are conjunctive — and a retriever
  returning only (a) would produce a confidently wrong answer.
- **Keep the citation as the primary key**, not a synthetic id. It is what a question cites, what a
  reviewer checks, and what a learner can be shown.
- **Store verbatim text plus source document, page, and retrieval date.** The retrieval date matters:
  our Act copy is the 1996 text and section 1 has been amended three times.

## Extraction is the hard part, not retrieval

Every source has a defect that will corrupt naive ingestion:

- **SADC RTSM Vol 1 Ch 7 is two-column.** `pdftotext -layout` interleaves the columns — paragraph 1's
  left column continues into paragraph 5's right column. This already caused one bad read this
  session. Column-aware extraction or page images are required.
- **NRTR 2000 is a bilingual OCR'd gazette.** English and Afrikaans alternate by page block. Text is
  legible but dirty (`"stilnou"`, `"tatfic"`, stray characters). Language detection per block is
  needed, or the corpus ends up half Afrikaans.
- **NRTA 93 of 1996 is an Acrobat Paper Capture OCR** of a 1996 scan. Definitions carry trailing
  cross-reference numerals (`(xlvii)`) that are artefacts of the bilingual layout, not part of the text.
- **Amendments are not consolidated.** The Act and Regulations as we hold them are as-enacted. A store
  that serves 1996 text as current law is worse than no store, because it looks authoritative.

That last point is the one to design for rather than discover.

## Reuse

The `wiki-semantic-search` skill packages a working pattern — markdown → Supabase pgvector → RAG
answer, with an indexer, a migration, an Edge Function and serverless routes. It is the obvious
starting point.

**It is a pattern to port, not infrastructure we have.** There is currently no vector extension, no
embedding column and no `match_*` function in this project — verified 2026-07-30.

## Open questions to settle before building

1. **Precedence.** When the manual and the regulation disagree (RTM2 width), what does retrieval
   return? Proposal: the store records both and marks the regulation authoritative; answers must
   surface the conflict rather than silently pick.
2. **Citation-or-silence.** Should a learner-facing answer be refused outright when retrieval returns
   nothing above a confidence floor? Proposal: yes — falling back to the model's own knowledge is
   exactly what this is meant to prevent.
3. **Scope of the learner's question.** Free-text ask, or constrained to "explain this marking / rule
   further"? The constrained version is far easier to keep safe and probably covers the real need.
4. **Bilingual.** Both languages ship as real deliverables. Afrikaans regulation text exists in the
   gazette — is the store bilingual, or English-only with translated answers?
5. **Amendment currency.** Who re-checks, and how often? A store with a stale Act is a liability.
6. **Cost.** Runtime retrieval on every learner question is the first recurring per-learner inference
   cost in the product. Pricing assumes R20/month covers AI Coach inference — worth a number before
   committing.

## Where this sits

Deferred. It is not on the path to the Stage 1 gate (300 verified questions + payments live), and
nothing currently blocked depends on it. The argument for doing it eventually is in
`docs/markings-review-findings.md` §9: this session's two worst errors were both retrieval failures,
not reasoning failures.
