-- DB4 question bank. Replaces the static src/content/readiness-questions.ts so the
-- client can add/edit/delete questions at runtime (admin Content Management). English
-- only for now; the readiness diagnostic is the curated subset where in_readiness=true.

create table public.questions (
  id           text primary key,
  topic        text not null check (topic in ('signs','rules','controls')),
  difficulty   smallint not null default 1 check (difficulty between 1 and 3),
  prompt       text not null default '',
  options      jsonb not null default '["",""]'::jsonb,
  answer       smallint not null default 0,
  explanation  text not null default '',
  sign_code    text,                 -- optional pointer to road_signs.code (no hard FK)
  in_readiness boolean not null default false,
  review_status text not null default 'draft' check (review_status in ('draft','approved')),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users on delete set null,

  -- Structural integrity: options must be an array of >= 2 and answer must index it.
  constraint questions_options_is_array
    check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2),
  constraint questions_answer_in_range
    check (answer >= 0 and answer < jsonb_array_length(options)),
  -- Approved rows must be complete (drafts may be partial while being written).
  constraint questions_approved_complete
    check (
      review_status <> 'approved'
      or (length(prompt) > 0 and length(explanation) > 0)
    )
);

create index questions_topic_idx on public.questions (topic);
create index questions_serve_idx on public.questions (review_status, in_readiness);

alter table public.questions enable row level security;

-- Public sees only approved questions; admins see everything. Drafts (and their
-- answers) stay hidden. Reuses public.is_admin() from the road_signs migration.
create policy "questions_select_approved_or_admin" on public.questions
  for select using (review_status = 'approved' or public.is_admin());
create policy "questions_admin_insert" on public.questions
  for insert with check (public.is_admin());
create policy "questions_admin_update" on public.questions
  for update using (public.is_admin()) with check (public.is_admin());
create policy "questions_admin_delete" on public.questions
  for delete using (public.is_admin());

-- Seed: the 15 original readiness questions (approved + in_readiness), ids preserved
-- so existing attempts.question_id values stay valid.

insert into public.questions
  (id, topic, difficulty, prompt, options, answer, explanation, sign_code, in_readiness, review_status, sort_order)
