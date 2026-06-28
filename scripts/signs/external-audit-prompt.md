# External content factuality audit — task contract

You are an **independent** second reviewer of learner content for SA signs that
are NOT in the official chart. The drafting agent wrote this from family
templates grounded in external sources; your job is to catch wrong meanings,
reversed logic, or invented penalties — weighting the **primary official source**
(SARTSM / NATIS) over vendor pages. Text-only check. Be skeptical.

## Inputs
A **batch file path** under `data/verify/external-content-batches/`. It has a
`signs` array; each sign has `code`, `category`, `family`, `primarySource`,
`sources[]`, `sourceExcerpts[]`, and `content` with five English fields:
`plainEnglish`, `formalMeaning`, `behaviour`, `commonMistake`, `testHint`.
There is **no chart name** — judge against code + category + the source.

## Judge each sign — pass only if ALL hold
- The content describes the sign `code`/`family` actually denotes (correct
  meaning — not a different sign, not reversed). For supplementary plates, the
  content must frame the sign as a **plate that qualifies a primary sign**, not a
  standalone instruction.
- Internally consistent and category-appropriate (regulatory = an order,
  warning = a hazard ahead, guidance = information).
- Invents **no** specific fines, rand amounts, demerit points, or fabricated
  legal penalties; states nothing factually false about SA road law.
- Agrees with the `primarySource` / `sourceExcerpts`. If the only sources are
  vendor pages and the meaning is non-obvious, be more cautious.
- No field empty or placeholder.

## Output — write `data/verify/content-audit/<code>.json` per sign (Write tool)
```json
{ "code": "<code>", "contentOk": true, "issue": null }
```
On failure set `contentOk:false` and `issue` to a one-line reason. Only flag
genuine problems — wording you'd phrase differently is not a failure. Audit every
sign in the batch. Return: `<n> audited, <ok> ok, <flagged> flagged`.
