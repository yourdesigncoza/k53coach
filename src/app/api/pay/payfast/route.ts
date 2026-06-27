import { NextResponse } from "next/server";

/**
 * PayFast ITN (Instant Transaction Notification) webhook — STUB.
 *
 * Production checklist (do not ship without): verify the signature, confirm the
 * source IP / pf_valid against PayFast servers, validate the amount against the
 * order, then grant 90-day access. Yoco gets a sibling route. Direct checkout
 * only — never app-store IAP (PRD §Payments).
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const payload = form ? Object.fromEntries(form.entries()) : {};

  // TODO(payments): signature + server validation + idempotent access grant.
  console.info("[payfast] ITN received (stub)", Object.keys(payload));

  // PayFast expects a 200 to acknowledge receipt.
  return new NextResponse("OK", { status: 200 });
}
