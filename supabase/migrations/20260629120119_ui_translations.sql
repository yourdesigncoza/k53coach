-- UI translation overrides for the i18n chrome strings.
--
-- The JSON in messages/{en,af}.json stays the key catalog + shipped defaults; a
-- row here exists ONLY when an admin has edited a string away from its default
-- ("Reset" deletes the row). The app deep-merges these over the JSON at request
-- time, so edits go live without a redeploy.

create table public.ui_translations (
  locale     text not null,
  namespace  text not null,
  key        text not null,
  value      text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null,
  primary key (locale, namespace, key)
);

alter table public.ui_translations enable row level security;

-- Base table is admin-only for EVERY operation, so updated_by / updated_at /
-- draft copy are never anon-queryable. Reuses public.is_admin() (defined with
-- the road_signs migration). Public reads go through the view below.
create policy "ui_translations_admin_select" on public.ui_translations
  for select using (public.is_admin());
create policy "ui_translations_admin_insert" on public.ui_translations
  for insert with check (public.is_admin());
create policy "ui_translations_admin_update" on public.ui_translations
  for update using (public.is_admin()) with check (public.is_admin());
create policy "ui_translations_admin_delete" on public.ui_translations
  for delete using (public.is_admin());

-- Public read view: exposes ONLY the columns the request-time merge needs.
-- security_invoker = off → runs as the (owner) definer, bypassing the base
-- table's admin-only RLS, so the anon request-time fetch can read the strings
-- (which are public UI chrome) without seeing the audit columns.
create view public.ui_translations_public
  with (security_invoker = off) as
  select locale, namespace, key, value
  from public.ui_translations;

grant select on public.ui_translations_public to anon, authenticated;
