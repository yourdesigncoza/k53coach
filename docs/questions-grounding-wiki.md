# Questions grounding wiki — evaluation

**Artifact:** `/home/laudes/zoot/projects/wiki-builds/k53/wiki` (Obsidian / vault-builder)
**Evaluated:** 2026-06-28
**Verdict:** Strong, well-built **grounding base + seed** for the DB4 questions work —
adopt it as the research corpus, not as a finished question bank or ground truth.

## What it is
220 notes / **110 original questions** (42 signs · 36 rules · 32 controls) built over
five rounds, plus: a sign taxonomy (50 notes), road rules (12), vehicle controls
(17), a topic ontology (10), 4 mock papers, **9 sourced authorities**, and a conflict
log. ~1.3 MB. Built with the same discipline this project already uses — provenance,
originality, honest uncertainty.

## Why it fits our needs

1. **Right sources.** Primary legislation *with section/reg numbers* (NRT Act 93/1996
   s12/s61/s63/s65; Regs 2000 reg 292/293/298/301/304/305), the official **NaTIS
   Learner Driver Manuals**, and **SARTSM** — the same source-of-truth family we use
   for signs. Each source note carries `reliability_rating`, `copyright_risk`,
   `content_use_allowed` (facts_only / paraphrase_only), `evidence_strength`
   (confirmed / alleged) — our `AssetProvenance` discipline applied to text.

2. **Moat-safe by construction.** Every question is `originality_status:
   original_generated` — "no public or commercial question bank was copied," and it
   explicitly does **not** contain the official restricted bank. Matches
   PRD-additions §3.

3. **Carries the AI-tutor field already.** Every question has an `explanation` +
   cross-links (`related_signs`, `related_rules`, `topic`). Maps almost 1:1 onto our
   `Question` type (`prompt`/`options`/`answer`/`explanation`/`signCode`/`topic`/
   `difficulty`).

4. **The conflict log is real intelligence.** A *confirmed negative result*: no
   official source publishes the exam's question count (64 vs 68), pass marks, or
   time limit — verified across national/provincial/municipal/RTMC pages. Also:
   alcohol limit 0.00 is *announced but not in force* (0.05/0.02 still apply as of
   2026-06-28); motorcycle age 17 vs 18; following-distance "two-second rule" is a
   teaching device, not a numeric statute. **Directly de-risks the deferred
   mock-exam (DB6) and readiness scoring (DB9)** — tells us what NOT to assert.

5. **Concrete proof of value.** In the LLM model test
   (`docs/llm-model-selection.md`), gpt-5.4-mini answered "following distance: 3
   seconds (moderate confidence)." The wiki, grounded in sources, gives the SA
   **two-second** teaching rule and flags it as non-statutory — i.e. it would have
   grounded the model correctly on exactly the item it was unsure about. That is the
   point of having it.

## Caveats — handle before trusting blind
- **Loose source-citation precision.** e.g. RR-001 (an urban-speed *rules* fact)
  cites the *Vehicle Controls* manual URL; the fact is right, the pointer is wrong.
  Several questions default to that one URL. **Spot-audit citations**; trust the
  primary sources it cites, not the wiki's pointer.
- **AI-built (vault-builder).** Per the hard-accuracy gate, wiki-derived questions
  still need verification against the cited legislation before serving. Treat the
  wiki as a high-quality *index into* authoritative sources + a draft layer, not as
  ground truth itself.
- **3 options vs our 4.** Wiki uses 3 (authentic K53); our schema uses 4. Minor
  mapping decision.
- **Volume.** 110 questions vs the ~750 DB4 target — a seed/template, not the bank.

## How to use it (proposed)
Mirror the signs pipeline. The wiki provides the equivalent of `chart-authority.json`
(the cited legislation/NaTIS = ground truth) **plus** a 110-question draft set with
explanations and provenance. A "questions pipeline" would:

1. **Ingest** the wiki → map each question to our `Question` schema (sign-name →
   our R-code; difficulty enum → number; resolve the 3-vs-4-option choice).
2. **Verify** each against its cited primary source — a factuality audit gate
   (no vision needed), analogous to the sign content-audit.
3. **Gate** — auto-promote the `evidence_strength: confirmed` / `source_basis:
   legislation|official_manual` items; route `alleged` / conflict-touching ones to
   a human queue.
4. **Serve** into DB4; the `explanation` field feeds the retrieval-grounded tutor.

This is a sizable new subsystem — plan it in plan-mode before building.

## Cross-refs
- `docs/llm-model-selection.md` — the following-distance example.
- `docs/sign-accuracy-pipeline.md` — the pipeline shape to mirror.
- `init/RTSigns_charts.pdf` / `data/chart-authority.json` — the signs ground truth
  this would parallel for questions.
