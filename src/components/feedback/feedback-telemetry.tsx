"use client";

import { useEffect } from "react";
import {
  TRAIL_LIMIT,
  describeElement,
  type ClickEntry,
  type ErrorEntry,
  type FetchFailure,
} from "@/lib/feedback";

/**
 * Ring buffers of what went wrong before the learner hit "report".
 *
 * A report filed after the fact can only ever say "it broke". The console error
 * that actually explains it happened thirty seconds earlier and is gone by then
 * — so we buffer continuously and attach the tail at submit time. This is the
 * Next equivalent of WeCoza's head-time capture script.
 *
 * Deliberately NOT an analytics pipeline: nothing is sent anywhere, ever, unless
 * a learner chooses to file a report. The buffer lives in memory, dies with the
 * page, and holds at most 10 of each entry.
 */

type Buffer = {
  loadStart: number;
  errors: ErrorEntry[];
  fetchFailures: FetchFailure[];
  clicks: ClickEntry[];
  /** Count of captures we'd call a genuine fault — drives the button's dot. */
  problems: number;
};

declare global {
  interface Window {
    __k53Telemetry?: Buffer;
  }
}

export function getTelemetry(): Buffer {
  if (typeof window === "undefined") {
    return { loadStart: 0, errors: [], fetchFailures: [], clicks: [], problems: 0 };
  }
  window.__k53Telemetry ??= {
    loadStart: Date.now(),
    errors: [],
    fetchFailures: [],
    clicks: [],
    problems: 0,
  };
  return window.__k53Telemetry;
}

/**
 * Listeners notified when something is captured, so the report button can show
 * that the page actually misbehaved instead of a decorative status dot.
 * Module-level rather than on the buffer: the buffer is serialised into reports.
 */
const listeners = new Set<() => void>();

export function onTelemetryCapture(fn: () => void): () => void {
  listeners.add(fn);
  // Block body, not a concise arrow: Set.delete returns a boolean and the
  // unsubscribe contract is () => void.
  return () => {
    listeners.delete(fn);
  };
}

/**
 * True once something has gone wrong that we'd stand behind calling a fault.
 *
 * Deliberately NOT "any non-2xx": see isRealFailure. `problems` is a separate
 * counter rather than a length check on the buffers, because the buffers hold
 * everything worth attaching to a report while this drives a user-visible claim.
 */
export function hasCapturedProblem(): boolean {
  if (typeof window === "undefined") return false;
  return (window.__k53Telemetry?.problems ?? 0) > 0;
}

function push<T>(arr: T[], item: T) {
  arr.push(item);
  if (arr.length > TRAIL_LIMIT) arr.shift();
}

/**
 * Clicks are noise; only errors and unambiguous request failures flip the dot.
 *
 * Iterate a COPY: a listener is `useSyncExternalStore`'s notify, which can
 * synchronously subscribe or unsubscribe and so mutate the Set mid-iteration.
 */
function pushNotable<T>(arr: T[], item: T) {
  push(arr, item);
  for (const fn of [...listeners]) fn();
}

/**
 * Record it, but don't claim the page is broken.
 *
 * Used for expected non-2xx responses — a 401 on a session probe, a 409 from a
 * duplicate checkout, a 404 for an optional resource. These belong in the report
 * (triage wants them) but must not turn the button red, or the signal becomes
 * noise and learners learn to ignore it.
 */
function pushQuiet<T>(arr: T[], item: T) {
  push(arr, item);
}

/**
 * Which HTTP failures actually indicate a broken page. Network errors (status
 * null) and 5xx are ours; 4xx is usually the app working as designed.
 */
function isRealFailure(status: number | null): boolean {
  return status === null || status >= 500;
}

/** First stack frame only — enough to locate, short enough to read in an issue. */
function firstFrame(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  return stack.split("\n").find((l) => l.includes("at "))?.trim();
}

const INTERACTIVE =
  "button, a, input, textarea, select, summary, [role='button'], [role='tab'], [role='option'], [role='radio']";

/**
 * Structural selector for a click target, resolved to the control the learner
 * meant to press.
 *
 * `event.target` is the deepest node under the cursor — clicking a button whose
 * label is a <span> reports the span, which tells triage nothing. Walk up to the
 * nearest interactive ancestor first, then fingerprint that.
 *
 * Fingerprinting itself lives in `describeElement` (src/lib/feedback.ts) so it
 * can be tested without a DOM.
 */
function describe(el: Element | null): string {
  if (!el) return "unknown";
  const target = el.closest?.(INTERACTIVE) ?? el;
  return describeElement(target);
}

