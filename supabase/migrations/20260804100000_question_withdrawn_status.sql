-- A third question state: 'withdrawn'.
--
-- Why: with only 'draft' and 'approved', a question we deliberately pulled looks
-- identical in the admin list to one nobody has finished writing. That is not
-- cosmetic — on 2026-08-03 Louwrens worked the draft queue to the end and hit two
-- rows he could not approve (RS-076, RS-083). Both were ours, both withdrawn on
-- purpose, and the only record of that was a WITHDRAWN prefix buried in the
-- explanation text. He had no way to tell "not written yet" from "do not write
-- this". Reviewer time is the scarcest thing on this project; spending it on
-- rows we already decided against is pure waste.
--
-- 'withdrawn' means: this question is out of service and is NOT waiting on anyone.
-- It is kept rather than deleted so the reasoning survives — see the matching
-- entries in scripts/data-repairs/, which are the audit trail for why each went.
--
-- Serving is unaffected: every learner getter in src/lib/questions.ts filters
-- review_status = 'approved' explicitly, and the RLS select policy is
-- (review_status = 'approved' or is_admin()), so a withdrawn row is invisible to
-- learners for the same reason a draft is.

alter table public.questions
  drop constraint if exists questions_review_status_check;

alter table public.questions
  add constraint questions_review_status_check
    check (review_status in ('draft', 'approved', 'withdrawn'));

comment on column public.questions.review_status is
  'draft = being written, awaiting review. approved = served to learners. withdrawn = deliberately pulled, not awaiting anyone (reason recorded in scripts/data-repairs/).';
