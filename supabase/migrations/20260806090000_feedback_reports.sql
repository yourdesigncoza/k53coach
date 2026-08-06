-- In-app reporting: learners report a bug, or flag a question/sign/rule as wrong.
--
-- Two report kinds share one table because they share one triage queue and one
-- push-to-Linear path; only the anchor columns differ. `context` is jsonb rather
-- than twenty columns because the useful fields will churn as we learn what
-- triage actually reads, and jsonb absorbs that without DDL.
--
-- Signed-in only (RLS insert requires auth.uid() = user_id), which is what makes
-- this safe without a rate-limit table or a service-role write path: every row
-- is attributable, and the per-hour cap in src/lib/feedback.ts is a courtesy
-- guard against a stuck submit button, not a spam defence.
--
-- Submission NEVER calls Linear. The row is the durable record; an admin pushes
-- it to Linear at triage. So Linear being down cannot cost a learner a report,
-- and a report costs the learner no external-API latency.

create table if not exists public.feedback_reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  user_email   text not null,                     -- snapshot: survives a profile change
  kind         text not null check (kind in ('bug','content')),
  body         text not null,                     -- learner's words; min length enforced in app

  -- Content-report anchors. Null for bug reports. Exactly one of question_id /
  -- sign_code identifies WHAT was flagged; objective_code is carried for both so
  -- triage can group reports by lesson.
  question_id     text,
  sign_code       text,
  objective_code  text,
  chosen_index    smallint,                       -- option the learner picked (post-shuffle, mapped back)
  keyed_index     smallint,                       -- option the bank keys as correct

  -- Everything else: client signals (route, viewport, errors, click trail) and
  -- the server-side enrichment (role, entitlement, last attempt, and for content
  -- reports a provenance snapshot of the flagged row). Shape in src/lib/feedback.ts.
  context      jsonb not null default '{}',

  -- Triage
  status       text not null default 'new'
    check (status in ('new','pushed','resolved','dismissed')),
  linear_issue_id  text,
  linear_issue_url text,
  linear_identifier text,                         -- e.g. K53-41, for display
  ai_title     text,                              -- drafted at triage, admin-editable
  ai_priority  text check (ai_priority in ('urgent','high','medium','low')),
  admin_note   text,
  resolved_by  uuid references auth.users (id) on delete set null,
  resolved_at  timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Triage queue: newest open reports first.
create index if not exists feedback_reports_status_idx
  on public.feedback_reports (status, created_at desc);

-- "Has this question been flagged before?" — the question a reviewer asks first
-- when a content report lands, and the one that turns a single complaint into a
-- pattern worth acting on.
create index if not exists feedback_reports_question_idx
  on public.feedback_reports (question_id) where question_id is not null;
create index if not exists feedback_reports_sign_idx
  on public.feedback_reports (sign_code) where sign_code is not null;

-- Own submissions, for the per-hour cap check.
create index if not exists feedback_reports_user_idx
  on public.feedback_reports (user_id, created_at desc);

alter table public.feedback_reports enable row level security;

-- A learner inserts their own report and can read it back. They cannot edit or
-- delete it: a report is evidence, and a reporter who can rewrite it after the
-- fact makes triage unfalsifiable. Admins own the whole lifecycle.
create policy "feedback_reports_insert_own" on public.feedback_reports
  for insert with check (auth.uid() = user_id);
create policy "feedback_reports_select_own_or_admin" on public.feedback_reports
  for select using (auth.uid() = user_id or public.is_admin());
create policy "feedback_reports_admin_update" on public.feedback_reports
  for update using (public.is_admin()) with check (public.is_admin());
create policy "feedback_reports_admin_delete" on public.feedback_reports
  for delete using (public.is_admin());

comment on column public.feedback_reports.context is
  'Client signals (route, locale, viewport, connection, console/fetch errors, click trail) merged with server-side enrichment (role, entitlement, last exam attempt, readiness) and, for content reports, a provenance snapshot of the flagged question or sign at report time. Shape defined in src/lib/feedback.ts — jsonb because the useful fields churn.';

comment on column public.feedback_reports.keyed_index is
  'What the bank keyed as correct WHEN THE REPORT WAS FILED. Deliberately snapshotted: if the answer is later corrected, the report must still show what the learner actually saw, or the evidence dissolves the moment it is acted on.';
