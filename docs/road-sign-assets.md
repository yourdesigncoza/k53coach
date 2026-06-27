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
