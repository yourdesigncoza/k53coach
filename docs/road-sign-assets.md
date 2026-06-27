# Road-sign asset pipeline

How the proprietary K53 sign library (DB1) is built. The **signs** themselves are
sourced (not invented); the **learning content** around each sign is original.

## Why we can use Wikimedia signs

SADC / South African official road signs derive from the SADC Road Traffic
Signs Manual, designed by the SA Department of Transport. Under **SA Copyright
Act §12(8)(a)** there is no copyright in official texts of a legislative,
administrative, or legal nature — so the SADC/SA sign set on Wikimedia Commons is
generally **Public Domain (PD-SADC-RTSM)**: usable commercially, modifiable,
re-exportable, no licence fee, no CC attribution.

**The catch:** Commons licences are stated **per file**. Do NOT assume every
Wikimedia SVG is PD. Audit each file's own description page.

Starter category: `Category:SVG road signs in South Africa` (subcategories for
mandatory / prohibitory / warning, plus SACU/SADC collections).

## Pipeline

```
Wikimedia SVG  →  per-file licence audit  →  Figma cleanup/normalise
              →  verify against RTSigns_charts.pdf  →  /public/signs/*.svg
              →  provenance record (AssetProvenance)  →  instructor review
```

1. **Download** candidate SVGs from the Wikimedia SA road-sign category.
2. **Licence-audit each file** individually. Record source URL + exact licence.
3. **Normalise in Figma** — consistent viewBox, padding, colours, stroke widths;
   export optimised SVG to `public/signs/<code>.svg`.
4. **Verify against `RTSigns_charts.pdf`** (the official DoT chart) — confirm the
   code, name, category, and that we have the right variant (e.g. permanent
   `W308` vs temporary `TW308`).
5. **Record provenance** in the sign's `AssetProvenance` (see `src/lib/types.ts`)
   — `assetStatus` goes `needs_review → audited → approved`.
6. **Instructor review** of the learner content (`reviewStatus`).

## Division of labour

| Tool | Use for |
|------|---------|
| **Wikimedia** | the SVG sign artwork (starter source — not AI, not redraw) |
| **AI** | file renaming, metadata, plain-English explanations, common-mistake notes, test hints, quiz questions, list-vs-PDF diffing, import spreadsheet |
| **Figma** | cleanup, visual consistency, optimised asset export |
| **Instructor** | accuracy sign-off on content |

## Two review states per sign (don't conflate)

- `provenance.assetStatus` — is the **SVG file** licence-clean & PDF-verified?
- `reviewStatus` — is the **learning content** instructor-approved?

A sign ships only when both are `approved`.

## Current state

`src/content/road-signs.ts` ships **original-redraw placeholder glyphs**
(`src/components/signs/index.tsx`) so the UI works today. Each record carries
`PLACEHOLDER_PROVENANCE` (`assetStatus: needs_review`). Replacing a placeholder:
drop the audited SVG into `public/signs/<code>.svg`, set `provenance.svgFile`,
fill the real licence/source, flip `assetStatus`, and point the sign component at
the file instead of the inline glyph.
