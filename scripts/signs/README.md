# Road-sign ingest scripts

Builds the K53 sign catalog from the official DoT chart + Wikimedia Commons.
Background, licensing rationale, and the manual review steps: see
[`docs/road-sign-assets.md`](../../docs/road-sign-assets.md).

## Prerequisites

- `pdftotext` (poppler-utils) on PATH — `sudo apt install poppler-utils`
- Network access to `commons.wikimedia.org` for the fetch step
- `init/RTSigns_charts.pdf` present (the official DoT chart)

## Run

```bash
npm run signs:extract      # PDF → data/signs-from-pdf.json
npm run signs:fetch        # Wikimedia → public/signs/*.svg + data/signs-catalog.json
npm run signs:ingest       # both, in order

# fetch flags (also work via signs:ingest):
node scripts/signs/fetch-wikimedia.mjs --filter regulatory --limit 20
node scripts/signs/fetch-wikimedia.mjs --dry-run        # no downloads
node scripts/signs/fetch-wikimedia.mjs --force          # re-download existing
```

## Output

- `data/signs-from-pdf.json` — every code found in the chart, tagged with
  category / subcategory / temporary flag, plus a name where the chart gives one.
- `data/signs-catalog.json` — the above merged with the matched Wikimedia file
  and a full provenance block (source URL, licence, artist, attribution flag).
- `public/signs/<code>.svg` — the downloaded SVG assets.

## Important

- **Nothing is auto-approved.** Every asset is written `assetStatus:
  "needs_review"`. A human must confirm the per-file licence and verify the sign
  against `RTSigns_charts.pdf` (right code, right variant — e.g. `W308` vs
  `TW308`) before it ships.
- This is a **first-pass** importer (the brief said "refine later"). Known rough
  edges: some extracted names have spacing artifacts; guidance/information and
  some temporary codes (non `R/W/G`+digit patterns) aren't matched yet; the
  Wikimedia search picks the best filename match and should be spot-checked.
- The app currently renders original-redraw placeholder glyphs
  (`src/components/signs/`). Wiring `signs-catalog.json` + `public/signs/*.svg`
  into `src/content/road-signs.ts` is the next step once assets are reviewed.
```
