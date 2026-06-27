-- K53 AI Coach — initial schema.
-- POPIA-conscious: minimal PII, Row Level Security on every table, and NO
-- biometric data ever (anti-sharing is device passkeys, handled client-side).
-- Prototype project — dummy/anonymised data only until a POPIA review.

-- ----------------------------------------------------------------------------
-- profiles: one row per auth user, created automatically on signup.
-- ----------------------------------------------------------------------------
create type public.user_role as enum ('learner', 'parent', 'school', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'learner',
  display_name text,
  locale text not null default 'en' check (locale in ('en', 'af')),
  is_minor boolean not null default false,
  parent_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is
  'One row per auth user. Minimal PII (POPIA). No biometric data.';

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- attempts: individual question attempts (DB7 analytics input).
-- ----------------------------------------------------------------------------
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  topic text not null check (topic in ('signs', 'rules', 'controls')),
  chosen_index smallint not null,
  correct boolean not null,
  created_at timestamptz not null default now()
);
create index attempts_user_idx on public.attempts (user_id, created_at desc);

alter table public.attempts enable row level security;

create policy "attempts_select_own" on public.attempts
  for select using (auth.uid() = user_id);
create policy "attempts_insert_own" on public.attempts
  for insert with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- readiness_results: readiness snapshots (DB9 scoring output).
-- ----------------------------------------------------------------------------
create table public.readiness_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  overall smallint not null check (overall between 0 and 100),
  band text not null check (band in ('not-ready', 'almost-ready', 'test-ready')),
  by_topic jsonb not null default '[]'::jsonb,
  taken_at timestamptz not null default now()
);
create index readiness_user_idx
  on public.readiness_results (user_id, taken_at desc);

alter table public.readiness_results enable row level security;

create policy "readiness_select_own" on public.readiness_results
  for select using (auth.uid() = user_id);
create policy "readiness_insert_own" on public.readiness_results
  for insert with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Triggers: auto-create a profile on signup, and keep updated_at fresh.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
