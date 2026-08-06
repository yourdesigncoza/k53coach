# Action plans — AI-assessment test run, 2026-08-05

TODO index for the work that came out of five headed Playwright runs against the
post-exam AI assessment. Findings and evidence:
**`docs/ai-assessment-test-run-2026-08-05.md`** (10 findings).
Harness: **`scripts/e2e/assessment.mjs`**.

**Nothing here is implemented yet.** Each file is a scoped plan to be approved and
executed one at a time. Update the Status column as they land.

| # | Item | Pri | Status | Blocked by |
|---|---|---|---|---|
| [AP-01](AP-01-live-af-claim-repair.md) | Repair the live `/af` false claims in `ui_translations` | **P0** | **False claims cleared live (2026-08-06)** — 8 rows deleted, cache busted, verified. 41 wording rows remain | Louwrens on the remaining 41 |
| [AP-02](AP-02-stale-override-guard.md) | Make stale overrides non-effective, not just visible | **P0** | Not started | — |
| [AP-03](AP-03-bilingual-assessment.md) | Localise the AI assessment (prompt locale + versioned cache) | **P1** | **Prompt half done** (2026-08-06, in AP-09's shared core). Cache envelope outstanding | — |
| [AP-04](AP-04-fallback-caching.md) | Never persist a fallback assessment; add regenerate | **P1** | **Partly done** — a stored fallback is now a cache miss, so it self-heals. Still written, and no regenerate control | — |
| [AP-05](AP-05-prompt-hardening.md) | Prompt hardening + validator enforcement | **P2** | Not started | AP-03 (shares `prompt_version`) |
| [AP-06](AP-06-prose-citation-sweep.md) | Sweep learner prose for citations (constraint 10) | **P2** | Not started | Louwrens re-sign |
| [AP-07](AP-07-harness-adoption.md) | Adopt the e2e assessment driver + rtk note | **P3** | Not started | — |
| [AP-08](AP-08-end-user-improvements.md) | End-user improvements shortlist | **P3** | (ii) picked 2026-08-06 → AP-09 | — |
| [AP-09](AP-09-free-readiness-assessment.md) | AI assessment on the free readiness test | **P1** | **Built + verified 2026-08-06** — migration applied, both paths green on `/en` + `/af`, cap derived at 400/day. Not yet deployed | Louwrens to read one `/af` assessment |

## Why P0 is P0

The `/af` locale serves **pre-claims-audit copy from the database**, because
`src/i18n/request.ts` merges `ui_translations` rows over the shipped JSON at
request time and all 49 override rows were written 2026-07-17/19 — before the
i18n commits (`848b58e`, `3bdbd9a`, `e05dd48`) and before the 2026-08-04 claims
audit. Verified live on `k53coach.co.za/af` on 2026-08-05:

| Live on /af | Reality |
|---|---|
| "Neem ongeveer **5 minute**" | the free test takes ~1 min (JSON already fixed) |
| "werk **aflyn**" ×2, "installeer as 'n app" | next-pwa service worker is **deferred** — there is no offline mode |
| "kernfunksionaliteit werk **vanlyn**" (`landing.faqA4`) | same false claim in the *other* Afrikaans word for offline — **3 live hits**, and AP-01's original grep list checked only `aflyn`, so it would have passed |
| **R179** hardcoded (`landing.faqA2`) | bypasses `src/lib/pricing.ts`; the JSON uses `{price}` |
| "**VVir** leerders onder 18 moet 'n ouer of voog toestemming gee" (`legal.p3`) | typo, plus the parent-consent claim the audit **removed** (`profiles.parent_consent` is never read or written in `src/`) |

**Consequence for the launch gate:** the Stage 1 row *"Every claim true ✅"* in
`CLAUDE.md` holds for **/en only**. AP-01 + AP-02 close it for /af. Neither the
claims audit nor `docs/claims-audit-2026-08-04.md` looked at the override table.

## Reading order

AP-01 and AP-02 are a pair — repairing the rows without the guard means the next
i18n commit re-opens the same hole. AP-03/04/05 are the paid AI feature and share
`prompt_version`, so AP-03 lands first. AP-06 through AP-08 are independent. AP-09
is the item John picked off AP-08's shortlist; it needs AP-03's prompt-locale change
but none of its cache work, since the free assessment persists nothing server-side.
Wider AI context and the ranked TODO: `docs/ai-integration-todo.md`.

## Conventions used here

- **Data repairs are not migrations.** Row changes go through
  `scripts/data-repairs/<name>-<date>.json` with a per-op `why`, matching how
  the question-bank repairs were recorded.
- **Every decisive grep runs through `rtk proxy`** and counts occurrences with
  `grep -o … | wc -l`, never `grep -c`. See the ⚠ section in the test-run doc —
  this is the trap that hid the whole override problem.
- **Louwrens reads Afrikaans, we don't.** Any Afrikaans *wording* choice is his;
  removing a *false claim* is not a wording choice and does not wait for him.
