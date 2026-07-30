# Road markings pipeline (DB1, `category='marking'`)

Markings are stored in `road_signs` alongside the 362 signs and pass the same two gates —
`asset_status` (artwork) and `review_status` (content) — plus `sa_relevant`. All three must be
`approved`/`true` before a marking reaches a learner (`SERVE_FILTER`, `src/lib/supabase/queries.ts`).

Full coverage table: [`docs/road-markings-catalogue.md`](../../../docs/road-markings-catalogue.md).

## Sources

| | File | Notes |
|---|---|---|
| Artwork | `init/RTSigns_charts.pdf` sheet 2 of 5 | DoT "Road Traffic Signs" chart, 2000. Vector. The same chart the 362 signs were verified against. |
| Text | `init/V1C7.pdf` | SADC RTSM Vol 1 Ch 7 "Road Markings", May 2012. Gitignored (12 MB) — re-fetch from `transport.gov.za/wp-content/uploads/2023/02/V1C7.pdf`. |

Both are official government publications, free to use under SA Copyright Act §12(8)(a). Neither
is a commercial study guide, so they are legitimate *sources*, not merely coverage checklists.

## Scripts, in the order you would use them

```bash
# 1. Artwork — lift all 42 markings out of the DoT chart as vector
node scripts/signs/markings/extract-official-svg.mjs            # -> official-svg/
node scripts/signs/markings/extract-official-svg.mjs --only RM8 # re-crop one
cp scripts/signs/markings/official-svg/*.svg public/markings/

# 2. Content — seed the learning objects (drafts)
node scripts/signs/markings/seed-markings.mjs --dry-run

# 3. Close the ARTWORK gate (skips codes with no row yet)
node scripts/signs/markings/approve-marking-artwork.mjs          # preview
node scripts/signs/markings/approve-marking-artwork.mjs --apply

# 4. Close the CONTENT gate — needs a human
node scripts/signs/markings/build-verify-page.mjs                # -> docs/markings-verify/
xdg-open docs/markings-verify/index.html                         # decide, then Export
node scripts/signs/markings/apply-marking-verification.mjs --by "Name"
node scripts/signs/markings/apply-marking-verification.mjs --by "Name" --apply
```

Crop boxes in `extract-official-svg.mjs` are **derived** from the chart's printed labels — each
vignette sits above its code, so the label gives the centre and baseline and the neighbour spacing
bounds the width. Only markings drawn as several vignettes under one label need an entry in
`OVERRIDES`. Check any re-crop visually with `build-review-page.mjs`.

## The client artwork, and why it is not the source

`client-svg/` and `client-svg-cleaned/` hold Louwrens' 29 July batch (Linear K53-37) with the
per-file defect list. It is kept as a cross-check, not as an asset — see that folder's README.
`clean-client-svg.mjs` and `crop-client-svg.mjs` process it; `build-review-page.mjs` renders it
next to the official artwork.

## The rule that shapes all of this

CLAUDE.md constraint 9: **AI drafts; it never self-certifies.** Every marking here was drafted by
an AI pass from the manual. A second AI pass checking the first against the same prompt is circular
and proves nothing, which is why `apply-marking-verification.mjs` refuses to run without a named
person and rejects `ai:`-prefixed names. The artwork gate is different and can be closed
programmatically, because the asset *is* the official chart rather than a redrawing of it — there
is no gap between what we ship and what the Department published.
