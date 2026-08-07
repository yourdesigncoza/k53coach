/**
 * Spend control for Ask Coach.
 *
 * The shape is `readiness-grants.ts`, one step further along. That table could
 * let the primary key do the work because a paper token buys exactly one call;
 * here the limit is a COUNT, so the check and the spend have to be serialised —
 * which is what `coach_claim()` does with a per-user advisory lock.
 *
 * What this is not: `feedback-actions.ts`'s count-my-own-rows check. That idiom's
 * own comment calls it "a courtesy guard against a stuck submit button, not a
 * spam defence", which is right for a free form and wrong for anything that
 * spends money — several tabs each read 24 and each proceed.
 *
 * The caps below are only half the story. They bound the NUMBER of calls; the
 * input caps in `coach-reply.ts` and `coach-retrieval.ts` bound the SIZE of each
 * one. Without both, "400 messages" is not a rand figure — a padded question
 * that clears retrieval costs many times the estimate.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

/**
 * Per-learner daily cap.
 *
 * Sized from the enforced per-message ceiling, not from a guess:
 *
 *   system                         ~1 000 tok
 *   8 passages x 700 chars         ~1 400 tok
 *   4 history turns x 250 chars      ~250 tok
 *   question <= 500 chars            ~125 tok
 *                                   ---------
 *   prompt ceiling                 ~2 775 tok @ $0.75/M = $0.00208
 *   max_tokens 250                            @ $4.50/M = $0.00113
 *                        per message ≈ $0.0032 ≈ R0.065 at R20/USD
 *
 * 25/day x 400/entitlement → at most ~R28 of inference against a R179 sale.
 * Both figures are ceilings because every input above is truncated before the
 * call, which is the correction that turned this from an average into a bound.
 */
export const DAILY_MESSAGE_CAP = 25;

/** Per 90-day entitlement. Stamped with `entitlement_id`, so a renewal starts clean. */
export const PERIOD_MESSAGE_CAP = 400;

/**
 * Global daily ceiling on model calls, in messages.
 *
 * MANDATORY, not optional. Per-learner caps do nothing against several accounts,
 * and a design whose only cross-account control is optional has no total spend
 * bound at all. R30/day ÷ R0.065 ≈ 460.
 */
const DEFAULT_GLOBAL_DAILY_CAP = 460;

export function globalDailyCap(): number {
  const raw = Number(process.env.COACH_GLOBAL_DAILY_CAP);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_GLOBAL_DAILY_CAP;
}

/** How many prior turns are replayed. Each is clamped in `coach-reply.ts`. */
export const HISTORY_TURNS = 4;

/** Ceiling on completion tokens. The other half of the per-message bound. */
export const MAX_COMPLETION_TOKENS = 250;

export type ClaimOutcome =
  | "granted"
  | "capped_day"
  | "capped_period"
  | "capped_global"
  | "unauthenticated"
  | "unavailable";

export interface Claim {
  outcome: ClaimOutcome;
  reservationId: string | null;
  usedToday: number;
  usedPeriod: number;
}

type Client = SupabaseClient<Database>;

/**
 * Reserve one model call.
 *
 * Called with the LEARNER'S client, not a service-role one: `coach_claim` is
 * security-definer and reads `auth.uid()` itself, so this cannot spend on anyone
 * else's allowance even if invoked directly. Reserve BEFORE the provider call.
 */
export async function claimCoachTurn(
  supabase: Client,
  entitlementId: string,
): Promise<Claim> {
  const { data, error } = await supabase.rpc("coach_claim", {
    p_entitlement_id: entitlementId,
    p_daily_cap: DAILY_MESSAGE_CAP,
    p_period_cap: PERIOD_MESSAGE_CAP,
    p_global_cap: globalDailyCap(),
  });

  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return { outcome: "unavailable", reservationId: null, usedToday: 0, usedPeriod: 0 };

  return {
    outcome: row.outcome as ClaimOutcome,
    reservationId: row.reservation_id ?? null,
    usedToday: row.used_today ?? 0,
    usedPeriod: row.used_period ?? 0,
  };
}

/**
 * Hand a reservation back when the call it paid for never happened.
 *
 * Without this a provider timeout costs a learner an allowance they never spent
 * — the same defect `releaseAssessment` exists to prevent on the free path,
 * arriving by a different route. Failure here is swallowed: a leaked reservation
 * is one message of headroom, and throwing would turn a provider error into a
 * second, worse error.
 */
export async function releaseCoachTurn(supabase: Client, reservationId: string): Promise<void> {
  try {
    await supabase.rpc("coach_release", { p_reservation_id: reservationId });
  } catch {
    // Housekeeping debt, never a failed answer.
  }
}

/** Whether an outcome means "do not call the model". */
export function isCapped(outcome: ClaimOutcome): boolean {
  return outcome !== "granted";
}