/**
 * Install the global instrumentation exactly once, refcounted.
 *
 * `console.error` and `window.fetch` are process-wide, but a React effect is
 * instance-scoped. Two mounted instances would each capture the OTHER's wrapper
 * as its "original", and the first to unmount would restore the real function
 * out from under the second — leaving a stale wrapper installed forever once
 * both are gone, and double-recording while both live.
 *
 * Only one <FeedbackTelemetry /> is rendered today, so this is defensive rather
 * than a live bug — but it is the kind of defect that appears when someone adds
 * a second mount point and never fires visibly enough to be traced back here.
 */
let installs = 0;
let uninstall: (() => void) | null = null;

function install(): () => void {
  installs += 1;
  if (installs > 1) return teardown;

  const buf = getTelemetry();
  const since = () => Date.now() - buf.loadStart;

  const onError = (e: ErrorEvent) => {
    buf.problems += 1;
    pushNotable(buf.errors, {
      type: "error",
      message: e.message || String(e.error ?? "unknown"),
      at: firstFrame(e.error?.stack) ?? `${e.filename}:${e.lineno}:${e.colno}`,
      t: since(),
    });
  };

  const onRejection = (e: PromiseRejectionEvent) => {
    const reason = e.reason;
    buf.problems += 1;
    pushNotable(buf.errors, {
      type: "unhandledrejection",
      message: reason instanceof Error ? reason.message : String(reason),
      at: reason instanceof Error ? firstFrame(reason.stack) : undefined,
      t: since(),
    });
  };

  const onClick = (e: MouseEvent) => {
    push(buf.clicks, { selector: describe(e.target as Element), t: since() });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  document.addEventListener("click", onClick, true);

  // Wrap console.error, keeping the original behaviour intact.
  const originalConsoleError = console.error;
  const patchedConsoleError = (...args: unknown[]) => {
    buf.problems += 1;
    pushNotable(buf.errors, {
      type: "console",
      message: args
        .map((a) => (a instanceof Error ? a.message : String(a)))
        .join(" ")
        .slice(0, 500),
      t: since(),
    });
    originalConsoleError.apply(console, args);
  };
  console.error = patchedConsoleError;

  // Record failed/slow fetches. Only the redacted URL, method, status and
  // duration — never request or response bodies, which on this app carry exam
  // answers and the learner's own progress.
  const originalFetch = window.fetch;
  const patchedFetch = async (...args: Parameters<typeof fetch>) => {
    const started = Date.now();
    const [input, init] = args;
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    try {
      const res = await originalFetch(...args);
      if (!res.ok) {
        const entry = { url, method, status: res.status, ms: Date.now() - started, t: since() };
        // A 401 session probe or a 409 duplicate-checkout is the app working as
        // designed. Keep it for triage, but don't tell the learner it broke.
        if (isRealFailure(res.status)) {
          buf.problems += 1;
          pushNotable(buf.fetchFailures, entry);
        } else {
          pushQuiet(buf.fetchFailures, entry);
        }
      }
      return res;
    } catch (err) {
      buf.problems += 1;
      pushNotable(buf.fetchFailures, {
        url,
        method,
        status: null,
        ms: Date.now() - started,
        t: since(),
      });
      throw err;
    }
  };
  window.fetch = patchedFetch;

  uninstall = () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    document.removeEventListener("click", onClick, true);
    // Only restore if nobody else patched on top of us — clobbering a later
    // patch is worse than leaving ours installed for the rest of the page.
    if (console.error === patchedConsoleError) console.error = originalConsoleError;
    if (window.fetch === patchedFetch) window.fetch = originalFetch;
  };

  return teardown;
}

function teardown() {
  installs = Math.max(0, installs - 1);
  if (installs === 0 && uninstall) {
    uninstall();
    uninstall = null;
  }
}

export function FeedbackTelemetry() {
  useEffect(() => install(), []);
  return null;
}

/** Snapshot everything the browser knows, for attaching to a report. */
export function collectClientContext(locale: string) {
  const buf = getTelemetry();
  const nav = navigator as Navigator & { connection?: { effectiveType?: string } };

  return {
    page_url: window.location.href,
    locale,
    referrer: document.referrer || "",
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: `${screen.width}x${screen.height}`,
    dpr: window.devicePixelRatio || 1,
    user_agent: navigator.userAgent,
    online: navigator.onLine,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    language: navigator.language || "",
    time_on_page_s: Math.round((Date.now() - buf.loadStart) / 1000),
    scroll_y: Math.round(window.scrollY || 0),
    connection: nav.connection?.effectiveType ?? null,
    color_scheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
    errors: buf.errors,
    fetch_failures: buf.fetchFailures,
    clicks: buf.clicks,
  };
}
