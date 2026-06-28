# Sign pipeline — where we left off (handoff)

**2026-06-28 session:** triaged the exceptions queue to empty and shipped the
full verified set. The road-sign library is now **254 shippable, queue 0**.

**State now:** 254 in-chart signs served to learners (both gates approved +
`sa_relevant`), 0 in the admin exceptions queue, 143 not-in-chart excluded.
Drift guard checks all 254 and passes. Prod (k53coach.vercel.app) serves 254.

---

## Done this session

- [x] **Triaged all 9 queued signs → approved** (R226/R227/R228/R229/R231 vehicle
      prohibitions, W319 tunnel, IN10 Park & Ride, R208 two-bar, R324 diplomatic).
      Queue is now empty; shippable 245 → **254**.
- [x] **Pinned `svg_hash` for the 8 UI-approved signs.** They reached the queue as
      `needs_review`, so the pipeline never pinned their artwork hash — the drift
      guard was silently skipping them (checked 246, not 254). Now all 254 pinned.
- [x] **Fixed the root cause in `bulkSignAction`** (`src/lib/admin-actions.ts`):
      the approve path now copies `source_rev` → `svg_hash` on approval, so future
      UI approvals are drift-protected automatically (no fragile fs read in the
      serverless function).
- [x] **Fixed 16 broken/garbage sign names** being served to learners — scrape
      artifacts like `alt=`, `[[Woonerf|...]]` wikilink markup, `Stop. Two stop`,
      bare `Warning`. Promoted the chart-canonical `verification.suggestedName`
      (correct in every case): R1.1, R403, W339, W401–W411, W413, W415.
- [x] **Confirmed prod deploy** (`6accf28`) green; `/en/learn/road-signs` serves
      254, `/admin` queue empty.

---

## Pick up here (priority order)

### 1. Canonical names — the remaining decision (NOT yet applied)
Verification recorded a chart-canonical `suggestedName` that differs from the
stored Wikipedia `name` for **~183 of the 254 served signs** (after the 16
garbage ones were fixed). These are mostly *stylistic* — chart "Traffic circle"
vs stored "Roundabout ahead", "Yield" vs "Give Way / Yield", "Turn left" vs
"Turn left ahead". **Do NOT blanket-promote** `suggestedName`:
- R208's suggestedName is a diagnostic string ("…meaning needs human
  confirmation"), not a name.
- Some chart names are terser/worse for learners (e.g. R105 "Turn Left" →
  "Proceed left only").

Decide the policy: keep learner-friendly Wikipedia names, adopt chart-canonical
wholesale (with a deny-list), or curate. A dump of all diffs:
`node scripts/signs/dump-queue.mjs` is queue-only — write a similar one-off
against `verification.suggestedName != name` if you want the full list again.

### 2. Confidence thresholds
0.85 auto-approve / 0.6 human. After seeing the queue (8 of 9 were vision
borderlines that all approved fine), consider nudging 0.85 down slightly to
clear more automatically — weigh against the hard-accuracy gate.

### 3. Coverage gap — partially closed (sourced 6, 7 still open)
Source of truth `data/chart-authority.json` lists **429** codes (incl. road
markings GM/RM/WM=38 and temporary TR/TW=122, both out of MVP scope). Of the
**269 core learner codes (R/W/IN)** we now have **260 in the DB** — 254 served +
**6 newly sourced into the admin queue** (`needs_review`, not yet served):
W346, IN19, IN11.1, IN11.2, IN11.3, IN11.4. Source them with
`node scripts/signs/source-missing.mjs && node scripts/signs/seed-db.mjs &&
node scripts/signs/crosscheck.mjs`. **Review them in /admin** (all chart p.2):
- **W346** Emergency flashing light, **IN19** Modal transfer → Approve.
- **IN11.1–11.4** are SUPPLEMENTARY PLATES (per SARTSM V4C9: .1 advisory speed,
  .2 distance "for", .3 distance "to", .4 text message) — modifiers shown under a
  primary sign, **not standalone quiz signs → Exclude** from the learner set.

