-- Sign accuracy pipeline (docs/sign-accuracy-pipeline.md) — Phase 0.
-- Harden road_signs so verification against the official DoT chart is auditable
-- and a Wikipedia rename can never silently swap an already-approved sign.

-- Surrogate key: code stops being the PK (it can change on re-ingest); a stable
-- sign_id owns the row, code becomes a unique business key.
alter table public.road_signs
  add column sign_id uuid not null default gen_random_uuid();
alter table public.road_signs drop constraint road_signs_pkey;
alter table public.road_signs add primary key (sign_id);
alter table public.road_signs add constraint road_signs_code_key unique (code);

-- Verification + integrity columns.
alter table public.road_signs
  add column sa_relevant boolean,                 -- null=unknown; drives serve filter
  add column alignment text not null default 'unverified'
    check (alignment in ('unverified','aligned','not_in_chart','name_mismatch','ambiguous')),
  add column chart_match jsonb,                   -- {code,name,page,score}
  add column verification jsonb,                  -- {confidence,reason,visionPass,semanticPass}
  add column approved_by text,                    -- 'ai:claude-code' | 'panel' | '<human>'
  add column verified_at timestamptz,
  add column svg_hash text,                        -- sha256 of the approved SVG
  add column source_rev text;                      -- wikitext revid / commons sha (drift)

comment on column public.road_signs.alignment is
  'Deterministic cross-check vs the DoT chart authority (Phase 2).';
comment on column public.road_signs.verification is
  'Session verification evidence (Phase 3): confidence, reason, vision/semantic pass.';
