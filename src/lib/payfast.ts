import { createHash, timingSafeEqual } from "node:crypto";

/**
 * PayFast (Payfast by Network) integration primitives.
 *
 * Two jobs: sign an outbound payment request, and prove an inbound ITN
 * (Instant Transaction Notification) is genuine before it is allowed to grant
 * anything. Everything here is host-agnostic and side-effect-free apart from the
 * two explicitly-async network checks, so it unit-tests without a DB or a gateway
 * — see payfast.test.ts. The route composes it: src/app/api/pay/payfast/route.ts
 *
 * Credentials: PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY are issued by PayFast;
 * PAYFAST_PASSPHRASE is chosen by US in the dashboard (Settings → Integration) and
 * must match there character-for-character or every signature fails.
 */

/** Hosts PayFast delivers ITN callbacks from — resolved as a source-IP allowlist. */
const ITN_SOURCE_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
] as const;

export type PayfastMode = "sandbox" | "live";

export interface PayfastConfig {
  merchantId: string;
  merchantKey: string;
  /** Salt appended to every signature. Empty string = no passphrase configured. */
  passphrase: string;
  mode: PayfastMode;
}

/**
 * PayFast's published sandbox credentials. Valid against sandbox.payfast.co.za for
 * anyone, documented publicly — these are NOT secrets and are safe in the repo.
 * Used when mode is "sandbox" and no sandbox-specific credentials are configured,
 * so a test run works with no setup. Register at sandbox.payfast.co.za for your
 * own sandbox pair and set PAYFAST_SANDBOX_* to override.
 */
const SANDBOX_DEFAULTS = {
  merchantId: "10000100",
  merchantKey: "46f0cd694581a",
  passphrase: "jt7NOE43FZPn",
} as const;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/**
 * Reads config from env, or null when live credentials are needed but absent —
 * the same graceful-degradation contract as the Supabase and LLM helpers.
 *
 * Credentials are selected BY MODE, which is the point: the live merchant ID is
 * never sent to the sandbox gateway (it would fail to authenticate) and sandbox
 * test credentials can never reach the live one. Mode defaults to "sandbox", so an
 * unset or misspelt PAYFAST_MODE cannot silently point real money at production.
 */
export function getPayfastConfig(): PayfastConfig | null {
  const mode: PayfastMode = env("PAYFAST_MODE") === "live" ? "live" : "sandbox";

  if (mode === "sandbox") {
    return {
      mode,
      merchantId: env("PAYFAST_SANDBOX_MERCHANT_ID") ?? SANDBOX_DEFAULTS.merchantId,
      merchantKey:
        env("PAYFAST_SANDBOX_MERCHANT_KEY") ?? SANDBOX_DEFAULTS.merchantKey,
      passphrase:
        env("PAYFAST_SANDBOX_PASSPHRASE") ?? SANDBOX_DEFAULTS.passphrase,
    };
  }

  const merchantId = env("PAYFAST_MERCHANT_ID");
  const merchantKey = env("PAYFAST_MERCHANT_KEY");
  if (!merchantId || !merchantKey) return null;
  return {
    mode,
    merchantId,
    merchantKey,
    passphrase: env("PAYFAST_PASSPHRASE") ?? "",
  };
}

export function hasPayfastConfig(): boolean {
  return getPayfastConfig() !== null;
}

function payfastBaseUrl(mode: PayfastMode): string {
  return mode === "live"
    ? "https://www.payfast.co.za"
    : "https://sandbox.payfast.co.za";
}

/** Where the checkout form POSTs the buyer to. */
export function payfastProcessUrl(mode: PayfastMode): string {
  return `${payfastBaseUrl(mode)}/eng/process`;
}

/**
 * PayFast hashes a parameter string built with PHP's `urlencode()`, which is NOT
 * `encodeURIComponent()`. Two differences matter and both silently break the
 * signature: spaces become "+" (not %20), and `!'()*~` ARE escaped while `-_.`
 * are not. This is the single most common cause of PayFast's "generated signature
 * does not match submitted signature" error, so it is spelled out rather than
 * approximated.
 */
export function payfastUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(
      /[!'()*~]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    )
    .replace(/%20/g, "+");
}

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

/**
 * `key=urlencoded(value)` joined with "&", passphrase appended last, MD5'd.
 * Shared by the request and ITN paths so the two can never drift apart.
 *
 * Values are hashed VERBATIM — deliberately not trimmed. PayFast hashes exactly
 * what crossed the wire, so trimming an inbound ITN value that legitimately
 * carried surrounding whitespace would compute a signature over a different
 * string than PayFast signed and reject a genuine payment. Whitespace defence
 * belongs at config load (see `env()`), not here. Matches the reference PHP
 * implementation, which likewise does not trim.
 */
function signParamString(
  pairs: Array<readonly [string, string]>,
  passphrase: string,
): string {
  const parts = pairs.map(([k, v]) => `${k}=${payfastUrlEncode(v)}`);
  if (passphrase) parts.push(`passphrase=${payfastUrlEncode(passphrase)}`);
  return md5(parts.join("&"));
}

/**
 * Signature for an OUTBOUND payment request. PayFast requires the fields in the
 * order they are submitted in the form, with empty fields omitted entirely.
 */
export function paymentRequestSignature(
  fields: Array<readonly [string, string]>,
  passphrase: string,
): string {
  return signParamString(
    fields.filter(([, v]) => v.trim() !== ""),
    passphrase,
  );
}

/**
 * The order PayFast documents for a payment request. The signature is the MD5 of
 * the fields in THIS sequence — not alphabetical, not form order — so the list is
 * the spec, and `buildPaymentRequest` walks it rather than iterating an object
 * (whose key order would be an accident of construction).
 */
export const PAYMENT_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "payment_method",
] as const;

