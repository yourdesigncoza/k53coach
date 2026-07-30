# Client marking artwork — vector source (Linear K53-37)

> **Superseded as the primary source (2026-07-30).** The official DoT artwork for all 16 markings
> turned out to be sitting in `init/RTSigns_charts.pdf` sheet 2 of 5, drawn as vector, and is now
> extracted to `../official-svg/` by `../extract-official-svg.mjs`. Prefer that. This batch stays as
> a cross-check and as the source of the road-scene treatment, which the chart's oval vignettes do
> not provide. Compare the two side by side: `node ../build-review-page.mjs` → `docs/markings-review.html`.
>
> The chart also settled two open questions in this file:
> - **`R = Rickshaw` is official** — it is printed in the RM7 designatory legend. The client was right.
> - **There is no broken RM12 or RM13.** The chart shows two solid-line vignettes for each; no
>   time-plated variant exists anywhere on the sheet.

Best version of each of the 16 markings, pulled from Louwrens' 29 July batch on
[K53-37](https://linear.app/k53-coach/issue/K53-37). **These are reference geometry, not
ship-ready assets** — nothing here is in the served set.

Unlike the two earlier batches (28 July PNG posters, 28 July raster-in-SVG-wrapper), this batch is
genuine vector: 16 files, ~40 KB total, lighter than the average file in `public/signs/`. The
drawing work is real and reusable; the defects below are what stands between it and going live.

Spec to correct against: `docs/verification-worklist.md` rows 71–84 (colour, continuity, minimum
width, cited SARTSM section). Approved lesson content: `scripts/signs/markings/*.json`.

## Which file came from where

Two variants circulated. The issue **description** carries a labelled set (title + caption text
baked in); the 08:22 **comment** carries the same drawings with the captions stripped. The
stripped version is preferred wherever it exists.

| Source | Codes |
|---|---|
| 08:22 comment (captions stripped) | RM2, RM4.1, RM5, RM6, RM7, RM8, RM9, RM12, RM13, RTM1, RTM2, RTM3, RTM4 |
| 12:43 comment | RM10 |
| Description (labelled — captions still present) | RM1, RM15 |

The 6.5 MB `RM15.svg` posted at 08:22 is the old raster wrapper and was **not** taken; the
description's `RM15_detailed_editable.svg` is the true vector and is what sits here.

## Defects that apply to every file

- **Opaque background.** Every file paints a full-bleed `#F7F7F4` rect. The sign set is a
  transparent-ground glyph — strip it.
- **Inconsistent aspect ratio.** viewBoxes run 1200×700, 1200×760, 1200×820, 1400×860, 600×660,
  600×760, 600×900, 760×1060, 1200×1200. They need one shared frame to sit in the same grid as
  `public/signs/`.
- **Broken intrinsic sizing.** `RTM4`, `RM15` declare `width="20" height="20"` / `18`;
  `RTM1`, `RTM3` declare `width="160%"`. Drop `width`/`height` and keep `viewBox`.
- **Scene, not glyph.** Most draw a whole road scene (kerbs, verges, direction arrows, vehicles)
  where the sign set uses an isolated symbol. Decide once whether markings get a scene treatment —
  they arguably need one to read — and apply it uniformly.
- **Namespace prefixes.** Files are serialised with `ns0:` prefixes. Valid, but normalise on the
  way in.

## Per-file verdict

### Geometry usable — cosmetic fixes only (9)

| Code | Note |
|---|---|
| `RM1` | Single continuous white centre line ✓. Labelled version only — strip the title/caption text. |
| `RM2` | Two continuous parallel white lines ✓ §7.2.6. |
| `RM6` | White T-shaped bay markings ✓ §7.2.10. |
| `RM7` | Yellow three-sided bay + oval RM7.1 with designatory letter ✓ §7.2.11. Carries `B`. Verify the letter list against §7.2.11 before reusing the legend — "R = rickshaw" from the earlier batch is still unverified. |
| `RM8` | Six variants RM8.1–RM8.6, **arrows correctly yellow** ✓ §7.2.12 — this was white in the earlier batch and has been fixed. |
| `RTM1` | Stop line + STOP word. Text is a road marking here, not a caption — keep, but convert to a path so it does not depend on a font. |
| `RTM2` | Yield line + YIELD word. Same treatment as RTM1. |
| `RTM3` | Pedestrian crossing lines, no text ✓. |
| `RTM4` | Block pedestrian crossing ✓. Fix `width`/`height="20"`. |

### Needs a content correction before use (4)

| Code | Correction |
|---|---|
| `RM4.1` | Draws yellow edge lines on **both** edges. RM4.1 is the **left** edge line (§7.2.8). The lesson rests on the sunrise–sunset / 150 m / being-overtaken proviso, which is a left-edge rule — a symmetrical drawing muddies it. |
| `RM5` | `<desc>` claims "yellow diagonal bars", but the file's only fills are white/grey — the diagonals may not be drawn at all. Verify against §7.2.9 and confirm the intended colour. |
| `RM9` | Drawn as solid yellow left + broken yellow right + the word `BUS`. RM9 is the **broken yellow line** (≥150 mm, §7.2.13); the word/symbol is **RM17** (§7.2.21). The solid yellow line on the left is not RM9. Either relabel the parts or drop the word. |
| `RM10` | Yellow cross-hatch ✓ §7.2.14, but has `STOP` painted on two approaches, which is not part of a box junction. Also missing the exception that a vehicle turning left or right may enter. |

### Must be fixed structurally (2)

| Code | Correction |
|---|---|
| `RM12` | **Still draws the fabricated second panel** — a *broken* red line captioned "selective periods / applies during the hours on the sign". There is no broken RM12. §7.2.16: continuous solid red, ≥150 mm, **24 hours**. Delete the right-hand panel. |
| `RM13` | Same defect. §7.2.17: continuous solid yellow, ≥100 mm, **24 hours**. Delete the right-hand panel. |

Stripping the captions did not remove these drawings — the wrong geometry is still there, and a
learner reading the picture alone still learns the wrong rule. This is the third batch carrying
this error (flagged 24 July, again 28 July).

### Redraw from scratch (1)

| Code | Why |
|---|---|
| `RM15` | Vector now, but it is a hand-traced copy of the **same wrong picture** rejected on 28 July: `grassPattern` and `pavingPattern` defs, a landscaped raised island, no yellow arrows and no painted circle. §7.2.19 is **three yellow arrows** plus a painted circle (white outer ring, yellow inner) — flat paint, which is the entire basis of the "do not drive over it, do not cut in front of it" rule. Only the clockwise direction is right. Nothing here is reusable. |

## Provenance

Client-supplied, origin ChatGPT-assisted (the earlier batches carried signed C2PA manifests from
OpenAI's image generator; this batch is hand/tool-authored vector with no manifest). Treat as
**reference under the accuracy gate** — every file that ships must still be verified against
`init/RTSigns_charts.pdf` / SARTSM and recorded with `approved_by`, `verified_at`, `svg_hash`.
