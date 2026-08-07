-- Record which shipped default each override was written against.
--
-- Without this there is no way to answer "has messages/<locale>.json changed
-- since an admin edited this string?" — which is how commit e05dd48 edited the
-- Afrikaans default and reached nobody, and how a claims-audit fix could sit
-- behind a July override for three weeks.
--
-- ⚠ The override still WINS at request time. An admin edit (including an
-- AI-drafted one saved through the translation manager) outranks the code,
-- deliberately — John, 2026-08-07, reversing the 2026-08-05 auto-drop decision.
-- This column exists so drift is *detectable*, not so it is silently corrected:
-- the admin "Stale" filter and `npm run i18n:check` read it, `getOverrides` does
-- not. That is why `ui_translations_public` is left alone — the request-time
-- merge has no use for it, and the view stays as narrow as it was.
--
-- NULL means "written before this column existed, default unknown". Every
-- consumer treats NULL as stale: the rows we already know drifted are exactly
-- the ones with no hash, so treating them as fresh would re-hide the problem.
-- Callers must test NULL explicitly — `stored <> current` does not match NULL.

alter table public.ui_translations
  add column default_hash text;

comment on column public.ui_translations.default_hash is
  'hashSeed(en_default, af_default) at the moment this override was saved. NULL = unknown, treated as stale. Advisory only — the override still applies.';
