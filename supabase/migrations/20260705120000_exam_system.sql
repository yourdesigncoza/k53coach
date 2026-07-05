-- Mock exam system: exam metadata on the question bank, paid-access entitlements,
-- and exam-attempt storage. See docs/ (plan) — the mock exam builds its papers
-- exclusively from the curated `questions` pool (review_status='approved' AND in_exam).

-- 1. Exam metadata on the DB4 question bank -------------------------------------
-- Extends the existing `questions` table (20260629150621) so admin curation drives
-- which questions the exam samples, weighted by likelihood and filtered by code.
alter table public.questions
  add column if not exists topic_tag       text,                                        -- wiki sub-topic, e.g. "Right of Way"
  add column if not exists exam_likelihood  text not null default 'medium'
    check (exam_likelihood in ('high','medium','low')),
  add column if not exists vehicle_codes    text[] not null default '{A,B,C,EB}',       -- codes this question applies to
  add column if not exists in_exam          boolean not null default false,             -- part of the mock-exam pool
  add column if not exists source_basis     text;                                       -- provenance note (official_manual / legislation / …)

-- Fast pool lookup: approved + in_exam questions per topic.
create index if not exists questions_exam_pool_idx
  on public.questions (topic) where in_exam;

-- The curated readiness set is also solid exam material — enrol it in the pool.
update public.questions set in_exam = true where in_readiness = true;

-- 2. Entitlements: who has paid access ------------------------------------------
-- One row per grant; the most recent unexpired row is the active entitlement.
-- Admin grants now (source='admin'); PayFast/Yoco webhooks insert the same shape
-- via the service role later (see src/app/api/pay/payfast/route.ts TODO).
create table if not exists public.entitlements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product     text not null default 'full_access' check (product in ('full_access')),
  source      text not null check (source in ('admin','payfast','yoco')),
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  granted_by  uuid references auth.users (id) on delete set null,
  reference   text                                            -- payment ref / admin note
);
create index if not exists entitlements_user_idx
  on public.entitlements (user_id, expires_at desc);

alter table public.entitlements enable row level security;

-- Owner reads own grants; admins read all. Only admins write (grant/revoke).
create policy "entitlements_select_own_or_admin" on public.entitlements
  for select using (auth.uid() = user_id or public.is_admin());
create policy "entitlements_admin_insert" on public.entitlements
  for insert with check (public.is_admin());
create policy "entitlements_admin_delete" on public.entitlements
  for delete using (public.is_admin());

-- 3. Exam attempts: one summary row per completed sitting -----------------------
-- Written once at submit time; in-progress state lives in the browser (localStorage
-- draft). Per-question rows are ALSO dual-written into `attempts` on submit so the
-- existing topic-accuracy analytics (getTopicAccuracy) keep working unchanged.
create table if not exists public.exam_attempts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  vehicle_code     text not null default 'B',
  format           jsonb not null,                    -- EXAM_FORMAT snapshot for this sitting
  timer_enabled    boolean not null default true,
  auto_submitted   boolean not null default false,    -- true when the timer forced submit
  answers          jsonb not null default '[]',       -- [{id, topic, chosen, answer, correct}] in paper order
  sections         jsonb not null default '{}',       -- {rules:{correct,total,passRequired,passed}, …}
  overall          smallint check (overall between 0 and 100),
  passed           boolean,
  started_at       timestamptz not null,
  finished_at      timestamptz,
  duration_seconds integer,
  assessment       jsonb,                             -- cached AI coaching result (regenerable)
  created_at       timestamptz not null default now()
);
create index if not exists exam_attempts_user_idx
  on public.exam_attempts (user_id, started_at desc);

alter table public.exam_attempts enable row level security;

-- Own-row only. Update is allowed so the assess route (running as the user) can
-- cache the generated AI assessment back onto the row.
create policy "exam_attempts_select_own" on public.exam_attempts
  for select using (auth.uid() = user_id);
create policy "exam_attempts_insert_own" on public.exam_attempts
  for insert with check (auth.uid() = user_id);
create policy "exam_attempts_update_own" on public.exam_attempts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
