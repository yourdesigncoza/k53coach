# AP-01 — Repair the live `/af` false claims in `ui_translations`

**Priority P0.** Pairs with [AP-02](AP-02-stale-override-guard.md) — repairing the
rows without the guard re-opens this on the next i18n commit.

## Problem

`src/i18n/request.ts` merges admin-editable `ui_translations` rows over the shipped
`messages/{en,af}.json` at request time:

```ts
const base = (await import(`../../messages/${locale}.json`)).default;
const overrides = await getOverrides(locale);
return { locale, messages: mergeOverrides(base, overrides) };
```

**All 49 override rows were written 2026-07-17/19** — before the i18n commits
(`848b58e`, `3bdbd9a`, `e05dd48`) and before the 2026-08-04 claims audit. Every one
of them still wins at runtime. So `/af` serves mid-July copy, including claims the
audit removed for being untrue.

The file is not the source of truth at runtime. That is the whole bug.

## Evidence

Verified live on `https://k53coach.co.za/af` and `/af/legal/privacy`, 2026-08-05:

| Key | DB (live) | JSON (intended) | Why it matters |
|---|---|---|---|
| `readiness.benefitTime` | "Neem ongeveer **5 minute**" | "Neem ongeveer ’n minuut" | overstates the free test 5× — the exact class the claims audit fixed |
| `landing.feat4Body` | "Enige toestel, installeer as 'n app, **werk aflyn**." | "Enige toestel, reguit uit die webblaaier — niks om af te laai…" | **offline does not exist** — next-pwa service worker is deferred (`docs/backlog.md`) |
| `landing.planF4` | "Werk op enige toestel, **aflyn**" | "Werk op enige toestel" | same false offline claim |
| `landing.faqA5` | "Ja. Dit werk in enige webblaaier en kan as 'n…" | "Ja. Dit werk in enige webblaaier op jou foon…" | install/offline framing |
| `landing.faqA2` | "'n Eenmalige betaling van **R179**…" | "{price} eenmalig…" | hardcodes the price, bypassing `src/lib/pricing.ts` — the single source of truth |
| `legal.p3` | "**VVir** leerders onder 18 moet 'n ouer of voog toestemming gee…" | (JSON now carries the device-local result text) | visible typo **and** the parent/guardian-consent promise the audit removed — `profiles.parent_consent` is never read or written anywhere in `src/` |
| `legal.p1`, `landing.feat1Body`, `landing.feat2Body` | pre-audit wording | post-audit wording | `feat2Body` claims "Egte K53-vrae wat ooreenstem met die nuutste…" — an unverifiable claim; JSON grounds it in the Act instead |

Reproduce the full picture (note `rtk proxy` — a plain `grep` gave the wrong answer
here and hid this bug for several rounds):

```bash
rtk proxy node scripts/data-repairs/audit-ui-overrides.mjs   # to be written by this AP
```

## ⚠️ Who wrote these rows changes the default

**All 49 rows were written by Louwrens** (`louwrens@willsdatabase.com`,
`updated_by` is identical on every row), 2026-07-17/19. That is not vandalism — it
is **the native Afrikaans speaker correcting our first-pass machine draft**, which
is exactly what the translation manager exists for.

So the fault is entirely ours, in two parts:

1. We later edited `messages/af.json` (`848b58e`, `3bdbd9a`, `e05dd48`) **without
   knowing his edits existed**, and nothing in the tooling says they shadow ours.
2. The **false claims originate in our own July English** — "works offline",
   "takes about 5 minutes". He translated the English of the day faithfully. The
   2026-08-04 claims audit then corrected the English **and left his translations
   untouched**, so `/af` is frozen at July, retracted claims included.

**Therefore the default inverts: his wording wins unless it states something
untrue.** An earlier draft of this plan classed ~29 rows as "terminology — reset so
JSON wins", which would have **reverted a native speaker's Afrikaans in favour of our
machine draft**. Do not do that. `Voertuigkontroles` vs our `Voertuigbeheer`,
`Teken in` vs our `Meld aan` — he is right by default; we are the ones guessing.

The genuinely open question is narrow: where a later commit standardised terminology
deliberately (`e05dd48` "use one Afrikaans word for the mock exam" replaced his
`Oefen toets` with `Proefeksamen`), which term wins is **his call**, and the answer
belongs in `messages/af.json` either way.

## Approach

### 1. Inventory first, decide second

Write `scripts/data-repairs/audit-ui-overrides.mjs` (read-only) that emits one row
per override:

```
locale, namespace, key, db_value, json_value, updated_at, class, action
```

Class each of the 49 rows into exactly one bucket:

- **(a) False or withdrawn claim → reset now.** No wording judgement involved; the
  DB text asserts something untrue. Known members: `readiness.benefitTime`,
  `landing.feat4Body`, `landing.planF4`, `landing.faqA5`, `landing.faqA2`,
  `legal.p3`, `legal.p1`, `landing.feat1Body`, `landing.feat2Body`.
