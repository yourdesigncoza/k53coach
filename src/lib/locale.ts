import { routing } from "@/i18n/routing";

/**
 * Narrow an untrusted locale value to one this app actually serves.
 *
 * Anything reaching a model or a cache key must go through here. A locale is
 * client-supplied — the client knows its own route — but an arbitrary string is
 * an unbounded set of cache keys, and an unbounded set of cache keys is unbounded
 * model spend. Unknown input falls back to the default locale rather than
 * erroring: the learner gets an assessment in English, not a failure.
 */
export function validLocale(input: unknown): string {
  return typeof input === "string" &&
    (routing.locales as readonly string[]).includes(input)
    ? input
    : routing.defaultLocale;
}
