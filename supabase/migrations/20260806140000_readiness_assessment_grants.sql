-- Spend control for the free readiness AI assessment (AP-09).
--
-- This is the only LLM call in the app behind an unauthenticated endpoint: the
-- free readiness test is anonymous and device-local by design (constraint 3,
-- under-18 learners), so there is no signed-in user to rate-limit and no attempt
-- row to key against. The route rests on this table for two things:
--
--   1. SINGLE USE — a signed paper token buys exactly one assessment. Insert is
--      the claim; a replay hits the primary key and is refused. The check and the
--      spend are one statement, so two concurrent replays cannot both win.
--   2. A DAILY CAP — counting today's rows is the ceiling on model spend
--      (R20/day, John 2026-08-06). Over the cap the route serves the
--      deterministic template at HTTP 200 rather than failing: a visitor who
--      arrives after the cap gets something honest, not an error.
--
-- WHAT IS NOT HERE, DELIBERATELY: no IP, no user agent, no user id, no answers,
-- no score. An IP is personal information, and the whole point of the free test
-- is that nothing about a minor reaches a server. The row is a SHA-256 of a token
-- that itself contains only question ids and a timestamp — it can answer "have I
-- already paid for this one" and nothing else about anybody.

create table if not exists public.readiness_assessment_grants (
  token_hash text primary key,
  created_at timestamptz not null default now()
);

comment on table public.readiness_assessment_grants is
  'One row per free readiness assessment generated. Makes a paper token single-use and bounds daily model spend. Contains no personal data by design — see AP-09.';
comment on column public.readiness_assessment_grants.token_hash is
  'SHA-256 of the signed paper token (question ids + issued-at). Never the token itself.';

-- The two queries this table exists to serve: "today's count" and the expiry
-- sweep. Both are ranges over created_at.
create index if not exists readiness_assessment_grants_created_at_idx
  on public.readiness_assessment_grants (created_at);

-- Rows outlive their usefulness the moment the token expires (30 minutes), but
-- the daily count needs today. Anything older than a couple of days is dead
-- weight; the route sweeps opportunistically.
alter table public.readiness_assessment_grants enable row level security;

-- No policies, on purpose. Only the service-role client touches this table, and
-- service-role bypasses RLS. With RLS on and no policy, every learner-context
-- client — anon included — can neither read the table nor mint itself a grant.
