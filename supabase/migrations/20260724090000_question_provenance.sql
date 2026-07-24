-- Question provenance + payment idempotency. Prerequisite for scaling the DB4
-- question bank from 125 to ~800 (docs/build-plan-2026-07.md, W1 task #1) and for
-- wiring the PayFast/Yoco webhook (W2, K53-5).
--
-- Why this must land BEFORE any bulk import: `questions.review_status` is today a
-- bare boolean that a seed migration set. There is no record of who verified an
-- item or against what. Import 700 generated rows without these columns and the
-- evidence can never be backfilled — it was never captured. `road_signs` already
-- carries this shape (approved_by / verified_at / verification / svg_hash); the
-- question bank is the gap.

-- 1. Provenance on the DB4 question bank ----------------------------------------
-- Nullable by design: a draft is written before it is verified, so these fill in
-- at approval time rather than at insert.
alter table public.questions
  add column if not exists approved_by      uuid references auth.users on delete set null,
  add column if not exists verified_at      timestamptz,                                 -- when a human confirmed it against the citation
  add column if not exists generated_by     text,                                        -- 'human' | model id that drafted it
  add column if not exists source_citation  text,                                        -- the specific reg / Act section / chart entry
  add column if not exists objective_code   text;                                        -- learning objective: R1 / RR7 / VC3

-- Learning-objective lookup: "which questions teach this rule/sign/control?" —
-- drives the weak-area → next-lesson link and the per-objective coverage report.
create index if not exists questions_objective_idx
  on public.questions (objective_code) where objective_code is not null;

-- Seed the objective code from the sign pointer we already have. Rules and
-- controls are backfilled by content work (RR# exists; VC# still to be defined),
-- not here.
update public.questions
   set objective_code = sign_code
 where sign_code is not null
   and objective_code is null;

-- Deliberately NOT backfilled: approved_by / verified_at on the existing 125 rows.
-- Those were auto-approved in bulk by 20260705120500 — nobody checked them
-- individually. Stamping them with today's date would fabricate provenance that
-- does not exist. Leaving them null is honest AND useful: `verified_at is null`
-- is exactly the worklist for the verification pass the existing bank still needs.
-- Do not "tidy" this in a later migration.

-- 2. Payment idempotency ---------------------------------------------------------
-- The PayFast ITN webhook must be safe against replayed AND concurrent deliveries.
-- Application-level "check then insert" loses that race; only a unique constraint
-- closes it, so the webhook inserts with on-conflict-do-nothing.
--
-- Partial + scoped to payment sources on purpose: `reference` on admin grants is a
-- free-text note, not a payment id, and today five of six admin rows share the
-- same note — a plain unique (source, reference) would fail to create and would be
-- wrong in principle.
create unique index if not exists entitlements_payment_reference_uniq
  on public.entitlements (source, reference)
  where source in ('payfast', 'yoco') and reference is not null;

comment on index public.entitlements_payment_reference_uniq is
  'Idempotency guard: one entitlement per payment id. Webhooks insert with on conflict do nothing.';

comment on column public.questions.source_citation is
  'The specific regulation, Act section or chart entry this question rests on. Required before review_status can be set to approved — AI drafts, it never self-certifies.';
