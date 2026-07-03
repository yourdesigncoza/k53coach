import type { ReadinessResult } from "@/lib/types";

/**
 * Client-side persistence for the anonymous readiness flow.
 *
 * Uses `localStorage` (not `sessionStorage`) so an anonymous, unregistered
 * learner keeps their readiness result across browser sessions on the same
 * device. This stays POPIA-safe: it is device-local only — nothing is sent to a
 * server or tied to a person. Server-side persistence of a learner's progress
 * still requires sign-in + consent (see `readiness_results` + RLS).
 */
export const READINESS_RESULT_KEY = "k53.readiness.result";

/** Save the readiness result to the device. No-op if storage is unavailable. */
export function saveReadinessResult(result: ReadinessResult): void {
  try {
    localStorage.setItem(READINESS_RESULT_KEY, JSON.stringify(result));
  } catch {
    // Private mode / quota / disabled storage — degrade gracefully.
  }
}

/** Load the last readiness result from the device, or null if none/invalid. */
export function loadReadinessResult(): ReadinessResult | null {
  try {
    const raw = localStorage.getItem(READINESS_RESULT_KEY);
    return raw ? (JSON.parse(raw) as ReadinessResult) : null;
  } catch {
    return null;
  }
}