**`init/V4C9.pdf` = SARTSM Vol 4 Ch 9 (Information signs)** is the authority for
the IN-series (local-only, gitignored — 15MB; ask John for the file). It corrected an earlier mistake: `IN11.568` / `IN11.577` are NOT
OCR artifacts — they are real **IN11.500-series symbolic plates** (INS-568 =
goods vehicle, INS-577 = police vehicle; cf. IN11.572 = abnormal vehicle). The
whole IN11.x family (.1–.6 + the .500 symbol series) is supplementary plates —
keep in the authority as real codes, but **exclude from serving**.

**Still missing (7), need decisions before sourcing:**
- **R201** — exists on Commons only as speed/GVM variants (`R201-60/-90/-100…`);
  parametric sign, pick representative variant(s).
- **R325** (Bus stop reservation), **R341** — only numbered variants on Commons.
- **IN1 / IN3** (Countdown, per V4C9) — only class/tourism variants on Commons
  (`IN1 (Class A1)`…); pick the plain countdown variant.
- **R326** (Minibus stop reservation), **IN2** — not on Commons at all; need
  another PD source or redraw (mind PRD-additions §3 — prefer sourced PD).

### 4. 143 not-in-chart signs — CLOSED (external-content pipeline)
The not-in-chart cohort had PD artwork but empty content + `sa_relevant=false`.
Closed via the **external-content pipeline** (no chart ground truth → grounded in
primary official sources, two automated PRE-serve gates, human only on
ambiguity). DRY family templates in `data/external-families.json`. Outcome of the
143:
- **101 served** — speed limits R201-5..120, end-restriction `-600`, parking
  R3xx-P, prohibitions R242/R245, pedestrian R360, moveable bridge W365, info
  IN16/17/20, bus/mini-bus stops, and the R500-series supplementary plates
  (applies-to-vehicle / time / direction / misc). Drafted → artwork visually
  verified → independently content-audited → auto-approved at conf ≥ 0.95 +
  primary source. Served set 260 → **361**.
- **1 in the human queue: R360-LES** — its artwork is a warning triangle but the
  drafted content frames a regulatory crossing; the artwork gate caught the
  mismatch the text-only audit missed. **Review in /admin** (fix the framing to
  "pedestrian crossing ahead — warning", or exclude).
- **41 documented exclusions** (`verification.exclusionReason`, gates unchanged,
  via `scripts/signs/stamp-exclusions.mjs`): 36 `R5xx-B` layout duplicates, 2
  `alt=` scrape artifacts (IN9/IN18), 2 speed+plate composites (R201-100-R512,
  R201-120-R511 — deferred), 1 non-SA right-hand-traffic variant (IN19-RHT).

Pipeline scripts: `apply-external-drafts` → `render-external-manifest` →
`external-verify-prompt.md` → `prep-external-audit` + `external-audit-prompt.md`
→ `apply-external-verdicts`; shared helpers in `lib.mjs`; `check-drift` asserts
provenance. Re-run a family: `node scripts/signs/apply-external-drafts.mjs
--family <id>` then render/verify/audit/apply-verdicts.

### 5. Still deferred (not this pipeline)
- [ ] **Afrikaans content** — sign `content.*.af` is empty; English-only so far.
- [ ] Escalation panel (`grok-review`/`codex-review`/`ask-gemini`) was speced but
      not needed — the 9 went straight to the human queue.

---

## Re-run / verify commands
```bash
node scripts/signs/check-drift.mjs          # CI guard: approved SVGs unchanged (now 254)
node scripts/signs/dump-queue.mjs           # dump the exceptions queue (now empty)
node scripts/signs/crosscheck.mjs           # re-derive alignment + chart_match
node scripts/signs/build-verify-manifest.mjs   # re-render PNGs + manifest
node scripts/signs/apply-verdicts.mjs --dry-run   # preview verdict application
```
Verdict/audit files (gitignored) live under `data/verify/`. The chart ground
truth is `data/chart-authority.json`; admin chart reference images are
`public/chart-pages/page-{1,2}.png`.
