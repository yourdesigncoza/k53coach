-- Name the machine sweep as what it is.
--
-- Background: 20260724090000 deliberately left `approved_by` / `verified_at` null
-- on the bulk-approved bank, on the grounds that stamping them would fabricate
-- provenance. That was right about `verified_at` and wrong about `approved_by`.
-- Null reads as "we don't know who approved this", when in fact we do know
-- exactly: no person did — an AI sweep set the flag. Recording that is not
-- fabrication, it is the honest answer, and it distinguishes a swept row from a
-- row nobody has looked at at all.
--
-- The 2026-08-03 approvals by Louwrens (46 rows) are the first genuine human
-- sign-offs in this table. They must stay separable from the sweep, so:
--
--     verified_at is not null   ->  a person read it against its citation
--     approved_by = 'system'    ->  AI-swept, approved, NOT human-verified
--
-- `verified_at` is therefore NOT backfilled here. It remains the worklist for the
-- outstanding human pass (docs/verification-worklist.md), exactly as the earlier
-- migration intended. Do not backfill it.

-- 1. approved_by becomes text -----------------------------------------------------
-- A uuid column can only name an auth user, and 'system' is not one. `road_signs`
-- already solved this the same way (`approved_by text`, holding 'ai:claude-code'),
-- so this brings the two provenance shapes into line. Existing uuids survive as
-- their text form; the app already types this field as `string | null`.
alter table public.questions
  drop constraint if exists questions_approved_by_fkey;

alter table public.questions
  alter column approved_by type text using approved_by::text;

comment on column public.questions.approved_by is
  'Who approved this: a user id (human sign-off, paired with verified_at) or ''system'' for the bulk AI sweep. ''system'' is NOT a human verification — see verified_at.';

-- 2. Name the sweep ---------------------------------------------------------------
update public.questions
   set approved_by = 'system'
 where review_status = 'approved'
   and approved_by is null;
