# Road-sign verification agent — task contract

You verify South African road signs against the **official Department of Transport
chart** (`init/RTSigns_charts.pdf`, rendered to page images). The chart is the
**ground truth**. Accuracy is a hard safety gate: when in doubt, **FAIL** — a
failed sign goes to a human, an over-confident pass can teach a learner the wrong
thing.

## Inputs
You are given a **batch file path**. Read it. It contains `chartPngPath` (the
official chart sheet image, shared by every sign in the batch) and a `signs` array.
Each sign has: `code`, `wikipediaName`, `category`, `chartName` (the chart's own
name for this code — may be null), `chartPage`, `svgPngPath` (the candidate
artwork rendered from our SVG), `svgHash`.

## Procedure (per sign)
1. **Read** `chartPngPath` once, then **Read** the sign's `svgPngPath`.
2. **Locate the code on the chart page.** The chart prints the code next to each
   glyph. Find this exact `code`.
3. **Vision check** — does the candidate artwork depict the *same sign* as the
   chart glyph for this code? (same shape, colour, symbol/pictogram, and meaning).
   SA-specific styling matters: e.g. regulatory prohibitions use a red ring,
   command signs are blue, warning signs are triangular. Minor rendering
   differences (stroke width, anti-aliasing) are fine; a different symbol, colour
   class, or sign type is a FAIL.
4. **Semantic check** — are `code` ↔ `chartName` ↔ `category` ↔ the depicted
   meaning mutually consistent? Use `chartName` as the authority when present;
   `wikipediaName` is only a hint and is often phrased casually
   ("Cyclists only" = chart "Pedal cycles only" — that is a PASS, same meaning).
5. Decide and **Write** the verdict JSON (schema below).

## Strictness
- If you **cannot clearly locate** the sign on the chart, or the artwork is
  ambiguous/wrong, or the meaning is uncertain → `match:false`, set the failing
  check(s) false, `confidence < 0.6`.
- **Never invent** fines, demerit points, or specific monetary penalties in
  content. Keep content to plain-English meaning and driving behaviour.
- `contentDraft` is **English only**.

## Output — write to `data/verify/verdicts/<code>.json` (one file per sign)
Use the Write tool. Exact shape (no extra prose, valid JSON):

```json
{
  "code": "<echo the sign code>",
  "svgHash": "<echo svgHash from the batch>",
  "foundOnChart": true,
  "match": true,
  "visionPass": true,
  "semanticPass": true,
  "confidence": 0.92,
  "reason": "Concise: what you matched on the chart and why it passes/fails.",
  "suggestedName": "Canonical SA name (prefer the chart's wording)",
  "contentDraft": {
    "plainEnglish": "What this sign tells the driver, in one or two plain sentences.",
    "formalMeaning": "The formal/legal meaning of the sign.",
    "behaviour": "What the driver must actually do.",
    "commonMistake": "A common learner mistake or misconception about this sign.",
    "testHint": "A memory hook or tip for the K53 learner's test."
  },
  "contentPass": true
}
```

`contentPass` is your own factuality self-check on `contentDraft`: true only if
every field is accurate for this exact sign and invents no penalties.

## Rules of engagement
- Do **not** edit any file other than the verdict JSONs. Do not touch the DB,
  SVGs, or the batch file.
- Process **every** sign in the batch; write one verdict file each.
- Return a one-line summary: `<n> verdicts written, <p> passed, <f> failed`.
