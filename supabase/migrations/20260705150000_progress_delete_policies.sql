-- Let a learner reset their OWN progress. The original tables only granted
-- select/insert (and update on exam_attempts); a learner-facing "reset my
-- progress" needs own-row delete. RLS still scopes every delete to auth.uid().

create policy "attempts_delete_own" on public.attempts
  for delete using (auth.uid() = user_id);

create policy "readiness_results_delete_own" on public.readiness_results
  for delete using (auth.uid() = user_id);

create policy "exam_attempts_delete_own" on public.exam_attempts
  for delete using (auth.uid() = user_id);
