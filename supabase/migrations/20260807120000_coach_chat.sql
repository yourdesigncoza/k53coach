-- Ask Coach — the scoped, grounded chat tutor (docs/product/PRD-ask-coach.md).
--
-- Three tables and three functions. The shape is driven by two findings from the
-- adversarial review of the design (PRD §13), both of which the obvious schema
-- gets wrong:
--
--   1. A LEARNER MAY NOT AUTHOR AN `assistant` ROW. The obvious "insert your own
--      rows" policy lets a learner write the coach's side of their own
--      conversation — which is then fed back as context on the next turn. That is
--      prompt injection with a persistence layer, sitting in a table we would
--      otherwise trust. Learner inserts are constrained to role='user' in their
--      own conversation; assistant rows arrive only through coach_append_assistant().
--
--   2. A QUOTA THAT IS COUNTED IS NOT ENFORCED. Read-the-count-then-call lets
--      several tabs each read 24 and each proceed. coach_claim() takes a
--      per-user advisory lock for the transaction, so the check and the spend are
--      one atomic step. Same reasoning as readiness_assessment_grants, one step
--      further: that table could make the primary key do the work because a token
--      buys exactly one call; here the limit is a count, so it needs the lock.
--
-- The whole chat path therefore runs under the learner's own session. No
-- service-role key is involved anywhere in it, which is what keeps RLS as the
-- real boundary rather than something application code re-implements.

-- ── conversations ────────────────────────────────────────────────────────────

create table if not exists public.coach_conversations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text,                                  -- first question, clamped; null until the first turn lands
  locale       text not null default 'en',
  message_count   integer not null default 0,
  last_message_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists coach_conversations_user_idx
  on public.coach_conversations (user_id, last_message_at desc nulls last);

create trigger coach_conversations_touch_updated_at
  before update on public.coach_conversations
  for each row execute function public.touch_updated_at();

-- ── messages ─────────────────────────────────────────────────────────────────

create table if not exists public.coach_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.coach_conversations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            text not null check (role in ('user','assistant')),
  body            text not null,

  -- One state machine, assigned by the route. The model itself may only emit
  -- 'answered' or 'not_covered'; everything else is our verdict on it, and
  -- conflating the two is how the first design ended up contradicting itself.
  --   refused     — the retrieval floor stopped it. No model call was made.
  --   answered    — generated and passed every validator check.
  --   not_covered — the model had passages and none supported an answer.
  --   invalid     — the model answered and the validator rejected it.
  --   error       — the provider failed.
  status          text check (status in ('refused','answered','not_covered','invalid','error')),

  -- What the answer actually rested on: passage id, sha256 of the body AS USED,
  -- and the excerpt. Snapshotted rather than looked up later, for the same reason
  -- feedback_reports snapshots keyed_index — if a lesson is corrected next week,
  -- a stored bare code no longer shows what the coach was reading, and the
  -- evidence dissolves the moment somebody acts on it.
  evidence        jsonb not null default '{}',
  corpus_revision text,

  model           text,
  prompt_version  integer,
  tokens_in       integer,
  tokens_out      integer,
  created_at      timestamptz not null default now()
);

create index if not exists coach_messages_conversation_idx
  on public.coach_messages (conversation_id, created_at);

-- The review queue: every question the corpus could not answer, which is half of
-- why this feature is worth building (PRD §8).
create index if not exists coach_messages_unanswered_idx
  on public.coach_messages (created_at desc)
  where status in ('not_covered','refused');

comment on column public.coach_messages.evidence is
  'Passages the answer rested on: {passages:[{id,code,hash,excerpt,href}]}. Snapshotted at answer time — see PRD-ask-coach.md §5.';
comment on column public.coach_messages.status is
  'Route-assigned. The model emits only answered|not_covered; refused|invalid|error are our verdicts. See the state machine above.';

-- ── usage / spend reservations ───────────────────────────────────────────────

create table if not exists public.coach_usage (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  entitlement_id uuid not null,        -- so a renewal does not inherit the previous period's usage
  day            date not null,        -- SAST, computed by coach_claim
  created_at     timestamptz not null default now()
);

create index if not exists coach_usage_user_day_idx
  on public.coach_usage (user_id, day);
create index if not exists coach_usage_period_idx
  on public.coach_usage (user_id, entitlement_id);
create index if not exists coach_usage_day_idx
  on public.coach_usage (day);

comment on table public.coach_usage is
  'One row per reserved model call. Written only by coach_claim(), removed by coach_release() when the call it paid for never happened — otherwise a provider timeout silently burns a learner allowance.';

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.coach_conversations enable row level security;
alter table public.coach_messages enable row level security;
alter table public.coach_usage enable row level security;

create policy "coach_conversations_insert_own" on public.coach_conversations
  for insert with check (auth.uid() = user_id);
create policy "coach_conversations_select_own_or_admin" on public.coach_conversations
  for select using (auth.uid() = user_id or public.is_admin());
create policy "coach_conversations_delete_own" on public.coach_conversations
  for delete using (auth.uid() = user_id);

-- Deliberately NO learner update policy. Conversation metadata (message_count,
-- last_message_at) is maintained inside coach_append_assistant(), where it is
-- consistent with the row that caused it.

