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

### 3. Coverage gap — 15 core chart signs we DON'T have (new finding)
Source of truth `data/chart-authority.json` lists **429** codes (incl. road
markings GM/RM/WM=38 and temporary TR/TW=122, both out of MVP scope). Of the
**269 core learner codes (R/W/IN)** we serve **254 (~94%)**; **15 are missing
from our DB entirely** — we have no PD artwork for them:
- Regulatory: R201, R325, R326, R341
- Warning: W346
- Info: IN1, IN2, IN3, IN11.1–11.4, IN19, `IN11.568`, `IN11.577`

`IN11.568` / `IN11.577` are almost certainly PDF-extraction artifacts (bogus
sub-numbers) — verify against the chart, likely drop from the authority. The
other ~13 need Wikimedia sourcing + the normal verify pipeline before they ship.

### 4. 143 not-in-chart signs
Currently `sa_relevant=false` (excluded). Quick triage: any actually valid SA
signs we want to serve?

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
