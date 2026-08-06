import { createAdminClient } from "@/lib/supabase/admin";
import { paperTokenHash } from "@/lib/readiness-token";

/**
 * Spend control for the free readiness assessment: one generation per signed
 * paper token, and a hard daily ceiling on model calls.
 *
 * Backed by `readiness_assessment_grants`, which holds a hash and a timestamp and
 * nothing else — see the migration for why there is deliberately no IP column.
 */

/**
 * Ceiling on free assessments per UTC day, implementing John's R20/day budget
 * (2026-08-06). Over the cap the route serves the deterministic template, so a
 * visitor arriving afterwards still gets something honest.
 *
 * Derived, not guessed — measured 2026-08-06 against the worst case, a
 * five-question sitting with every question missed, which is the largest payload
 * this format can produce:
 *
 *   1 440 prompt tokens @ $0.75/M  = $0.00108
 *     300 output tokens @ $4.50/M  = $0.00135
 *                                    ---------
 *                            call ≈ $0.0024 ≈ R0.05 at R20/USD
 *
 *   R20 / R0.05 = 400 assessments
 *
 * Two inputs to re-check rather than trust: the exchange rate (R20/USD is a
 * round, deliberately pessimistic figure — a stronger rand only buys headroom)
 * and the token counts if the prompt grows. `llmChat`'s `onUsage` reports both
 * on every call and the route logs them.
 */
const DEFAULT_DAILY_CAP = 400;

/** How long a spent grant is worth keeping. The token dies in 30 minutes; the
 *  row only has to outlive the daily count it contributes to. */
const SWEEP_AFTER_DAYS = 3;

export function dailyCap(): number {
  const raw = Number(process.env.READINESS_ASSESSMENT_DAILY_CAP);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_DAILY_CAP;
}

function grants() {
  const admin = createAdminClient();
  return admin ? admin.from("readiness_assessment_grants") : null;
}

/** Start of the current UTC day, as an ISO string. */
function startOfDay(now: Date): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export type ClaimResult = "granted" | "replay" | "capped" | "unavailable";

/**
 * Claim one generation against a paper token.
 *
 * The insert IS the claim: check-then-insert would let two concurrent replays
 * both pass the check, so the primary key does the work in a single statement.
 *
 * Order matters — the cap is read before the claim, so a capped day cannot be
 * pushed past its ceiling by traffic that arrives together. It is a count, not a
 * lock, so a burst can overshoot by roughly the number of in-flight requests;
 * that is an acceptable overshoot on a per-call cost measured in cents, and the
 * alternative is serialising every free assessment behind a lock.
 *
 * Returns "unavailable" when there is no service-role client, which the caller
 * must treat as "do not call the model" — no spend control means no spending.
 */
export async function claimAssessment(
  token: string,
  now: Date = new Date(),
): Promise<ClaimResult> {
  const table = grants();
  if (!table) return "unavailable";

  const { count } = await table
    .select("token_hash", { count: "exact", head: true })
    .gte("created_at", startOfDay(now));
  if ((count ?? 0) >= dailyCap()) return "capped";

  const { error } = await table.insert({ token_hash: paperTokenHash(token) });
  // 23505 — this token has already bought its assessment.
  if (error) return error.code === "23505" ? "replay" : "unavailable";

  void sweep(now);
  return "granted";
}

/**
 * Hand a claim back when the generation it paid for never happened.
 *
 * Without this, a provider timeout would burn the learner's one token and leave
 * them permanently on the template — the same shape of defect as the paid path's
 * permanently-cached fallback (AP-04), arriving by a different route.
 */
export async function releaseAssessment(token: string): Promise<void> {
  const table = grants();
  if (!table) return;
  await table.delete().eq("token_hash", paperTokenHash(token));
}

/** Drop rows that no longer feed any daily count. Fire-and-forget. */
async function sweep(now: Date): Promise<void> {
  const table = grants();
  if (!table) return;
  const cutoff = new Date(
    now.getTime() - SWEEP_AFTER_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  try {
    await table.delete().lt("created_at", cutoff);
  } catch {
    // A failed sweep is housekeeping debt, never a failed assessment.
  }
}
