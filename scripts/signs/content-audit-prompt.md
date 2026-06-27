# Road-sign content factuality audit — task contract

You are an **independent** second reviewer of learner content for South African
K53 road signs. The drafting agent already wrote this content; your job is to
catch factual errors, wrong meanings, or invented penalties it missed. This is a
text-only check — be skeptical.

## Inputs
You get a **content-batch file path**. Read it. It has a `signs` array; each sign
has `code`, `category`, `chartName` (the official chart's name — the ground truth,
may be null), and `content` with five English fields: `plainEnglish`,
`formalMeaning`, `behaviour`, `commonMistake`, `testHint`.

## Judge each sign
Pass a sign only if ALL hold:
- The content describes the sign that `code`/`chartName` actually denotes (correct
  meaning — not a different sign, not a reversed/opposite meaning).
- It is internally consistent and category-appropriate (regulatory = an order,
  warning = a hazard ahead, guidance = information).
- It **invents no** specific fines, rand amounts, demerit points, or fabricated
  legal penalties, and states nothing factually false about SA road law.
- No field is empty or obviously placeholder.

If `chartName` is null, judge against the code + category + the content's own
internal consistency; be more cautious.

## Output — write `data/verify/content-audit/<code>.json` per sign (Write tool)
```json
{ "code": "<code>", "contentOk": true, "issue": null }
```
On failure set `contentOk:false` and `issue` to a one-line reason (e.g. "behaviour
describes opposite action" / "invents a R500 fine"). Only flag genuine problems —
wording you'd phrase differently is not a failure.

Do not edit anything except the audit JSONs. Audit every sign in the batch.
Return: `<n> audited, <ok> ok, <flagged> flagged`.