export interface PaymentRequestInput {
  amountZar: number;
  itemName: string;
  itemDescription?: string;
  /** Our own reference for the attempt (m_payment_id). */
  paymentId: string;
  /** Who to grant on success — travels as custom_str1 and comes back in the ITN. */
  userId: string;
  email?: string;
  nameFirst?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

/**
 * Build the signed form that sends a buyer to PayFast. Returns ordered pairs
 * (not an object) because the caller renders them as hidden inputs and order is
 * what the signature was computed over.
 *
 * `custom_str1` carries the user id so the ITN can grant the right account without
 * a fragile email match — see resolveUserId in the ITN route.
 */
export function buildPaymentRequest(
  config: PayfastConfig,
  input: PaymentRequestInput,
): { url: string; fields: Array<[string, string]> } {
  const values: Partial<Record<(typeof PAYMENT_FIELD_ORDER)[number], string>> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: input.returnUrl,
    cancel_url: input.cancelUrl,
    notify_url: input.notifyUrl,
    name_first: input.nameFirst,
    email_address: input.email,
    m_payment_id: input.paymentId,
    amount: input.amountZar.toFixed(2),
    item_name: input.itemName,
    item_description: input.itemDescription,
    custom_str1: input.userId,
  };

  const fields = PAYMENT_FIELD_ORDER.flatMap((key) => {
    const value = values[key]?.trim();
    return value ? [[key, value] as [string, string]] : [];
  });

  return {
    url: payfastProcessUrl(config.mode),
    fields: [
      ...fields,
      ["signature", paymentRequestSignature(fields, config.passphrase)],
    ],
  };
}

/**
 * Signature for an INBOUND ITN. Built from every field except `signature`, in the
 * exact order received — empty values included, unlike the request path. Key order
 * is load-bearing, which is why the route parses the raw body instead of using
 * `formData()` or an object.
 */
export function itnSignature(
  pairs: Array<readonly [string, string]>,
  passphrase: string,
): string {
  return signParamString(
    pairs.filter(([k]) => k !== "signature"),
    passphrase,
  );
}

/** Constant-time hex comparison, case-insensitive. */
export function signaturesMatch(a: string, b: string): boolean {
  const x = Buffer.from(a.trim().toLowerCase());
  const y = Buffer.from(b.trim().toLowerCase());
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

/** Ordered key/value pairs from a urlencoded ITN body. Order is preserved. */
export function parseItnBody(rawBody: string): Array<[string, string]> {
  return [...new URLSearchParams(rawBody).entries()];
}

/**
 * PayFast sends amounts as decimal strings. Allow one cent of rounding slack.
 */
export function amountMatches(
  grossReceived: string,
  expectedZar: number,
): boolean {
  const gross = Number.parseFloat(grossReceived);
  return Number.isFinite(gross) && Math.abs(gross - expectedZar) <= 0.01;
}

/**
 * Is the callback coming from PayFast's infrastructure? Resolves the published ITN
 * hostnames at call time rather than pinning IPs, which PayFast rotates.
 */
export async function isPayfastSourceIp(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const { resolve4, resolve6 } = await import("node:dns/promises");
  const settled = await Promise.allSettled(
    ITN_SOURCE_HOSTS.flatMap((host) => [resolve4(host), resolve6(host)]),
  );
  const allowed = new Set(
    settled.flatMap((r) => (r.status === "fulfilled" ? r.value : [])),
  );
  return allowed.has(ip);
}

/**
 * Ask PayFast to confirm the payload it supposedly just sent us: post the raw body
 * straight back and require a VALID response. This is the check that survives a
 * leaked passphrase — a forged body with a correctly-computed signature still
 * fails here because PayFast has no such transaction on record.
 */
export async function confirmWithPayfast(
  rawBody: string,
  mode: PayfastMode,
): Promise<boolean> {
  try {
    const res = await fetch(`${payfastBaseUrl(mode)}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    if (!res.ok) return false;
    return (await res.text()).trim().toUpperCase().startsWith("VALID");
  } catch {
    return false;
  }
}

export type ItnRejection =
  | "not_configured"
  | "bad_signature"
  | "bad_source"
  | "not_confirmed";

export type ItnVerification =
  | { ok: true; fields: Record<string, string>; config: PayfastConfig }
  | { ok: false; reason: ItnRejection };

/**
 * The full gate an ITN must pass, in order, before a single row is written.
 * Kept here (not in the route) so the sequence is testable and can't be
 * reordered by accident — each check is meaningless without the ones before it.
 */
export async function verifyItn({
  rawBody,
  sourceIp,
}: {
  rawBody: string;
  sourceIp: string | null;
}): Promise<ItnVerification> {
  const config = getPayfastConfig();
  if (!config) return { ok: false, reason: "not_configured" };

  const pairs = parseItnBody(rawBody);
  const fields = Object.fromEntries(pairs);

  const received = fields.signature ?? "";
  if (!signaturesMatch(received, itnSignature(pairs, config.passphrase)))
    return { ok: false, reason: "bad_signature" };

  if (!(await isPayfastSourceIp(sourceIp)))
    return { ok: false, reason: "bad_source" };

  if (!(await confirmWithPayfast(rawBody, config.mode)))
    return { ok: false, reason: "not_confirmed" };

  return { ok: true, fields, config };
}
