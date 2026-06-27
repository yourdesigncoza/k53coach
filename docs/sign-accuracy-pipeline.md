# Sign accuracy pipeline — execution plan

**Run this in a fresh session.** Goal: every learner-visible road sign is
**verified accurate against the official SA DoT chart** (`init/RTSigns_charts.pdf`
= ground truth). Verification is automated with **Claude (semantic + vision
cross-check)**; a **human only touches signs that don't align with the chart**.
Learners see **approved-only**.

## Why this exists
Accuracy of signs is a **hard gate, not an MVP nicety** — the sign library is the
product's moat. Today the app ingested 397 PD SADC SVGs from Wikipedia and shows
them all with a "draft" badge. That is the problem: unverified signs are visible.
This plan makes the official chart the authority, auto-verifies against it, and
serves only verified signs.

## Principles (non-negotiable)
- **Ground truth = `init/RTSigns_charts.pdf`** (official SA DoT chart) for: SA
  test-relevance, canonical code, name, variant, and correct artwork.
- **Wikipedia/Commons = candidate artwork + index only** (already ingested).
- Ship to learners only when `asset_status='approved' AND review_status='approved'`.
- **Auto-approval is allowed ONLY when Claude passes both** a semantic check
  (code↔name↔meaning vs chart) **and** a vision check (rendered SVG vs the chart's
  depiction). Anything failing/uncertain → **human exceptions queue**.
- **Auditable**: every approval records `approved_by`, evidence (matched chart
  name/page, model, confidence), `svg_hash`, `verified_at`.

## Current state (already built — don't redo)
- `scripts/signs/ingest-wikipedia.mjs` — Wikipedia wikitext → catalog + SVG
  download (deterministic, exact Commons filenames). 397 PD SVGs in `public/signs/`.
- `data/signs-catalog.json` — 397 records w/ provenance + `inOfficialChart` (254 true).
- `road_signs` table (DB1): code PK, name, category, subcategory, temporary,
  in_official_chart, svg_file, source/licence/attribution_required,
  `asset_status`, bilingual `content` jsonb, `review_status`. RLS public-read /
  admin-write via `is_admin()`. Seeded (397 rows) by `scripts/signs/seed-db.mjs`.
- Admin section `/admin` (role-gated) with per-sign editor + AI-draft route.
- App reads signs from the DB (currently **shows all** — change in Phase 5).

## Prerequisites for this session
- `ANTHROPIC_API_KEY` in `.env.local` (and Vercel later).
- Models: **`claude-sonnet-4-6`** (vision) for the batch; escalate ambiguous to
  **`claude-opus-4-8`** and/or the adversarial panel (`grok-review`,
  `codex-review`, `ask-gemini`). (Per `claude-api` skill for exact API usage.)
- SVG→PNG: add **`@resvg/resvg-js`** (npm, no system deps). PDF→PNG: **`pdftoppm`**
  (poppler — already present; `pdftotext` is used).

---

## Phase 0 — Schema hardening (FIRST, before any approval)
New migration `supabase migration new sign_verification`:
- **Surrogate key** (a Wikipedia rename must not swap an approved sign):
  ```sql
  alter table public.road_signs add column sign_id uuid not null default gen_random_uuid();
  alter table public.road_signs drop constraint road_signs_pkey;
  alter table public.road_signs add primary key (sign_id);
  alter table public.road_signs add constraint road_signs_code_key unique (code);
  ```
- **Verification + integrity columns:**
  ```sql
  alter table public.road_signs
    add column sa_relevant boolean,                 -- null=unknown; drives serve filter
    add column alignment text not null default 'unverified'
      check (alignment in ('unverified','aligned','not_in_chart','name_mismatch','ambiguous')),
    add column chart_match jsonb,                   -- {code,name,page,score}
    add column verification jsonb,                  -- {model,confidence,reason,visionPass,semanticPass}
    add column approved_by text,                    -- 'ai:claude-sonnet-4-6' | 'panel' | '<human>'
    add column verified_at timestamptz,
    add column svg_hash text,                       -- sha256 of the approved SVG
    add column source_rev text;                     -- wikitext revid / commons sha (drift)
  ```
- Regenerate types: `supabase gen types typescript --linked > src/lib/database.types.ts`.
- Update `src/lib/signs.ts` (`SignRow`) consumers as needed.

## Phase 1 — Strengthen the PDF ground truth
- Extend `scripts/signs/extract-pdf.mjs` (or new `extract-chart-authority.mjs`):
  maximize **code → {name, category, page}** coverage from the chart. The
  description sheets have `CODE Name sign` rows; improve de-spacing + regex; also
  capture **page number** per code (for vision crops). Output
  **`data/chart-authority.json`**: `[{code,name,category,page}]`.
