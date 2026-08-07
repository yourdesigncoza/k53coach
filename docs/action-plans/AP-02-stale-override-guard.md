# AP-02 — Make override drift loud

**Priority P0.** Pairs with [AP-01](AP-01-live-af-claim-repair.md). AP-01 cleaned up
the damage; this is the one that stops it happening unnoticed again.

> ⚠ **The approach changed on 2026-08-07.** This plan used to be *auto-drop*: a
> stale override would stop applying so a JSON commit always won. **John reversed
> that.** Whatever an admin saved — including an AI-drafted string reviewed and
> saved in the translation manager — **always outranks the code**, permanently,
> until an admin changes it. The rest of this document is the revised plan.
> Auto-drop is recorded at the bottom under *Rejected*, so it stops being
> re-proposed.

## Problem

Nothing notices when a `ui_translations` override has been left behind by a change
to the shipped JSON default. Concretely: commit `e05dd48` *"fix(i18n): use one
Afrikaans word for the mock exam"* edited `messages/af.json` and **had no effect on
what users see**, because a July override still won. Nobody would know without
diffing the database against the file by hand — and nobody did, for three weeks,
while `/af` served a "5 minute" test length, two "works offline" claims, a
hardcoded R179 and a parent-consent promise nothing implements.

Ground truth, checked 2026-08-05, still accurate:

- **`ui_translations` had no `default_hash` column.** Schema was
  `(locale, namespace, key, value, updated_at, updated_by)` —
  `supabase/migrations/20260629120119_ui_translations.sql`.
- **`defaultHash()` in `src/lib/translations.ts` was only an in-session concurrency
  guard.** It is passed as `defaultSeen` to `saveTranslation`, which rejects the
  save if the default drifted *while the editor was open*. It was never persisted,
  so it could not answer "has the default changed since this override was written?".
- **The read path cannot see a hash.** `getOverrides` selects `namespace,key,value`
  from `ui_translations_public`, and that view exposes only
  `locale, namespace, key, value`.

Re-measured **2026-08-07: `ui_translations` is empty — 0 rows**, in both the table
and the public view. AP-01's two delete passes have run (backup:
`scripts/data-repairs/ui-translations-backup-2026-08-06.json`) and Louwrens's
reviewed wording is in `messages/af.json` and deployed. **So this ships against a
clean table**, and the old plan's biggest risk — "NULL-as-stale drops all 49 rows
the moment this ships" — no longer exists. There is nothing live to lose.

## Approach

**Decision (John, 2026-08-07): admin always wins.** An override is never dropped,
demoted or auto-corrected. `default_hash` is recorded so drift is *detectable*, and
detection is moved out of the request path into two places a human will actually
meet it.

The trade this accepts, stated plainly: **a claim fixed in code will not reach
`/af` until a human reconciles it in admin.** That is exactly what let "werk aflyn"
sit live for three weeks. The mitigation is that the drift is now noisy rather than
silent — the guard is the check, not the resolver.

1. **Migration** — add `default_hash text` to `ui_translations`. Existing rows stay
   **NULL**, and **NULL is treated as stale** (we genuinely do not know what default
   they were written against). Predicates must handle NULL explicitly — `stored <>
   current` does not match NULL.
2. **Record on save** — `saveTranslation` already computes `defaultHash(namespace,
   key)`; persist it alongside `value`. Always the *server's* hash, never the
   client's `defaultSeen`. Reset/delete needs no change.
3. **Leave the read path alone** — `getOverrides` does **not** select the hash and
   `mergeOverrides` does **not** filter on it. The override wins. This is also why
   `ui_translations_public` is left as narrow as it was: the request-time merge has
   no use for the column.
4. **Surface it in admin** — a **Stale (n)** filter in
   `src/components/admin/translation-manager.tsx` beside `Overridden (n)`. On a
   stale row, show the shipped default next to the orphaned override with a
   one-click *"Use the shipped default"* (which is the existing `resetTranslation`).
5. **`npm run i18n:check`** — the replacement for auto-drop. Lists every override
   whose default has drifted; **exit 1** when a stale row is in a claims-bearing
   namespace, **exit 0 with a warning** otherwise. A wording drift must not block a
   deploy, or the check gets bypassed and then it checks nothing.

