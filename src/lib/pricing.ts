/**
 * Once-off pricing for paid access — the single source of truth.
 *
 * Deliberately dependency-free so both client components (paywall, landing) and
 * server code (the PayFast ITN amount check) can import it. Do NOT add server-only
 * imports here or the marketing pages stop building.
 *
 * Pricing model is once-off, NOT a subscription: one price for 90 days full
 * access (PRD-additions §1 & §6). There is exactly ONE price — the monthly
 * continuation tier the PRD sketches was dropped by John on 2026-08-07, so
 * nothing here describes a recurring charge and nothing in the schema supports
 * one (`entitlements.product` is CHECK-constrained to a single value).
 */

/** Paid access window, in days. */
export const ENTITLEMENT_DAYS = 90;

/** Once-off price in ZAR. The ITN handler rejects any payment that isn't this. */
export const ENTITLEMENT_PRICE_ZAR = 210;

/** Display form, e.g. "R210". */
export const ENTITLEMENT_PRICE_LABEL = `R${ENTITLEMENT_PRICE_ZAR}`;

/**
 * Per-learner school price in ZAR. NOT a PayFast product — schools are invoiced,
 * so no ITN check reads this. It exists so the landing page stops hardcoding a
 * price inside a translated string, where a literal price is a claim that cannot
 * be corrected by changing a constant (see docs/claims-audit-2026-08-04.md).
 */
export const SCHOOL_PRICE_ZAR = 180;

/** Display form, e.g. "R180". */
export const SCHOOL_PRICE_LABEL = `R${SCHOOL_PRICE_ZAR}`;