-- role='user' ONLY, and only into a conversation the caller owns. Finding 1 above.
create policy "coach_messages_insert_own_user_role" on public.coach_messages
  for insert with check (
    auth.uid() = user_id
    and role = 'user'
    and exists (
      select 1 from public.coach_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
create policy "coach_messages_select_own_or_admin" on public.coach_messages
  for select using (auth.uid() = user_id or public.is_admin());

-- coach_usage gets no policies at all: only the security-definer functions below
-- touch it, so a learner can neither read their own meter nor mint themselves
-- headroom. Same idiom as readiness_assessment_grants.

-- ── functions ────────────────────────────────────────────────────────────────

-- Reserve one model call, atomically.
--
-- Returns one row: outcome is 'granted' | 'capped_day' | 'capped_period' |
-- 'capped_global', plus the counts so the caller can tell the learner where they
-- stand without a second round trip.
--
-- pg_advisory_xact_lock serialises only THIS user's concurrent requests and is
-- released with the transaction. The global count is read under no lock: it is a
-- rand ceiling on a per-call cost measured in cents, so a burst may overshoot by
-- roughly the number of in-flight requests. Serialising every learner in the
-- product behind one lock to prevent that would be a worse trade — the same call
-- readiness-grants.ts already documents.
create or replace function public.coach_claim(
  p_entitlement_id uuid,
  p_daily_cap      integer,
  p_period_cap     integer,
  p_global_cap     integer
)
returns table (outcome text, reservation_id uuid, used_today integer, used_period integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user   uuid := auth.uid();
  v_day    date;
  v_today  integer;
  v_period integer;
  v_global integer;
  v_id     uuid;
begin
  if v_user is null then
    return query select 'unauthenticated'::text, null::uuid, 0, 0;
    return;
  end if;

  -- SAST. The learner's day, not UTC's — a cap that rolls over at 02:00 local
  -- would be a bug report nobody could reproduce.
  v_day := (now() at time zone 'Africa/Johannesburg')::date;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  select count(*) into v_today
    from public.coach_usage
   where user_id = v_user and day = v_day;

  select count(*) into v_period
    from public.coach_usage
   where user_id = v_user and entitlement_id = p_entitlement_id;

  if v_today >= p_daily_cap then
    return query select 'capped_day'::text, null::uuid, v_today, v_period;
    return;
  end if;

  if v_period >= p_period_cap then
    return query select 'capped_period'::text, null::uuid, v_today, v_period;
    return;
  end if;

  select count(*) into v_global from public.coach_usage where day = v_day;
  if v_global >= p_global_cap then
    return query select 'capped_global'::text, null::uuid, v_today, v_period;
    return;
  end if;

  insert into public.coach_usage (user_id, entitlement_id, day)
  values (v_user, p_entitlement_id, v_day)
  returning id into v_id;

  return query select 'granted'::text, v_id, v_today + 1, v_period + 1;
end;
$$;

-- Hand a reservation back when the call it paid for never happened. Without this
-- a provider timeout costs the learner an allowance they never spent — the same
-- defect readiness-grants.ts fixed with releaseAssessment().
create or replace function public.coach_release(p_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.coach_usage
   where id = p_reservation_id and user_id = auth.uid();
end;
$$;

-- Append the coach's turn and move the conversation forward, in one statement
-- pair the learner cannot reach directly.
--
-- Ownership is checked against auth.uid() inside the function rather than trusted
-- from the caller, so this is safe to expose to an authenticated role: the worst
-- a learner can do with it is write an assistant row into their own conversation,
-- which is exactly what the route does on their behalf anyway.
create or replace function public.coach_append_assistant(
  p_conversation_id uuid,
  p_body            text,
  p_status          text,
  p_evidence        jsonb,
  p_corpus_revision text,
  p_model           text,
  p_prompt_version  integer,
  p_tokens_in       integer,
  p_tokens_out      integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id   uuid;
begin
  if v_user is null then
    raise exception 'unauthenticated';
  end if;

  if not exists (
    select 1 from public.coach_conversations
     where id = p_conversation_id and user_id = v_user
  ) then
    raise exception 'conversation not found';
  end if;

  insert into public.coach_messages (
    conversation_id, user_id, role, body, status, evidence,
    corpus_revision, model, prompt_version, tokens_in, tokens_out
  ) values (
    p_conversation_id, v_user, 'assistant', p_body, p_status,
    coalesce(p_evidence, '{}'::jsonb),
    p_corpus_revision, p_model, p_prompt_version, p_tokens_in, p_tokens_out
  )
  returning id into v_id;

  update public.coach_conversations
     set message_count   = message_count + 2,   -- the learner's turn and this one
         last_message_at = now()
   where id = p_conversation_id;

  return v_id;
end;
$$;

revoke all on function public.coach_claim(uuid, integer, integer, integer) from public;
revoke all on function public.coach_release(uuid) from public;
revoke all on function public.coach_append_assistant(uuid, text, text, jsonb, text, text, integer, integer, integer) from public;
grant execute on function public.coach_claim(uuid, integer, integer, integer) to authenticated;
grant execute on function public.coach_release(uuid) to authenticated;
grant execute on function public.coach_append_assistant(uuid, text, text, jsonb, text, text, integer, integer, integer) to authenticated;