- Render chart pages for vision reference:
  `pdftoppm -png -r 150 init/RTSigns_charts.pdf data/chart-pages/page`
  → `data/chart-pages/page-1.png …` (gitignore `data/chart-pages/`).

## Phase 2 — Deterministic cross-check
`scripts/signs/crosscheck.mjs` (service-role write):
- Join `road_signs` ↔ `chart-authority` by `code`. Classify `alignment`:
  - in chart + name fuzzy-matches (normalize + token/Levenshtein threshold) → `aligned`
  - not in chart → `not_in_chart`
  - in chart, name disagrees → `name_mismatch`
  - variant ambiguity (TW vs W, suffixes, parenthesised) → `ambiguous`
- Write `alignment` + `chart_match`. **No approvals here.** Set `sa_relevant`
  provisional = `in_official_chart` (human can override later).

## Phase 3 — Claude verification + sign-off (core)
`scripts/signs/verify-claude.mjs` — batch over `alignment='aligned'`:
1. Render the sign's SVG → PNG via resvg.
2. Claude `claude-sonnet-4-6` (vision) message:
   - system: *"You verify a South African road sign against the official chart
     ground truth. Be strict. If the artwork or meaning is uncertain or doesn't
     clearly match, FAIL. Never invent fines/penalties."*
   - user: `{code, wikipediaName, category, chartName (ground truth), chartPage}`
     + the rendered SVG PNG (+ optional chart-page PNG).
   - ask for JSON: `{match:bool, confidence:0-1, reason, visionPass:bool,
     semanticPass:bool, suggestedName, contentDraft:{plainEnglish, formalMeaning,
     behaviour, commonMistake, testHint}}`.
3. Decision:
   - `match && visionPass && semanticPass && confidence ≥ 0.85` → **auto-approve
     asset** (`asset_status='approved'`), write `contentDraft` to `content.*.en`,
     and a **second Claude pass validates content factuality** → if it passes,
     `review_status='approved'`. Record `approved_by='ai:claude-sonnet-4-6'`,
     `verification`, `verified_at`, `svg_hash` (sha256 of the SVG file).
   - `0.6 ≤ confidence < 0.85` OR vision/semantic disagree → **escalate** to
     `claude-opus-4-8`, then if still unsure to the panel (`grok-review` /
     `codex-review` / `ask-gemini`); record `approved_by='panel'` on pass.
   - `< 0.6` or any conflict → **leave for human** (no status change).
- Cost: ~399 sonnet calls, 1 image each (cheap); few escalations.

## Phase 4 — Exceptions queue (admin)
- `/admin`: filter `alignment != 'aligned' OR review_status != 'approved'`. Per
  row show **official chart name + page image** beside the candidate SVG + Claude's
  `reason`. Human actions: approve, **exclude** (`sa_relevant=false`), fix
  code/name, resolve variant. Add bulk approve/exclude.

## Phase 5 — Serve approved-only + integrity
- Learner queries (`getSigns`, `getSignByCode`): add
  `.eq('asset_status','approved').eq('review_status','approved').eq('sa_relevant',true)`.
  Remove the "show all + draft badge" behaviour.
- Learn-index count = approved count.
- (Optional) runtime `svg_hash` integrity check.

## Phase 6 — Drift / re-sync safety
- Persist `source_rev` (wikitext revid + per-file Commons sha) at ingest.
- Re-ingest = **diff vs stored → review queue** (added/removed/changed). Never
  auto-overwrite an approved asset whose `svg_hash` changed — flag it instead.

## Acceptance criteria
- All 254 in-chart signs verified (auto or human); learners see approved-only;
  exceptions queue triaged; every approved sign has `svg_hash` + `approved_by` +
  `verification` evidence; `serve-approved-only` live.

## Open decisions for the executing session
- **Content auto-approval**: this plan auto-approves AI-drafted content when the
  second Claude pass validates it. If you want stricter wording control, route
  content (not asset) approval to the human queue while keeping asset auto-approval.
- Confidence thresholds (0.85 / 0.6) — tune after the first batch.
- Whether `sa_relevant` defaults strictly to `in_official_chart` or stays null
  until reviewed.

## Touchpoints to update when done
- `docs/road-sign-assets.md` (still describes the old search pipeline).
- `CLAUDE.md` (sign library is now DB-backed + verification-gated).
- Delete unused `src/content/road-signs.ts` (old TS samples).
