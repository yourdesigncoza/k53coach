# Sign accuracy pipeline — execution plan

> **Status: EXECUTED.** All 6 phases ran. 254 in-chart signs verified in-session
> against the chart; **245 auto-approved** (asset+content) with drafted learner
> content, **9 in the admin exceptions queue** (8 low-confidence vision, 1 content
> demotion: R324). Learners are served approved-only. Re-run any phase idempotently
> via the `scripts/signs/*` scripts below; `check-drift.mjs` is the CI guard.

**Run this in a fresh session.** Goal: every learner-visible road sign is
**verified accurate against the official SA DoT chart** (`init/RTSigns_charts.pdf`
= ground truth). Verification is done **inside the Claude Code session** (Claude
reads the rendered sign + chart-page PNGs directly — semantic + vision
cross-check — no `ANTHROPIC_API_KEY` / API script needed); a **human only touches
signs that don't align with the chart**. Learners see **approved-only**.

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
- **Auto-approval is allowed ONLY when Claude (this session) passes both** a
  semantic check (code↔name↔meaning vs chart) **and** a vision check (rendered SVG
  vs the chart's depiction). Anything failing/uncertain → **human exceptions queue**.
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
- **No `ANTHROPIC_API_KEY`.** Verification runs *in this Claude Code session*:
  a script renders the images, the session's Claude (and spawned subagents) Read
  the rendered sign PNG + chart-page PNG and emit structured verdicts, and a
  writer script persists them. Ambiguous cases escalate to a deeper agent pass
  and/or the adversarial panel (`grok-review`, `codex-review`, `ask-gemini`)
  before falling to the human queue.
- `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (present) for DB writes.
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
    add column verification jsonb,                  -- {confidence,reason,visionPass,semanticPass}
    add column approved_by text,                    -- 'ai:claude-code' | 'panel' | '<human>'
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
- **`alignment` is a prior, not a Phase-3 gate.** The SA chart uses formal terms
  ("Pedal cycles", "Proceed left only", "mini-circle") where Wikipedia uses casual
  ones ("Cyclists", "Turn left", "roundabout"), so ~⅔ of valid in-chart signs are
  deterministic `name_mismatch`/`ambiguous`. Phase 3 therefore verifies **every
  in-chart sign** (`alignment != 'not_in_chart'`) by vision against the chart page
  — the only reliable semantic authority. `aligned` just marks the high-confidence
  subset.

## Phase 3 — Claude verification + sign-off (core, session-based)
Verification is performed by **this Claude Code session**, not an API script.
Input set = **every in-chart sign** (`alignment != 'not_in_chart'`), since the
deterministic name match is too weak to gate on (see Phase 2). Three pieces:

1. **`scripts/signs/build-verify-manifest.mjs`** — for every in-chart
   row: render the SVG → PNG via resvg (`data/verify/png/<code>.png`), resolve its
   `chart_match.page` → chart-page PNG (`data/chart-pages/page-N.png`), compute the
   SVG sha256, and emit **`data/verify/manifest.json`**: `[{code, wikipediaName,
   category, chartName, chartPage, svgPngPath, chartPngPath, svgHash}]`. Gitignore
   `data/verify/`.

2. **Session verification (subagents).** Claude Code fans out over the manifest in
   batches (Agent/Workflow). Each subagent, per sign, **Reads the rendered sign PNG
   + the chart-page PNG** and judges against ground truth. Prompt contract:
   - *"You verify a South African road sign against the official DoT chart (ground
     truth). Be strict. If the artwork or meaning is uncertain or doesn't clearly
     match the chart, FAIL. Never invent fines/penalties."*
   - inputs: `{code, wikipediaName, category, chartName, chartPage}` + the two
     images.
   - structured output per sign: `{code, match:bool, confidence:0-1, reason,
     visionPass:bool, semanticPass:bool, suggestedName, contentDraft:{plainEnglish,
     formalMeaning, behaviour, commonMistake, testHint}}`.
   Write verdicts to **`data/verify/verdicts/<code>.json`**.
   - `0.6 ≤ confidence < 0.85` OR vision/semantic disagree → re-judge with a
     deeper agent pass (higher effort / opus), then the panel (`grok-review` /
     `codex-review` / `ask-gemini`); set `approvedBy:'panel'` on pass.
   - `< 0.6` or any conflict → mark `escalate:'human'` (no approval).

3. **`scripts/signs/apply-verdicts.mjs`** (service-role write) — read the verdicts
   and apply the decision:
   - `match && visionPass && semanticPass && confidence ≥ 0.85` → **auto-approve
     asset** (`asset_status='approved'`), write `contentDraft` to `content.*.en`,
     set `review_status='approved'` **only if** the verdict carries a passing
     content-factuality check (a second session pass — see below). Record
     `approved_by` (`'ai:claude-code'` or `'panel'`), `verification` jsonb,
     `verified_at`, `svg_hash`, `alignment` unchanged.
   - otherwise leave statuses untouched (human queue) and store `verification` +
     `reason` for the admin view.
   Content factuality is a **second session pass** over each drafted `content`
   block (cheap, text-only) that must pass before `review_status='approved'`; on
   fail, asset stays approved but content routes to the human queue.

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
