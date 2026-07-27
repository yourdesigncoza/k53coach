import { NextResponse } from "next/server";
import {
  createAdminClient,
  findUserIdByEmail,
  type AdminClient,
} from "@/lib/supabase/admin";
import { ENTITLEMENT_DAYS, ENTITLEMENT_PRICE_ZAR } from "@/lib/pricing";
import { amountMatches, verifyItn } from "@/lib/payfast";

/**
 * PayFast ITN (Instant Transaction Notification) webhook — the only thing that
 * turns a real payment into paid access.
 *
 * Nothing is written until the payload clears all four gates in src/lib/payfast.ts
 * (config → signature → source IP → PayFast's own confirmation) AND the amount
 * matches our price. Grants are idempotent: a repeated delivery of the same
 * payment hits the unique index on (source, reference) and is treated as success.
 *
 * Status-code contract with PayFast, which retries on a non-2xx:
 *   200 — handled, stop retrying (granted, duplicate, or nothing-to-do)
 *   400 — the payload is not trustworthy; retrying won't change that
 *   500/503 — OUR fault (DB or config unavailable); please retry
 *
 * Note the deliberate 200s: an unmatched user or a non-COMPLETE status are not
 * retryable problems, so we acknowledge and log loudly instead of making PayFast
 * hammer the endpoint. Yoco gets a sibling route. Direct checkout only — never
 * app-store IAP (PRD §Payments).
 */

export const dynamic = "force-dynamic";

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Which account gets the access. `custom_str1` is the user id we attach at
 * checkout; the email fallback covers a payment made outside that flow (or a
 * checkout built before custom_str1 was wired).
 */
async function resolveUserId(
  admin: AdminClient,
  fields: Record<string, string>,
): Promise<string | null> {
  const fromCheckout = fields.custom_str1?.trim();
  if (fromCheckout && UUID_RE.test(fromCheckout)) return fromCheckout;
  const email = fields.email_address?.trim();
  return email ? findUserIdByEmail(admin, email) : null;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sourceIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const verified = await verifyItn({ rawBody, sourceIp });
  if (!verified.ok) {
    console.error("[payfast] ITN rejected", verified.reason);
    return new NextResponse(verified.reason, {
      status: verified.reason === "not_configured" ? 503 : 400,
    });
  }

  const fields = verified.fields;
  const reference = fields.pf_payment_id?.trim() || fields.m_payment_id?.trim();

  // Only a completed payment grants anything. PENDING/FAILED/CANCELLED are
  // acknowledged so PayFast stops retrying, but change nothing.
  if (fields.payment_status !== "COMPLETE") {
    console.info("[payfast] ITN ignored — status", fields.payment_status);
    return new NextResponse("OK", { status: 200 });
  }

  // Underpayment guard: never grant 90 days for R1. Not retryable.
  if (!amountMatches(fields.amount_gross ?? "", ENTITLEMENT_PRICE_ZAR)) {
    console.error("[payfast] amount mismatch — no grant", {
      reference,
      expected: ENTITLEMENT_PRICE_ZAR,
      received: fields.amount_gross,
    });
    return new NextResponse("amount mismatch", { status: 400 });
  }

  if (!reference) {
    console.error("[payfast] COMPLETE ITN with no payment id — no grant");
    return new NextResponse("missing payment id", { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    // Our problem, and money has already changed hands — ask for a retry.
    console.error("[payfast] SUPABASE_SERVICE_ROLE_KEY missing — cannot grant", {
      reference,
    });
    return new NextResponse("storage unavailable", { status: 503 });
  }

  const userId = await resolveUserId(admin, fields);
  if (!userId) {
    // A retry can't invent an account. Acknowledge, and shout — this is a paid
    // customer with no access, to be granted by hand in admin → entitlements.
    console.error("[payfast] PAID BUT UNMATCHED — grant this by hand", {
      reference,
      email: fields.email_address,
    });
    return new NextResponse("OK", { status: 200 });
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + ENTITLEMENT_DAYS);

  const { error } = await admin.from("entitlements").insert({
    user_id: userId,
    source: "payfast",
    expires_at: expires.toISOString(),
    reference,
  });

  if (error?.code === UNIQUE_VIOLATION) {
    // Duplicate delivery — PayFast retries, and concurrent deliveries race. The
    // index is what makes this safe; this branch just reports the truth.
    console.info("[payfast] duplicate ITN — already granted", { reference });
    return new NextResponse("OK", { status: 200 });
  }
  if (error?.code === FOREIGN_KEY_VIOLATION) {
    console.error("[payfast] user id no longer exists — grant by hand", {
      reference,
      userId,
    });
    return new NextResponse("OK", { status: 200 });
  }
  if (error) {
    console.error("[payfast] entitlement insert failed", {
      reference,
      message: error.message,
    });
    return new NextResponse("grant failed", { status: 500 });
  }

  console.info("[payfast] access granted", {
    reference,
    userId,
    days: ENTITLEMENT_DAYS,
  });
  return new NextResponse("OK", { status: 200 });
}
