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
| `landing.faqA4` | "…kan as 'n toepassing op jou foon **geïnstalleer** word, en die kernfunksionaliteit werk **vanlyn**" | "Ja. Dit werk in enige webblaaier op jou foon…" | install/offline framing. ⚠ **This table first keyed the text to `faqA5`** — see the correction note below |
| `landing.faqA5` | "…koppelvlak is tweetalig – jy kan te eniger tyd… wissel." | same, **plus** "Die vrae en lesse self is voorlopig in Engels" | not false, but drops the English-only disclosure the audit added (constraint 8) |
| `landing.ctaNote` | "Dit neem ongeveer **5 minute**." | "Neem omtrent 'n minuut." | the same 5× overstatement as `readiness.benefitTime`; this table first classed it (b) |
| `landing.faqA2` | "'n Eenmalige betaling van **R179**…" | "{price} eenmalig…" | hardcodes the price, bypassing `src/lib/pricing.ts` — the single source of truth |
| `legal.p3` | "**VVir** leerders onder 18 moet 'n ouer of voog toestemming gee…" | (JSON now carries the device-local result text) | visible typo **and** the parent/guardian-consent promise the audit removed — `profiles.parent_consent` is never read or written anywhere in `src/` |
| `legal.p1`, `landing.feat1Body`, `landing.feat2Body` | pre-audit wording | post-audit wording | `feat2Body` claims "Egte K53-vrae wat ooreenstem met die nuutste…" — an unverifiable claim; JSON grounds it in the Act instead |

Reproduce the full picture (note `rtk proxy` — a plain `grep` gave the wrong answer
here and hid this bug for several rounds):

```bash
rtk proxy node scripts/data-repairs/audit-ui-overrides.mjs           # table
rtk proxy node scripts/data-repairs/audit-ui-overrides.mjs --write   # + rollback JSON
```

## ⚠️ Three corrections the first audit run made to this plan (2026-08-06)

The inventory step exists precisely so the plan gets checked against the database
before anything is deleted. It found three errors in the lists below, all of which
would have survived execution:

1. **The offline claim is in `landing.faqA4`, not `faqA5`.** This plan quoted
   faqA4's text under faqA5's key, classed faqA5 as (a), and left faqA4
   **unclassified and therefore untouched**. Executing as written would have
   deleted a row that isn't false and left *"die kernfunksionaliteit werk
   vanlyn"* — a claim for a feature that does not exist — live on the landing
   page. faqA5 stays in (a) on different grounds: its DB text is accurate but
   predates the audit's English-only disclosure.
2. **`landing.ctaNote` is class (a), not (b).** It reads *"Dit neem ongeveer
   **5 minute**"* — the identical overstatement this plan correctly flags in
   `readiness.benefitTime`. It sat in the bucket that waits for Louwrens.
3. **The two class lists covered 38 of 49 rows.** Eleven were enumerated
   nowhere: `auth.demoSkip`, `auth.learnMore`, `dashboard.mockSub`,
   `dashboard.welcomeSub`, `exam.sectionBrief`, `examResult.failedBlurb`,
   `examResult.passedBlurb`, `examResult.retake`, `examResult.showAll`,
   `legal.p2`, and `landing.faqA4`. The first ten are wording preference → (b);
   the eleventh is the one above.

**Corrected split: (a) 11, (b) 38, unclassified 0.** The script's `CLASSES`
constant is now the machine-checkable copy of this — it buckets nothing by
inference, so a row nobody has classified reports as `unclassified` rather than
being swept into a bucket that authorises deleting it.

### ⚠️ And a fourth: the verification greps could not have caught it

`vanlyn` and `aflyn` are both "offline" — Louwrens used one, our JSON draft used
the other. The grep list at the bottom of this plan checked only `aflyn`, so it
would have returned **0 for every string and reported success** while `vanlyn`
was served **3 times** on `k53coach.co.za/af` (measured 2026-08-06). This is the
same failure shape as the `grep -c` trap recorded in the test-run doc: a search
that cannot find the thing is indistinguishable from the thing being absent.
Both spellings, plus `geïnstalleer`, are now in the script's marker list and in
the verification block.

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
PostgREST **bypasses that action and will not bust the tag**. The fix:

```bash
vercel cache invalidate --tag ui-translations --yes
```

⚠️ **A redeploy does NOT clear it.** This plan originally said it did. Vercel's
Data Cache **persists across deployments** by design, so on 2026-08-06 a full
production redeploy built, aliased to `k53coach.co.za`, and still served every one
of the eight deleted strings. `x-vercel-cache: MISS` and `age: 0` on the document
made it look like nothing was cached at all — the document wasn't; the *fetch* was.
Only the tag invalidation cleared it, and it worked instantly. The other valid
route is one admin save in the translation manager, which calls `updateTag`.