values
  ('q-signs-1', 'signs', 1, 'You approach an eight-sided red sign. What must you do?', '["Slow down only if other cars are near", "Come to a complete stop, then go when it is safe", "Sound your hooter and continue", "Stop only at night"]'::jsonb, 1, 'An eight-sided (octagonal) red sign is always STOP. You must stop completely every time, then proceed only when the way is clear.', 'R1', true, 'approved', 0),
  ('q-signs-2', 'signs', 1, 'A downward-pointing triangle with a red border means:', '["Stop", "No entry", "Yield / give way", "Speed limit"]'::jsonb, 2, 'A downward triangle with a red border is a yield sign. Slow down and give right of way; only stop if something is coming.', 'R2', true, 'approved', 1),
  ('q-signs-3', 'signs', 2, 'What is the difference between a no-entry sign and a one-way sign?', '["They mean the same thing", "No-entry forbids you from entering; one-way shows the permitted direction", "One-way forbids you; no-entry shows direction", "Both only apply to trucks"]'::jsonb, 1, 'A no-entry sign (red circle, white bar) forbids you from entering that road. A one-way sign (an arrow) simply shows the single direction traffic may travel.', 'R3', true, 'approved', 2),
  ('q-signs-4', 'signs', 2, 'A red circle with the number 60 inside it tells you that:', '["The recommended speed is 60 km/h", "You must drive exactly 60 km/h", "60 km/h is the maximum allowed", "There are 60 km to the next town"]'::jsonb, 2, 'A number in a red circle is a maximum speed limit. You may drive slower, but never faster than 60 km/h until another sign changes it.', 'R201-60', true, 'approved', 3),
  ('q-signs-5', 'signs', 3, 'A red circle crossed by two diagonal lines (rather than one) means:', '["No parking", "No stopping", "No overtaking", "No U-turn"]'::jsonb, 1, 'Two crossing lines mean no stopping — stricter than no-parking (one line). You may not even pause to drop someone off.', 'R217', true, 'approved', 4),
  ('q-rules-1', 'rules', 1, 'At a four-way stop where two cars arrive at the same time, who goes first?', '["The faster car", "The car on the right", "The vehicle that arrived first; if simultaneous, the one on the right", "The larger vehicle"]'::jsonb, 2, 'First to arrive goes first. If two arrive together, the vehicle on the right has right of way.', null, true, 'approved', 5),
  ('q-rules-2', 'rules', 1, 'What is the general following distance rule in good conditions?', '["Stay one car length behind", "Keep at least a two-second gap to the car ahead", "Always stay 100 m behind", "Following distance does not matter below 60 km/h"]'::jsonb, 1, 'Use the two-second rule: pick a fixed point, and you should pass it at least two seconds after the car ahead. Increase the gap in rain.', null, true, 'approved', 6),
  ('q-rules-3', 'rules', 2, 'When may you cross a solid white line in the centre of the road?', '["Whenever the road is clear", "To overtake a slow vehicle", "Only to avoid an obstruction when it is safe", "Never, under any circumstances"]'::jsonb, 2, 'A solid line means no overtaking. You may only cross it when necessary to avoid an obstruction and only when it is safe to do so.', null, true, 'approved', 7),
  ('q-rules-4', 'rules', 2, 'When approaching a pedestrian crossing with people waiting, you should:', '["Speed up to pass before they step out", "Stop and allow them to cross", "Hoot to warn them to wait", "Continue at the same speed"]'::jsonb, 1, 'Pedestrians have right of way at a crossing. Slow down, stop, and let them cross safely.', null, true, 'approved', 8),
  ('q-rules-5', 'rules', 3, 'What should you do before changing lanes on a busy road?', '["Indicate, check mirrors, and check your blind spot, then move when safe", "Just indicate and move immediately", "Move first, then indicate", "Only check the mirror"]'::jsonb, 0, 'Signal your intention, check mirrors, then physically check the blind spot over your shoulder before moving. Mirrors alone miss the blind spot.', null, true, 'approved', 9),
  ('q-controls-1', 'controls', 1, 'Which pedal do you press to slow the vehicle down?', '["Accelerator", "Clutch", "Brake", "Handbrake button"]'::jsonb, 2, 'The brake pedal (usually the middle pedal in a manual car) slows and stops the vehicle.', null, true, 'approved', 10),
  ('q-controls-2', 'controls', 1, 'What is the clutch used for in a manual vehicle?', '["To make the car go faster", "To change gears smoothly by disconnecting the engine from the wheels", "To sound the hooter", "To switch on the lights"]'::jsonb, 1, 'Pressing the clutch temporarily disconnects the engine from the wheels so you can change gears without grinding them.', null, true, 'approved', 11),
  ('q-controls-3', 'controls', 2, 'Before driving off, the first thing you should do after getting in is:', '["Start the engine immediately", "Adjust your seat, mirrors, and fasten your seatbelt", "Select fifth gear", "Switch on the radio"]'::jsonb, 1, 'Set up your seat and mirrors and belt up first so you have full control and visibility before the car moves.', null, true, 'approved', 12),
  ('q-controls-4', 'controls', 2, 'When should you use the handbrake?', '["Only when the car breaks down", "When parked, and to help hold the car on a hill start", "While driving at high speed", "Never — it is only for emergencies"]'::jsonb, 1, 'The handbrake holds the car still when parked and helps prevent rolling back during a hill start.', null, true, 'approved', 13),
  ('q-controls-5', 'controls', 3, 'What does it usually mean if a red warning light stays on after starting?', '["The car is working perfectly", "It is just a decoration", "Something needs attention — check before driving", "You must drive faster to clear it"]'::jsonb, 2, 'A red warning light that stays on signals a fault (such as oil, brakes, or battery). Investigate before driving to avoid damage or danger.', null, true, 'approved', 14)
on conflict (id) do nothing;
