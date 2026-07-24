-- Sign ↔ marking cross-linking, plus a home for the "memory trick" content field.
-- Client requirement (K53-30): "The road markings needs to be connected to the
-- different road signs as well as they do not stand alone. EXAMPLE - Stop sign
-- and Stop line needs to be connected."
--
-- Road markings live in `road_signs` with category='marking' — the category
-- already exists in the check constraint, the SignCategory type and the label
-- map; there are simply no rows yet. Putting markings here (rather than in a new
-- table) means they inherit the two verification gates, the provenance columns
-- and the bilingual content shape that signs already have. Markings must clear
-- the same bar as signs: no AI-generated artwork, chart-verified only.

-- Bidirectional-by-convention link between a sign and its marking (and between
-- confusable signs). Not an FK array — Postgres cannot FK an array element — so
-- referential integrity is maintained by the admin UI and the seed scripts.
alter table public.road_signs
  add column if not exists related_codes text[] not null default '{}';

comment on column public.road_signs.related_codes is
  'Codes of related road_signs rows — chiefly sign↔marking pairs (R1 stop sign ↔ RTM1 stop line), also confusable signs. Convention: set on BOTH rows.';

-- Find every row that references a given code (the reverse lookup a learner page
-- needs when rendering "see also" on a sign or marking).
create index if not exists road_signs_related_codes_idx
  on public.road_signs using gin (related_codes);

-- `content` gains an optional `memoryTrick` key (bilingual, same shape as the
-- other fields). No DDL needed — content is jsonb — but the key is recorded here
-- so the shape stays documented in one place alongside the others.
comment on column public.road_signs.content is
  'Bilingual learner content. Keys: plainEnglish, formalMeaning, behaviour, commonMistake, testHint, memoryTrick. Each is {"en": "...", "af": "..."}.';
