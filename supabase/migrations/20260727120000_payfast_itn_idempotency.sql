-- Idempotent payment grants (K53-5).
--
-- PayFast retries an ITN until it gets a 2xx, and can deliver concurrently. Two
-- deliveries of the same payment must not produce two entitlement rows — careful
-- application code cannot guarantee that on its own, because the duplicate check
-- and the insert are separate statements. The database has to enforce it.
--
-- Why PARTIAL rather than a plain unique index on (source, reference):
-- admin grants legitimately repeat a human-written note ('test checkout
-- (self-grant)' already appears 5 times in this table), so a full unique index
-- both fails to create and would wrongly block a second manual grant carrying the
-- same note. Payment references, by contrast, are gateway-issued and unique per
-- transaction, so the constraint belongs only to the payment sources.
--
-- The ITN handler relies on this raising 23505 on a repeat delivery — it treats
-- that error as success rather than pre-checking (src/app/api/pay/payfast/route.ts).
-- Do not drop this index without changing that handler.

create unique index if not exists entitlements_payment_reference_key
  on public.entitlements (source, reference)
  where source in ('payfast', 'yoco') and reference is not null;

comment on index public.entitlements_payment_reference_key is
  'Makes payment-gateway grants idempotent: one entitlement per (gateway, payment reference). Partial so hand-written admin references may repeat.';

-- No RLS change needed: the ITN handler writes with the service-role client,
-- which bypasses RLS. The existing insert policy stays admin-only so that no
-- learner-context client can ever mint its own entitlement.
