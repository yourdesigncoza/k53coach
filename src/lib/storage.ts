import type { Assessment } from "@/lib/assessment-core";
import type { ReadinessResult } from "@/lib/types";

/**
 * Client-side persistence for the anonymous readiness flow.
 *
 * Uses `localStorage` (not `sessionStorage`) so an anonymous, unregistered
 * learner keeps their readiness result across browser sessions on the same
 * device. This stays POPIA-safe: it is device-local only — nothing is sent to a
 * server or tied to a person. Server-side persistence of a learner's progress
 * still requires sign-in + consent (see `readiness_results` + RLS).
 *
 * The sitting (which questions, what they picked) lives here for the same
 * reason: the AI assessment has to be grounded in the questions they actually
 * missed, and the alternative — posting the answers to a server so the result
 * page could read them back — would be exactly the server-side record of a
 * minor's answers this flow exists to avoid.
 */
export const READINESS_RESULT_KEY = "k53.readiness.result";
export const READINESS_ASSESSMENT_KEY = "k53.readiness.assessment";

/** What the learner picked, by option TEXT — option ORDER is shuffled per
 *  sitting, so an index would mean nothing to the server. */
export interface SittingAnswer {
  id: string;
  chosen: string | null;
}

export interface ReadinessSitting {
  result: ReadinessResult;
  answers: SittingAnswer[];
  /** Signed token naming the ids this device was actually served. */
  paperToken: string | null;
}

interface StoredEnvelope extends ReadinessSitting {
  v: 2;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / quota / disabled storage — degrade gracefully.
  }
}

/** Save the whole sitting to the device. No-op if storage is unavailable. */
export function saveReadinessSitting(sitting: ReadinessSitting): void {
  write(READINESS_RESULT_KEY, { v: 2, ...sitting } satisfies StoredEnvelope);
  // A new sitting invalidates the assessment of the old one.
  try {
    localStorage.removeItem(READINESS_ASSESSMENT_KEY);
  } catch {
    /* see write() */
  }
}

/**
 * Load the last sitting, or null if there is none.
 *
 * Tolerates the v1 payload — a bare `ReadinessResult` with no sitting — because a
 * learner who took the test before this shipped still has one on their device.
 * They keep their score and simply cannot generate an assessment from it; losing
 * the score instead would be the worse trade.
 */
export function loadReadinessSitting(): ReadinessSitting | null {
  const stored = read<StoredEnvelope | ReadinessResult>(READINESS_RESULT_KEY);
  if (!stored) return null;
  if ((stored as StoredEnvelope).v === 2) {
    const envelope = stored as StoredEnvelope;
    return {
      result: envelope.result,
      answers: Array.isArray(envelope.answers) ? envelope.answers : [],
      paperToken: envelope.paperToken ?? null,
    };
  }
  const legacy = stored as ReadinessResult;
  if (typeof legacy?.overall !== "number") return null;
  return { result: legacy, answers: [], paperToken: null };
}

/** Load just the last readiness result from the device, or null. */
export function loadReadinessResult(): ReadinessResult | null {
  return loadReadinessSitting()?.result ?? null;
}

/**
 * The generated assessment, kept per locale so re-viewing the result page — or
 * switching to /af — never silently re-spends. There is no server-side cache on
 * the free path by design; this is the whole of it.
 */
export function saveReadinessAssessment(
  locale: string,
  assessment: Assessment,
): void {
  write(READINESS_ASSESSMENT_KEY, { locale, assessment });
}

export function loadReadinessAssessment(locale: string): Assessment | null {
  const stored = read<{ locale?: string; assessment?: Assessment }>(
    READINESS_ASSESSMENT_KEY,
  );
  if (!stored?.assessment || stored.locale !== locale) return null;
  // A template from a spent budget or an outage is not worth pinning to the
  // device — the next attempt may well reach the model.
  if (stored.assessment.fallback) return null;
  return stored.assessment;
}
