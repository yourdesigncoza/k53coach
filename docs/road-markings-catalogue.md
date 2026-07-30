# Road markings — full catalogue (DB1)

The complete set of officially approved South African road markings, with the artwork status
of each. This is the coverage checklist for the markings half of DB1, the same way
`docs/rules-coverage-checklist.md` works for rules.

## Where the two halves come from

| | Source | Status |
|---|---|---|
| **Artwork** | `init/RTSigns_charts.pdf` sheet 2 of 5 — "ROAD TRAFFIC SIGNS", National Department of Transport, 2000 | **All 42 extracted as vector.** `scripts/signs/markings/extract-official-svg.mjs` |
| **Names + definitions** | `init/V1C7.pdf` — SADC RTSM Vol 1 Chapter 7, "Road Markings" (May 2012). Gitignored (12 MB); re-fetch from `transport.gov.za/wp-content/uploads/2023/02/V1C7.pdf` | Mapped below. Teaching content written for 16 of 42. |

Both are official government publications, free to use under SA Copyright Act §12(8)(a) — the
same basis as the 362 road signs. Neither is a commercial study guide, so
[the checklist-never-a-source rule](rules-coverage-checklist.md) does not bite here: this manual
*is* a legitimate source, not just a list of topics.

The code→name mapping below is derived from the manual's own numbered section headings, not
inferred from the chart. Each regulatory section defines one code in order, so §7.2.5 → RM1,
§7.2.15 → RM11 and so on; the warning and guidance series map 1:1 onto §7.3.x and §7.4.x.

## Status key

- **Content** — is there a written learning object (meaning, driver action, common mistake, exam tip)?
- **Art** — is the official vector extracted and in `public/markings/`?

## Regulatory — transverse (§7.2.1–7.2.4)

| Code | Official name | Cite | Content | Art |
|---|---|---|---|---|
| `RTM1` | Stop Line | §7.2.1 | ✅ | ✅ |
| `RTM2` | Yield Line | §7.2.2 | ✅ | ✅ |
| `RTM3` | Pedestrian Crossing Lines | §7.2.3 | ✅ | ✅ |
| `RTM4` | Block Pedestrian Crossing Markings | §7.2.4 | ✅ | ✅ |

## Regulatory — longitudinal and other (§7.2.5–7.2.21)

| Code | Official name | Cite | Content | Art |
|---|---|---|---|---|
| `RM1` | No Overtaking Line | §7.2.5 | ✅ | ✅ |
| `RM2` | No Crossing Lines | §7.2.6 | ✅ | ✅ |
| `RM3` | Channelising Line | §7.2.7 | ❌ | ✅ |
| `RM4.1` | Left Edge Line | §7.2.8 | ✅ | ✅ |
| `RM4.2` | Right Edge Line | §7.2.8 | ❌ | ✅ |
| `RM5` | Painted Islands | §7.2.9 | ✅ | ✅ |
| `RM6` | Parking Bays | §7.2.10 | ✅ | ✅ |
| `RM7` | Exclusive Parking Bay (+ `RM7.1` designatory oval) | §7.2.11 | ✅ | ✅ |
| `RM8` | Mandatory Direction Arrows (`RM8.1`–`RM8.6`) | §7.2.12 | ✅ | ✅ |
| `RM9` | Exclusive Use Lane Line | §7.2.13 | ✅ | ✅ |
| `RM10` | Box Junction | §7.2.14 | ✅ | ✅ |
| `RM11` | Zig-Zag Zone Lines | §7.2.15 | ❌ | ✅ |
| `RM12` | No Stopping Line | §7.2.16 | ✅ | ✅ |
| `RM13` | No Parking Line | §7.2.17 | ✅ | ✅ |
| `RM14` | No Motor Cycles Marking | §7.2.18 | ❌ | ✅ |
| `RM15` | Traffic Circle Mandatory Direction Arrows | §7.2.19 | ✅ | ✅ |
| `RM16` | Disabled Persons Parking Bay | §7.2.20 | ❌ | ✅ |
| `RM17` | Exclusive Use Lane/Parking Symbols (`RM17.1`–`RM17.4`) | §7.2.21 | ❌ | ✅ |

