# Road markings — redraw for review (K53-37)

**Not wired to anything.** The app still serves `public/markings/`; `road_signs.svg_file` is
unchanged. These 16 files exist so John can look at them and decide. Open
`public/markings-v2/index.html` (via the dev server, or any static server rooted at `public/`) for
a side-by-side against the shipped artwork plus a 48 px thumbnail strip.

Regenerate with `node scripts/signs/markings/draw-markings.mjs`. The geometry lives in that one
file — there are no hand-edited SVGs to drift.

## What changed

Style follows the reference John approved on 2026-08-04: square tile, grey road surface, marking in
its true colour, broken white centre line for context, and a small black direction-of-travel badge
bottom right. Gone: the grey ellipse, the green verge fill, the doubled ovals, and the `STOP` legend
that came off the chart with RTM1.

Drawn **to the written specification**, not traced. Each file's `<desc>` carries the SARTSM
provision that fixes its colour, continuity and minimum width, so the asset states its own basis.

Two judgement calls worth confirming:

- **RM12 / RM13 show both forms on one tile** — the continuous line on one kerb, the broken line on
  the other — rather than as a labelled pair. A pair inside one square halves each panel and the
  distinction dies at 48 px, and labels would need translating. Solid-vs-broken is self-evident and
  the lesson prose already carries "24 hours" vs "only during the times on the sign".
- **Scale is not true.** The tile spans roughly 7,4 m, so a 100 mm line would be a quarter of a
  pixel in the library thumbnail. Line weights are boosted but kept monotonic, so a 300 mm stop line
  still reads as much fatter than a 100 mm edge line.

## ⚠️ The gate this changes

`scripts/signs/markings/README.md` closes the **artwork** gate programmatically on the current
files, and gives an explicit reason:

> the asset *is* the official chart rather than a redrawing of it — there is no gap between what we
> ship and what the Department published.

**A redraw breaks that.** These files are a redrawing, so that justification does not carry over. If
they ship, the artwork gate needs the same human visual check against
`resources/charts/RTSigns_charts.pdf` that Louwrens' 29 July batch needs — `asset_status` must not
be closed programmatically for them.

That is the trade: the shipped ovals have unimpeachable provenance and read badly next to 340 sign
plates; these read correctly and need a person to sign the artwork off. Worth knowing before
choosing.

## Not covered

`RM3`, `RM4.2`, `RM11`, `RM14`, `RM16`, `RM17` and the `GM` guide-line series have artwork in
`public/markings/` but are not in the served set of 16, so they were not redrawn. If the 16 are
accepted, those become an obvious follow-on — the generator takes one entry each.