⚠️ **Check the response size before believing a grep.** Verifying against the
deployment URL rather than the alias returned 0 for every false-claim string —
because Vercel SSO redirected it and the body was **15 bytes of "Redirecting…"**.
An empty response scores 0 on every check and reads exactly like a clean page.
`stat -c%s` the file, and grep for a string that *should* be present, before
trusting a row of zeros.

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
# Both spellings of "offline" — see the fourth correction above. Checking only
# `aflyn` returns 0 while `vanlyn` is live.
rtk proxy sh -c 'curl --fail --show-error -s https://k53coach.co.za/af > /tmp/af.html || echo FETCH-FAILED
for s in "aflyn" "vanlyn" "geïnstalleer" "5 minute" "R179" "AI-assessering"; do
  printf "%-16s %s\n" "$s" "$(grep -o "$s" /tmp/af.html | wc -l)"; done'
rtk proxy sh -c 'curl --fail -s https://k53coach.co.za/af/legal/privacy | grep -o "VVir" | wc -l'
```

Expect **0** for every string. Then re-run the audit → no class (a)/(b) rows remain,
class (c) values present in `messages/af.json`. Check `/en` too (one `en` row exists:
`nav.admin`).

## Done when

- [x] All 49 rows inventoried with per-row live evidence and a class — 2026-08-06,
      `scripts/data-repairs/audit-ui-overrides.mjs`. Final split **(a) 8 /
      (b) 38 / deferred 3**, not the 11/29 this plan first stated (see the
      corrections above, and the fifth one below)
- [x] Rollback copy exported — `ui-translations-backup-2026-08-06.json` (49 rows,
      all `updated_by` = `d9357949…`, i.e. Louwrens, as this plan assumed)
- [x] **Class (a) deleted — 8 rows, 2026-08-06**, conditional on the audited value,
      recorded in `ui-translations-repair-2026-08-06.json`. Re-audit: 41 rows,
      **0 false-claim markers**. Decided by John (option (a)).
- [x] **Cache tag busted and live `/af` verified — 2026-08-06.** `vercel cache
      invalidate --tag ui-translations`. Measured on `k53coach.co.za` after:
      `vanlyn` 0, `aflyn` 0, `5 minute` 0, `geïnstalleer` 0, `nuutste handleiding` 0,
      `R20 per maand` 0, and on `/af/legal/privacy` `VVir` 0, `voog toestemming` 0.
      Corrected text present: `ongeveer ’n minuut` 2, `reguit uit die webblaaier` 4,
      `Niks hernu outomaties nie` 3. Page is real (130 KB, `gereedheidstoets` ×17).
      `R179` still appears 5× — correct, that is `{price}` interpolated from
      `src/lib/pricing.ts`, which is the point of the fix. `/en` unaffected.
- [x] **Review pack built for Louwrens — 2026-08-06.** All 41 remaining rows
      (38 class (b) + the 3 deferred), A/B/C per row, defaulting to his wording.
      `docs/louwrens-af-wording-review-2026-08-06.{csv,md}` +
      `.README.md` cover note, generated by
      `scripts/data-repairs/build-louwrens-af-review.mjs`. CSV because that is the
      channel that worked for the question-bank sign-off on 2026-08-05.
- [ ] Sent to Louwrens and returned
- [ ] `CLAUDE.md` claims-audit note updated to say the gate now covers both locales

### ⚠️ A fifth correction: only 8 of the 11 were actually false

Reading the DB text of each class-(a) row rather than trusting the list, three do
not assert anything untrue and were **not** deleted:

| Row | Why it stayed |
|---|---|
| `legal.p1` | Pure grammar — *"geen rekening word benodig nie"* vs *"geen rekening nodig nie"*. No claim content whatsoever. |
| `landing.faqA5` | His text is accurate. Ours only **adds** the English-only-questions disclosure (constraint 8). A missing disclosure, not a falsehood. |
| `landing.feat1Body` | **Deleting it would make the site claim *more*.** His: *"Clear reasons in plain language."* Ours: *"…**getoets teen die amptelike reëls**."* A claims repair must not be the vehicle for shipping a new, unreviewed claim. |

The lesson generalises: "the JSON is post-audit" does not imply "the JSON is the
weaker claim". Three of eleven rows ran the other way. Check the direction of each
change, not just its date.
- [ ] Class (b) reviewed by Louwrens; whatever he keeps is promoted into
      `messages/af.json` and the row deleted, so the file becomes the truth
      (required before AP-02, whose NULL-as-stale drop takes out all 41 at once)
