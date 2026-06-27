-- DB1: road signs library — assets + provenance + bilingual learner content
-- + the two review gates (asset licence/verification, content accuracy).
-- Public-read (signs are Public-Domain content); writes are admin-only.

create table public.road_signs (
  code text primary key,
  name text not null,
  category text not null
    check (category in ('regulatory', 'warning', 'guidance', 'marking')),
  subcategory text,
  temporary boolean not null default false,
  in_official_chart boolean not null default false,

  -- asset / provenance (seeded from the Wikipedia + DoT-chart ingest)
  svg_file text,
  source text,
  source_url text,
  licence text,
  attribution_required boolean not null default false,
  asset_status text not null default 'needs_review'
    check (asset_status in ('needs_review', 'audited', 'approved')),

  -- learner content, bilingual per field: {"plainEnglish": {"en": "...", "af": "..."}, ...}
  -- Keys: plainEnglish, formalMeaning, behaviour, commonMistake, testHint.
  content jsonb not null default '{}'::jsonb,
  review_status text not null default 'draft'
    check (review_status in ('draft', 'reviewed', 'approved')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.road_signs is
  'DB1 sign library. Ships only when asset_status=approved AND review_status=approved.';

create index road_signs_category_idx on public.road_signs (category);

-- Admin check (reused by write policies). SECURITY DEFINER to read profiles
-- without exposing it through RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.road_signs enable row level security;

-- Public read: signs are Public-Domain reference content. The app still filters
-- by status; admins see everything for review.
create policy "road_signs_select_all" on public.road_signs
  for select using (true);

-- Only admins may create/edit/delete signs.
create policy "road_signs_admin_insert" on public.road_signs
  for insert with check (public.is_admin());
create policy "road_signs_admin_update" on public.road_signs
  for update using (public.is_admin()) with check (public.is_admin());
create policy "road_signs_admin_delete" on public.road_signs
  for delete using (public.is_admin());

create trigger road_signs_touch_updated_at
  before update on public.road_signs
  for each row execute function public.touch_updated_at();
