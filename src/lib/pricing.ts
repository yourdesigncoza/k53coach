/**
 * Once-off pricing for paid access — the single source of truth.
 *
 * Deliberately dependency-free so both client components (paywall, landing) and
 * server code (the PayFast ITN amount check) can import it. Do NOT add server-only
 * imports here or the marketing pages stop building.
 *
 * Pricing model is once-off, NOT a subscription: R149–R199 for 90 days full
 * access, then optionally R20/month for continued AI Coach access only
 * (PRD-additions §1 & §6).
 */

/** Paid access window, in days. */
export const ENTITLEMENT_DAYS = 90;

/** Once-off price in ZAR. The ITN handler rejects any payment that isn't this. */
export const ENTITLEMENT_PRICE_ZAR = 179;

/** Display form, e.g. "R179". */
export const ENTITLEMENT_PRICE_LABEL = `R${ENTITLEMENT_PRICE_ZAR}`;
