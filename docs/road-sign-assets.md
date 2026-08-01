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

## Pipeline (DB-backed, chart-verified)

The library now lives in the **`road_signs` Postgres table** (DB1), not in a TS
file, and verification against the official chart is **automated in a Claude Code
session** (no API key). Full execution plan: `docs/sign-accuracy-pipeline.md`.
The scripts (in `scripts/signs/`):

```
ingest-wikipedia.mjs   Wikipedia wikitext → data/signs-catalog.json + public/signs/*.svg
seed-db.mjs            catalog → road_signs (DRIFT-SAFE: never clobbers an approved sign)
extract-chart-authority.mjs  RTSigns_charts.pdf → data/chart-authority.json (ground truth)
crosscheck.mjs         road_signs ↔ chart authority → alignment + chart_match
build-verify-manifest.mjs    render each in-chart SVG → PNG + chart-page PNG + svg hash
  (session subagents read the PNGs, judge vs the chart, write data/verify/verdicts/*)
apply-verdicts.mjs     verdicts → asset/content approval + verification evidence + svg_hash
  (independent content-factuality pass: prep-content-batches.mjs → apply-content-audit.mjs)
check-drift.mjs        CI guard: approved SVG on disk still matches its pinned svg_hash
```

Auto-approval requires Claude to pass **both** a vision check (rendered SVG vs the
chart glyph) **and** a semantic check (code↔name↔meaning vs the chart), at
confidence ≥ 0.85, **and** an independent content-factuality pass. Anything
uncertain lands in the admin **exceptions queue** for a human.

## Division of labour

| Tool | Use for |
|------|---------|
| **Wikimedia** | the SVG sign artwork (PD source — not AI, not redraw) |
| **Chart (`RTSigns_charts.pdf`)** | the ground truth for code, name, category, variant, artwork |
| **Claude (this session)** | vision+semantic verification vs the chart, plain-English content drafting, content factuality cross-check |
| **Admin/human** | the exceptions queue only — signs Claude could not confidently clear |

## Two review gates per sign (don't conflate)

- `asset_status` — is the **SVG** licence-clean & chart-verified? (`needs_review → audited → approved`)
- `review_status` — is the **learning content** accurate? (`draft → reviewed → approved`)

Plus `sa_relevant` (is the sign in the official chart at all). A sign is served to
learners only when `asset_status='approved' AND review_status='approved' AND
sa_relevant=true` — enforced in one place, `getApproved*` in
`src/lib/supabase/queries.ts`.

## Auditability & drift

Every approval records `approved_by` (`ai:claude-code` | `panel` | `human:*`),
`verification` (confidence, reason, vision/semantic/content checks, suggested
name), `verified_at`, and `svg_hash` (sha256 of the approved SVG). `source_rev`
holds the at-ingest SVG hash. Re-running `seed-db.mjs` after a fresh ingest never
overwrites an approved sign; if an approved SVG changed upstream it is reported as
**drift** for review. `check-drift.mjs` is the read-only CI guard.

---

## Two Vienna-Convention signs withdrawn, and a worklist — 2026-07-31

**`R360` and `R360-LES` are out of the served set** (`review_status='draft'`,
`scripts/data-repairs/withdraw-foreign-signs-2026-07-31.json`). Both are the **blue** square
carrying a white triangle with a pedestrian on a zebra — the European form. South Africa's
pedestrian-crossing sign is **W306**: a red triangle, white background, black symbol, *"Warns a road
user of a marked pedestrian crossing ahead"* (Sch 1). Neither code appears anywhere in the
Regulations.

**The bank had already caught this and only half-acted.** `RS-041` was withdrawn on 2026-07-30 for
describing exactly this sign as South African. The question was pulled; the sign it described stayed
live for another day. Withdrawing a question is not withdrawing the claim — check the library
whenever an item is pulled for a content reason.

**`R360-LES` shows the gate failing open.** Its own verification note reads *"Artwork is a RED
WARNING TRIANGLE (crossing ahead), but drafted content frames it as a regulatory crossing-here /
give-way sign — mismatch; route to human"*, confidence 0.55. It reached a human and was approved
anyway. A routed exception that gets waved through is worse than one that was never routed, because
the audit trail records a human decision.

### The worklist this surfaced — 64 signs, NOT a defect

A sweep of all 377 served signs asked which are grounded in either the DoT chart or the Regulations.
Raw answer: 156 ungrounded. That number is wrong, and the way it collapsed is worth recording:

| Test | Ungrounded | Why the number fell |
|---|---|---|
| Code literally in the Regulations | 156 | `RM*` markings are defined in the SADC manual, not the Regulations |
| In the chart **or** the Regulations | 99 | — |
| …**or** its base code is (`R201-60` → `R201`) | **66** | Variant suffixes (`-60`, `-P`, `-LES`) are our coding scheme, not the source's |

Of the final 66, **only the two above carry positive evidence of being foreign.** The other 64 are
mostly the `R5xx` **selective-restriction sub-plates** ("Applies to buses", "Applies during the
specified hours") — a real SA class; `R513`, `R514`, `R519` and `R530` *are* in the extracted text,
so their neighbours' absence is OCR loss in a dense table, not proof they do not exist.

**So: absence from an OCR'd extraction is not evidence of absence.** Confirming those 64 needs SADC
RTSM Vol 2/3, which is not in `resources/`. Until then they stay served and this is a worklist.

**The one structural finding worth acting on:** 345 of 377 served signs carry an `ai:` approver, and
**101 of those are `ai:claude-code+brave`** — the fallback path that ran a web search when the chart
did not contain the sign, and cited third-party sites such as `k-53.co.za`. That fallback is where
`R360` entered. Constraint 4 permits automated chart verification; it does not contemplate approving
a sign the chart does not contain on the strength of a search result. Any future ingest should refuse
to approve where `in_official_chart` is false.