- **(b) Terminology where a later commit disagreed with him → his call, then the
  answer goes into `messages/af.json` and the row is deleted.** Default to **his**
  wording; only our standardisation reasoning (one term per concept) argues the
  other way, and that is a preference, not a correctness matter. Members:
  `topics.controls`, `module.controlsTitle`,
  `module.controlsSubtitle`, `module.backControls`, `module.relatedControls`,
  `nav.mock`, `nav.home`, `landing.login`, `common.login`, `paywall.testNeedsAuth`,
  `auth.title`, `mock.timerLabel`, `mock.viewResult`, `notFound.home`,
  `result.seeAssessment`, `assessment.cta`, `examResult.viewAssessment`,
  `progressPage.blendNote`, `learn.subtitle`, `landing.demoKicker`,
  `landing.planCta`, `landing.ctaNote`, `landing.subtitle`, `landing.feat2Title`,
  `landing.feat3Body`, `mock.subtitle`, `mock.rule1`, `mock.rule2`, `en nav.admin`
  (a stray trailing space).
- **(c) DB wording genuinely better than the JSON → promote into
  `messages/af.json`, then delete the row.** Louwrens decides membership; do not
  guess. Candidates to put in front of him, not conclusions.

Reset = **delete the row**. That is the documented mechanism — the migration
comment states a row exists *only* when an admin has edited away from the default,
and "Reset" deletes it, so absence means the JSON default renders.

### 2. Safety before any delete

- Fresh timestamped export of all 49 rows (including `updated_at` / `updated_by`)
  to `scripts/data-repairs/ui-translations-backup-2026-08-05.json`. Second copy
  already exists: `~/zoot/backups/k53coach-park-2026-07-31/data-public.sql` holds
  all 49 (verified).
- **Deletes are conditional on the audited `value`** (`?value=eq.<old>`) so a row
  edited between audit and repair aborts instead of being clobbered.
- Class (c) rows are promoted into `messages/af.json` **and committed** before
  their rows are deleted, so no window exists where the string is worse than today.

### 3. Cache invalidation

`getOverrides` is `cache: "force-cache"` tagged `ui-translations`, busted by
`updateTag` in `src/lib/translation-actions.ts` on save. A repair done via
PostgREST **bypasses that action and will not bust the tag**. Either route the
repair through the admin save/reset path, or trigger a revalidation (redeploy, or
an admin save on any one string) and then verify against the live HTML.

## Files

- `scripts/data-repairs/audit-ui-overrides.mjs` (new, read-only)
- `scripts/data-repairs/ui-translations-repair-2026-08-05.json` (new, the record)
- `scripts/data-repairs/ui-translations-backup-2026-08-05.json` (new, the rollback)
- `messages/af.json` (only for class (c) promotions)
- Read-only reference: `src/lib/translations.ts`, `src/i18n/request.ts`,
  `supabase/migrations/20260629120119_ui_translations.sql`

## Risks

- **Reverting a native speaker's Afrikaans.** The real risk, and the one an earlier
  draft of this plan walked into. Every row is Louwrens's; the burden of proof is on
  *us* to justify replacing his wording, not on him to defend it. Only class (a)
  proceeds without him — a false claim is not a wording preference.
- **Stale CDN/tag cache** making the repair look ineffective (or effective when it
  isn't). Always verify against the live HTML, not the database.
- **Recurrence** — guaranteed without AP-02. Do not close AP-01 alone.

## Verification

All greps via `rtk proxy`, counting occurrences, status-checked first:

```bash
rtk proxy sh -c 'curl --fail --show-error -s https://k53coach.co.za/af > /tmp/af.html || echo FETCH-FAILED
for s in "aflyn" "5 minute" "R179" "AI-assessering"; do
  printf "%-16s %s\n" "$s" "$(grep -o "$s" /tmp/af.html | wc -l)"; done'
rtk proxy sh -c 'curl --fail -s https://k53coach.co.za/af/legal/privacy | grep -o "VVir" | wc -l'
```

Expect **0** for every string. Then re-run the audit → no class (a)/(b) rows remain,
class (c) values present in `messages/af.json`. Check `/en` too (one `en` row exists:
`nav.admin`).

## Done when

- [ ] All 49 rows inventoried with per-row live evidence and a class
- [ ] Backup + repair record committed to `scripts/data-repairs/`
- [ ] Class (a) and (b) rows deleted, conditional on audited value
- [ ] Class (c) reviewed by Louwrens, promoted into `messages/af.json`, rows deleted
- [ ] Cache busted and the live `/af` HTML shows 0 for all five strings
- [ ] `CLAUDE.md` claims-audit note updated to say the gate now covers both locales