**Claims-bearing namespaces** (`CLAIM_NAMESPACES` in `src/lib/translation-hash.ts`):
`landing`, `readiness`, `result`, `paywall`, `legal`, `auth`. Derived from what
actually went wrong, not from taste — every false string AP-01 deleted sat in one of
these. A price, a duration, a capability or a legal promise blocks; wording warns.

**Hash contract — decided, joint EN+AF.** `hashSeed` seeds on both locales, so an
English-only copy edit marks the Afrikaans override stale too. That is the *point*:
when the English claim changes, the Afrikaans translation of the old claim is
precisely the row to flag. Cost: an English typo fix flags its Afrikaans sibling.
Over-reporting is the safe direction here. Recorded in the function's doc comment.

⚠ **The two defaults are joined with a NUL, not a space** — carried over verbatim
from the original `defaultHash` and not cosmetic. A space is legal inside a UI
string, so `"a b" + "c"` and `"a" + "b c"` would seed identically. Changing the
separator silently invalidates every stored hash, i.e. marks the whole table stale.

## Files

- `supabase/migrations/20260807090000_ui_translations_default_hash.sql` (new:
  column only, no view change)
- `src/lib/translation-hash.ts` (new) — `hashSeed`, `isOverrideStale`,
  `isClaimNamespace`, `CLAIM_NAMESPACES`. **Import-free on purpose**: the algorithm
  must not diverge between the admin UI and the drift check, and `translations.ts`
  cannot be loaded by plain node (it reaches `next/headers` via
  `@/lib/supabase/server`). A second copy that hashes differently reports every row
  as stale.
- `src/lib/translations.ts` — `defaultHash` delegates to `hashSeed`; `buildCatalog`
  selects `default_hash` and computes `enStale`/`afStale`; `CatalogRow` gains both
- `src/lib/translation-actions.ts` — persist `default_hash` on save
- `src/components/admin/translation-manager.tsx` — Stale filter + default preview
- `scripts/i18n/check-overrides.ts` + `npm run i18n:check`
- `src/lib/translation-hash.test.ts` (new, 9 tests)
- `src/lib/database.types.ts` — regenerate after the migration

## Risks

- **Nothing forces reconciliation.** By design. If a stale claims-namespace
  override is ever left in place, `i18n:check` fails every run until someone acts —
  which is annoying by intent, and is the only pressure in the system.
- **`i18n:check` needs the service-role key**, so it is a pre-deploy command, not a
  pull-request gate — `default_hash` is deliberately absent from the public view, so
  there is no anon-readable path to the answer. It skips cleanly (exit 0, one line)
  when `.env.local` is absent rather than failing a keyless environment.
- **Stale is server-computed**, so the admin row corrects it locally after a save
  (which stamps the current hash) or a reset (which removes the row).
- Regenerating `database.types.ts` touches a widely-imported file; run
  `npm run typecheck`.

## Verification

- `src/lib/translation-hash.test.ts` — 9 tests: joint-seed behaviour on an
  EN-only and an AF-only edit, the NUL separator (`"a b"|"c"` ≠ `"a"|"b c"`),
  NULL/mismatch/match staleness, and the claims-namespace split.
- Manual: edit a string in admin → renders on the page. Change that key's default in
  `messages/<locale>.json`, reload admin → the row appears under **Stale** *and* the
  page **still shows the override** (that is the contract, not a bug). Reset from
  admin → the shipped default renders and the row leaves the Stale list.
- `npm run i18n:check` against a stale `landing` row → exit 1; against a stale
  `module` row → exit 0 with a warning.
- Then `npm test`, `npm run lint`, `npm run typecheck`.

## Done when

- [ ] `default_hash` exists and is written on every save
- [ ] The override still renders when stale — proven by the manual check
- [ ] Admin shows **Stale (n)** with the shipped default beside the orphan
- [ ] `npm run i18n:check` exits 1 on claims-namespace drift, 0 on wording drift
- [ ] Hash-scope decision (joint EN+AF) recorded in `translation-hash.ts` ✅

## Rejected — auto-drop (2026-08-05 → reversed 2026-08-07)

The original plan had `mergeOverrides` skip any override whose stored hash ≠ current,
so a JSON commit always won and stale admin edits silently reverted. It was rejected
because an admin edit — including a reviewed AI draft — represents a human decision
about language we cannot make ourselves, and silently reverting it makes the
translation manager untrustworthy: an admin would have no way to know their work had
been undone by an unrelated English typo fix. The claims risk it was solving is
handled by `i18n:check` instead. **Do not re-propose it.**
