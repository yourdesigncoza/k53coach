import { NextResponse } from "next/server";

/**
 * PayFast ITN (Instant Transaction Notification) webhook — STUB.
 *
 * Production checklist (do not ship without): verify the signature, confirm the
 * source IP / pf_valid against PayFast servers, validate the amount against the
 * order, then grant 90-day access. Yoco gets a sibling route. Direct checkout
 * only — never app-store IAP (PRD §Payments).
 *
 * The "grant access" step is just an insert into `public.entitlements`
 * (source:'payfast', expires_at: now()+90d, reference: pf_payment_id) via the
 * service-role client (src/lib/supabase/admin.ts) — the same row the admin grant
 * UI writes (src/lib/entitlement-actions.ts). Make it idempotent on the payment id.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const payload = form ? Object.fromEntries(form.entries()) : {};

  // TODO(payments): signature + server validation + idempotent access grant.
  console.info("[payfast] ITN received (stub)", Object.keys(payload));

  // PayFast expects a 200 to acknowledge receipt.
  return new NextResponse("OK", { status: 200 });
}
