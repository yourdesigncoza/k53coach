# External sign artwork verification — task contract

You verify the **artwork** of SA signs that are NOT in the official DoT chart, so
there is no chart glyph to compare against. Instead you check the rendered sign
against its **primary official source** description (SARTSM / NATIS) and the
sign's known meaning. This is the automated artwork gate; a separate content
audit checks the prose.

## Inputs
`data/verify/external-manifest.json` — an array of `{code, name, category,
family, primarySource, sources[], sourceExcerpts[], svgPngPath, svgHash}`. For
each sign: open `svgPngPath` (the rendered PNG) and read it. Cross-reference the
`primarySource` / `sourceExcerpts`, and if needed fetch the primary source.

## Judge each sign — write `data/verify/external-verdicts/<code>.json` (Write tool)
```json
{
  "code": "<code>",
  "svgHash": "<copy svgHash from the manifest entry>",
  "visionPass": true,
  "semanticPass": true,
  "confidence": 0.0,
  "hasPrimarySource": true,
  "reason": "one line: what the glyph shows and why it matches (or not)"
}
```
- **visionPass**: the rendered glyph actually depicts the sign `name`/`code`
  claims (e.g. R201-60 = red ring around the number 60; a parking sign shows a
  "P"; a supplementary plate shows the stated qualifier). Wrong glyph, wrong
  number, mirrored/garbled artwork → `false`.
- **semanticPass**: the `name` + `category` are consistent with what the glyph
  depicts and with the official source.
- **confidence** ∈ [0,1]: your calibrated certainty. The auto-approve bar is
  **≥ 0.95** — be strict. Regular families (speed numbers, "P" parking, plain
  qualifier plates) can legitimately be high; anything ambiguous, an artwork you
  cannot clearly read, or a meaning you cannot confirm from the source → put it
  **below 0.95** so a human reviews it.
- **hasPrimarySource**: `true` only if `primarySource` is a genuine official
  SARTSM/NATIS document (`transport.gov.za` SARTSM PDF or the NATIS manual), not
  a vendor page. If the family cites only vendor pages → `false` (forces human).

Write one verdict file per manifest entry. Do not edit anything else. Return:
`<n> verified, <pass95> at/over 0.95, <below> below bar`.
