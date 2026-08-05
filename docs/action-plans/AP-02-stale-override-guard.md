# AP-02 — Make stale overrides non-effective, not just visible

**Priority P0.** Pairs with [AP-01](AP-01-live-af-claim-repair.md). AP-01 cleans up
today's damage; **this is the one that stops it happening again.**

## Problem

There is no mechanism anywhere that notices a `ui_translations` override has been
left behind by a change to the shipped JSON default. Concretely: commit `e05dd48`
*"fix(i18n): use one Afrikaans word for the mock exam"* edited `messages/af.json`
and **had no effect on what users see**, because a July override still wins. Nobody
would know without diffing the database against the file by hand.

Ground truth, checked 2026-08-05:

- **`ui_translations` has no `default_hash` column.** Schema is
  `(locale, namespace, key, value, updated_at, updated_by)` —
  `supabase/migrations/20260629120119_ui_translations.sql`.
- **`defaultHash()` in `src/lib/translations.ts` is only an in-session concurrency
  guard.** It is passed as `defaultSeen` to `saveTranslation` in
  `src/lib/translation-actions.ts`, which rejects the save if the default drifted
  *while the editor was open*. It is never persisted, so it cannot answer "has the
  default changed since this override was written?".
- **The read path cannot see a hash even if we stored one.** `getOverrides` selects
  `namespace,key,value` from the `ui_translations_public` view, and that view
  exposes only `locale, namespace, key, value`.

So an admin-only "Stale" indicator would be **advisory** — stale rows would keep
overriding JSON exactly as they do now, and a false claim could sit live until
someone happened to look. That is the gap this plan closes.

## Approach

**Decision taken (John, 2026-08-05): auto-drop.** A stale override stops applying,
so a JSON commit always wins. Trade-off accepted: an admin's edit silently reverts
once a developer changes that string's shipped default, and the admin re-applies it
from the Stale list. The alternative (advisory only) keeps admin edits sticky but
lets a false claim persist — unacceptable given AP-01.

1. **Migration** — add `default_hash text` to `ui_translations`. Existing rows stay
   **NULL**, and **NULL is treated as stale** (we genuinely do not know what default
   they were written against; treating them as fresh would re-hide exactly the 49
   rows AP-01 is repairing). Predicates must handle NULL explicitly — `stored <>
   current` does not match NULL.
2. **Record on save** — `saveTranslation` already computes `defaultHash(namespace,
   key)`; persist it alongside `value`. Reset/delete needs no change.
3. **Expose it to the read path** — extend `ui_translations_public` to include
   `default_hash`. It is not an audit column (no actor, no timestamp), so this does
   not weaken the reason the view exists.
4. **Drop stale rows at merge time** — `getOverrides` selects `default_hash` too,
   and `mergeOverrides` (or a filter before it) skips any override whose stored hash
   ≠ `defaultHash(ns, key)` for that locale. The JSON default then renders. Keep the
   existing fail-open behaviour: a Supabase problem still falls back to pure JSON.
5. **Surface it in admin** — a **Stale (n)** filter in
   `src/components/admin/translation-manager.tsx` beside the existing
   `Overridden (n)`. `buildCatalog` already returns `defaultHash` per row, so it
   needs the stored hash added to `CatalogRow` and a `stale` boolean. Show the
   shipped default next to the orphaned override so re-applying is one click.

**Hash contract.** `defaultHash` currently seeds on **both** locales' defaults
(`${en} ${af}`), so an EN-only copy edit marks the AF override stale too. That is
arguably right (the string changed meaning) but it must be a deliberate choice —
decide and document, and if per-locale is wanted, seed on the single locale's
default instead and note the behaviour change.

## Files

- `supabase/migrations/<ts>_ui_translations_default_hash.sql` (new: column + view
  replacement)
- `src/lib/translations.ts` — `getOverrides` select + stale filter; `CatalogRow`
  gains `stale`; `buildCatalog` compares stored vs current
- `src/lib/translation-actions.ts` — persist `default_hash` on save
- `src/components/admin/translation-manager.tsx` — Stale filter + default preview
- `src/lib/database.types.ts` — regenerate after the migration
- New `src/lib/translations.test.ts` — resolver tests (see below)

## Risks

- **Silent reversion surprises an admin.** Mitigated by the Stale list showing
  exactly what was dropped and what replaced it. Worth telling Louwrens once.
- **`defaultHash` seeds on EN+AF jointly**, so unrelated EN edits invalidate AF
  overrides. Decide deliberately; don't discover it in production.
- **NULL-as-stale drops all 49 rows the moment this ships.** That is intended and is
  the same outcome AP-01 produces deliberately — but it means **AP-01's class (c)
  promotions must be committed to `messages/af.json` before or with this**, or good
  wording disappears. Sequence matters: AP-01 (c) → AP-02.
- Regenerating `database.types.ts` touches a widely-imported file; run
  `npm run typecheck`.

## Verification

Resolver tests, not just a UI check — the whole failure mode was that the read path
ignored staleness:

- override with matching hash → override renders
- override with mismatched hash → **JSON default renders**
- override with NULL hash → **JSON default renders**
- Supabase unreachable → JSON defaults, no throw (existing fail-open)

Manual: edit a string in admin → renders. Change that key's default in
`messages/<locale>.json`, restart → the row appears under **Stale** *and* the new
JSON default is what the page shows. Re-apply from admin → renders again, and the
row leaves the Stale list.

Then `npm test`, `npm run lint`, `npm run typecheck`.

## Done when

- [ ] `default_hash` exists, is written on save, and is exposed on the public view
- [ ] Stale overrides no longer apply — proven by resolver tests
- [ ] Admin shows **Stale (n)** with the shipped default beside the orphan
- [ ] Hash-scope decision (joint EN+AF vs per-locale) recorded in `translations.ts`
- [ ] A repeat of `e05dd48` demonstrably reaches `/af` with no manual DB step
