/**
 * When a sign edit counts as a fresh human approval.
 *
 * Split out of `admin-actions.ts` because that file is `"use server"` — every
 * export there must be an async server action, so a pure predicate cannot live
 * in it, and this one is worth testing directly: it decides whether the column
 * that proves who cleared a sign gets written.
 */

/**
 * Order-independent structural key for a JSON value.
 *
 * `JSON.stringify` is key-order sensitive, and the editor's content object and
 * the row read back from PostgREST have no guaranteed key order. Comparing them
 * raw makes an unchanged save look edited, which would re-stamp the approver —
 * quietly replacing one reviewer's sign-off with whoever last opened the sign.
 * That is the precise failure this predicate exists to avoid, so the comparison
 * has to be canonical rather than textual.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value ?? null) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const body = Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
    .join(",");
  return `{${body}}`;
}

/**
 * True when this save should record a new approver + `verified_at`.
 *
 * An approval covers the text it was granted over, so:
 *  - not landing on `approved`      -> never stamp (leave the existing history)
 *  - was not approved before        -> stamp, this is the approval
 *  - already approved, content same -> do NOT stamp, someone else's sign-off stands
 *  - already approved, content edited -> stamp, the old approval no longer covers it
 */
export function shouldStampApproval(
  before: { review_status: string | null; content: unknown },
  next: { reviewStatus: string; content: unknown },
): boolean {
  if (next.reviewStatus !== "approved") return false;
  if (before.review_status !== "approved") return true;
  return canonicalJson(before.content ?? {}) !== canonicalJson(next.content ?? {});
}
