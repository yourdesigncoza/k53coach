/**
 * How many mock papers we suggest a learner passes before they sit the real
 * K53 learner's licence test.
 *
 * This is advisory and always has been: nothing in the app blocks a learner
 * from booking, and nothing ever tells them they are ready. The app only
 * counts what they have passed and keeps suggesting more — see `mockAdvice`.
 */
export const SUGGESTED_PASSED_MOCKS = 3;

export interface MockAdvice {
  /** Mock papers the learner has passed, all-time. */
  passes: number;
  /** How many more we suggest, floored at 0. */
  remaining: number;
  /** Whether the suggested minimum has been reached. Never means "ready". */
  met: boolean;
}

/**
 * Advice state for a learner who has passed `passes` mock papers.
 *
 * Deliberately monotonic in `passes`: a failed paper never decrements the
 * count. A learner who passed twice and then failed has still passed twice,
 * and telling them otherwise would read as a punishment for practising.
 *
 * `met` is NOT a readiness verdict — it only says the suggested minimum is
 * behind them. The copy keyed off it still suggests more practice, because the
 * app never issues a "you are ready to book" judgement (John, 2026-08-06:
 * a verdict we issue is a verdict we own).
 */
export function mockAdvice(passes: number): MockAdvice {
  const safe = Number.isFinite(passes) ? Math.max(0, Math.floor(passes)) : 0;
  return {
    passes: safe,
    remaining: Math.max(0, SUGGESTED_PASSED_MOCKS - safe),
    met: safe >= SUGGESTED_PASSED_MOCKS,
  };
}
