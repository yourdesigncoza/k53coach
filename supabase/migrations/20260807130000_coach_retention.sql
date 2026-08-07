-- Retention for Ask Coach message bodies (PRD-ask-coach.md §7, decision g).
--
-- The review queue's value is the QUESTION and how often it recurs. Neither needs
-- the raw text kept forever, and keeping it would make this table a permanent
-- transcript of everything learners typed into a free-text box — which is not
-- what it is for, and not something anyone agreed to.
--
-- So bodies of turns that were REFUSED or NOT COVERED are blanked after a
-- retention window. The row survives: status, timestamps and counts are what the
-- queue aggregates, and deleting rows outright would quietly rewrite the history
-- of how often the corpus fell short.
--
-- Answered turns are left alone. A learner's own chat history is theirs to read
-- and theirs to delete (delete-own on coach_conversations, which cascades).
--
-- Deliberately a security-definer FUNCTION rather than an admin UPDATE policy.
-- Handing admins a general write on this table would let a message be edited
-- after the fact, and the same argument feedback_reports makes applies here: a
-- record somebody can rewrite is not evidence of anything.

create or replace function public.coach_purge_expired_bodies(p_days integer default 30)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'not authorised';
  end if;

  update public.coach_messages
     set body = ''
   where role = 'user'
     and body <> ''
     and created_at < now() - (p_days || ' days')::interval
     and conversation_id in (
       -- The learner's turn is purged when the coach's reply to it was refused
       -- or uncovered: that pairing is what marks the exchange as one the queue
       -- keeps for counting rather than for reading.
       select conversation_id from public.coach_messages
        where role = 'assistant' and status in ('refused','not_covered')
     );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.coach_purge_expired_bodies(integer) from public;
grant execute on function public.coach_purge_expired_bodies(integer) to authenticated;

comment on function public.coach_purge_expired_bodies is
  'Blanks learner question text in refused/not_covered exchanges older than p_days. Admin-only. Rows are kept so the review queue can still count how often the corpus fell short.';
