import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveEntitlement } from "@/lib/entitlements";
import { ENTITLEMENT_DAYS, ENTITLEMENT_PRICE_ZAR } from "@/lib/pricing";
import { buildPaymentRequest, getPayfastConfig } from "@/lib/payfast";

/**
 * Starts a PayFast checkout: returns the gateway URL plus the signed hidden fields
 * for the client to POST. The buyer's browser has to do the POST (PayFast renders
 * its own payment page), so this route signs and the paywall submits.
 *
 * CLOSED BY DEFAULT. Requires NEXT_PUBLIC_PAYFAST_CHECKOUT_ENABLED=true, checked
 * here server-side and not only in the UI — the Stage 1 gate (K53-32) means real
 * checkout must stay shut in production until the content floor is met, and a flag
 * only enforced in a client component is not a gate.
 */

export const dynamic = "force-dynamic";

function checkoutEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PAYFAST_CHECKOUT_ENABLED === "true";
}

/**
 * Absolute origin for the return/cancel/notify URLs. Built from the forwarded
 * headers so it is correct on a Vercel preview deployment as well as production —
 * PayFast must be able to reach notify_url from the public internet, which is why
 * ITN cannot be tested against localhost.
 */
function siteOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

export async function POST(req: Request) {
  if (!checkoutEnabled())
    return NextResponse.json({ error: "checkout_closed" }, { status: 503 });

  const config = getPayfastConfig();
  if (!config)
    return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user)
    return NextResponse.json({ error: "needs_auth" }, { status: 401 });

  // Don't let someone pay twice for access they already hold.
  const active = await getActiveEntitlement(auth.user.id);
  if (active)
    return NextResponse.json(
      { error: "already_active", expiresAt: active.expires_at },
      { status: 409 },
    );

  const origin = siteOrigin(req);
  const request = buildPaymentRequest(config, {
    amountZar: ENTITLEMENT_PRICE_ZAR,
    itemName: `K53 AI Coach — ${ENTITLEMENT_DAYS} days full access`,
    paymentId: `k53-${randomUUID()}`,
    userId: auth.user.id,
    email: auth.user.email ?? undefined,
    returnUrl: `${origin}/dashboard`,
    cancelUrl: `${origin}/paywall`,
    notifyUrl: `${origin}/api/pay/payfast`,
  });

  console.info("[payfast] checkout started", {
    mode: config.mode,
    userId: auth.user.id,
  });

  return NextResponse.json(request);
}
