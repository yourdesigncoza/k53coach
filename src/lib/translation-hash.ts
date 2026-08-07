/**
 * Override-staleness primitives. Deliberately import-free.
 *
 * `src/lib/translations.ts` cannot be imported by a plain node script (it pulls
 * `@/lib/supabase/server`, which reaches `next/headers`), and the hash algorithm
 * is the one thing that must never diverge between the admin UI and the drift
 * check — a second copy that hashes differently reports every row as stale. So
 * the algorithm, the seed shape and the staleness rule live here, with no
 * imports, and both sides call in.
 *
 * Nothing here reads the request path. An override always wins at render time
 * (John, 2026-08-07); these functions only answer "was this written against the
 * default we ship today?".
 */

/**
 * Namespaces where a stale override is a factual risk, not a wording
 * preference: prices, durations, capabilities and legal promises. Drift here
 * fails `npm run i18n:check` rather than warning.
 *
 * Derived from what actually went wrong on /af — a "5 minute" test length, two
 * "works offline" claims, a hardcoded R179 that bypassed pricing.ts, and a
 * parent-consent promise nothing in src/ implements. Every one of those sat in
 * this list's namespaces.
 */
export const CLAIM_NAMESPACES = [
  "landing",
  "readiness",
  "result",
  "paywall",
  "legal",
  "auth",
] as const;

export function isClaimNamespace(namespace: string): boolean {
  return (CLAIM_NAMESPACES as readonly string[]).includes(namespace);
}

/**
 * Stable hash of a key's shipped defaults.
 *
 * Seeds on **both** locales jointly, so an English-only copy edit also marks the
 * Afrikaans override stale. That is deliberate and is the point of the whole
 * exercise: when the English claim changes, the Afrikaans translation of the old
 * claim is exactly what we need flagged. The cost is that a pure English typo
 * fix flags its Afrikaans sibling — an over-report, and over-reporting is the
 * safe direction here.
 *
 * ⚠ The two defaults are joined with a **NUL**, not a space — carried over
 * verbatim from the original `defaultHash`, and not cosmetic: a space is a legal
 * character inside a UI string, so `"a b" + "c"` and `"a" + "b c"` would seed
 * identically and two different pairs of defaults would hash the same. NUL
 * cannot appear in the JSON. Changing this separator silently invalidates every
 * stored hash, i.e. marks the whole table stale.
 */
export function hashSeed(
  enDefault: string | undefined,
  afDefault: string | undefined,
): string {
  const seed = `${enDefault ?? ""}\0${afDefault ?? ""}`;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = (h * 33) ^ seed.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/**
 * Was this override written against a default we no longer ship?
 *
 * NULL/undefined counts as stale — those rows predate the column, so we
 * genuinely do not know, and the rows we already know drifted are precisely the
 * ones with no hash.
 */
export function isOverrideStale(
  storedHash: string | null | undefined,
  currentHash: string,
): boolean {
  return storedHash == null || storedHash !== currentHash;
}