## Warning markings (§7.3.1–7.3.11)

| Code | Official name | Cite | Content | Art |
|---|---|---|---|---|
| `WM1` | Railway Crossing Ahead | §7.3.1 | ❌ | ✅ |
| `WM2` | Continuity Line | §7.3.2 | ❌ | ✅ |
| `WM3` | Dividing Line | §7.3.3 | ❌ | ✅ |
| `WM4` | Reversible Lane Lines | §7.3.4 | ❌ | ✅ |
| `WM5` | Yield Control Ahead | §7.3.5 | ❌ | ✅ |
| `WM6` | Lane Reduction Arrows (`WM6.1`–`WM6.5`) | §7.3.6 | ❌ | ✅ |
| `WM7` | Mandatory Direction Arrow Ahead (`WM7.1`–`WM7.6`) | §7.3.7 | ❌ | ✅ |
| `WM8` | No Overtaking Line or No Crossing Line Ahead (`WM8.1`–`WM8.3`) | §7.3.8 | ❌ | ✅ |
| `WM9.1` / `WM9.2` | Arrestor Bed / Escape Road Ahead | §7.3.9 | ❌ | ✅ |
| `WM10` | Speed Hump | §7.3.10 | ❌ | ✅ |
| `WM11` | End of Exclusive Use Lane Arrows (`WM11.1`, `WM11.2`) | §7.3.11 | ❌ | ✅ |

## Guidance markings (§7.4.1–7.4.8)

| Code | Official name | Cite | Content | Art |
|---|---|---|---|---|
| `GM1` | Lane Line | §7.4.1 | ❌ | ✅ |
| `GM2` | Guide Lines | §7.4.2 | ❌ | ✅ |
| `GM3` | Bifurcation Arrows (`GM3.1`–`GM3.3`) | §7.4.3 | ❌ | ✅ |
| `GM4` | Information Arrows (`GM4.1`, `GM4.2`) | §7.4.4 | ❌ | ✅ |
| `GM5` | Bicycle Guide Lines | §7.4.5 | ❌ | ✅ |
| `GM6` | Road Marking Symbols (`GM6.1`–`GM6.4`) | §7.4.6 | ❌ | ✅ |
| `GM7` | Word Markings | §7.4.7 | ❌ | ✅ |
| `GM8` | Kerbface Marking | §7.4.8 | ❌ | ✅ |

## Which of the missing ones the real exam actually tests

From `docs/exam-format-analysis/` — 21 of 220 indexed items are road-marking diagrams (~9%).
These are items we currently **cannot answer**, because the marking has no learning object:

| Evidence | What was shown | Marking |
|---|---|---|
| `A-57` | "plan view, white 'X' marking painted on carriageway" | `WM1` Railway Crossing Ahead |
| `A-66`, `D-025` | "centre lane bounded by broken lines both sides (reversible)" | `WM4` Reversible Lane Lines |
| `A-60` | "edge-line marking w/ black arrow indicating side of road" | `RM4.2` Right Edge Line |

`RM11` (zig-zag zone lines, the no-overtaking zone at a pedestrian crossing) and `RM16`
(disabled persons bay) are also common learner-test material.

## Sequencing

Artwork is done and costs nothing further. The work left is **content**, and it is the same
pipeline the existing 16 went through:

1. Draft each learning object from `init/V1C7.pdf` §7.x + the NRTR 2000 regulations it cites.
2. Record the citation, `approved_by` and `verified_at` per object (constraint 9).
3. Human verification before `review_status` moves off `draft`.

Do **not** shortcut step 3 by having the client author the descriptions. Louwrens' three marking
batches each contained fabricated rules presented confidently — a broken-red "no stopping during
the hours shown" variant that does not exist, and a left-edge rule with the 150 m and
sunrise-to-sunset qualifiers stripped out. His value on markings has been structure and coverage,
which is real; a client spot-check is style calibration and does not count as QA.
