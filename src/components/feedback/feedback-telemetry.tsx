"use client";

import { useEffect } from "react";
import { TRAIL_LIMIT, type ClickEntry, type ErrorEntry, type FetchFailure } from "@/lib/feedback";

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
};

declare global {
  interface Window {
    __k53Telemetry?: Buffer;
  }
}

export function getTelemetry(): Buffer {
  if (typeof window === "undefined") {
    return { loadStart: 0, errors: [], fetchFailures: [], clicks: [] };
  }
  window.__k53Telemetry ??= {
    loadStart: Date.now(),
    errors: [],
    fetchFailures: [],
    clicks: [],
  };
  return window.__k53Telemetry;
}

function push<T>(arr: T[], item: T) {
  arr.push(item);
  if (arr.length > TRAIL_LIMIT) arr.shift();
}

/** First stack frame only — enough to locate, short enough to read in an issue. */
function firstFrame(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  return stack.split("\n").find((l) => l.includes("at "))?.trim();
}

/**
 * Structural selector for a click target. Text content is never read: on this
 * app the clickable text is usually an answer option or a question prompt.
 */
function describe(el: Element | null): string {
  if (!el) return "unknown";
  const parts: string[] = [el.tagName.toLowerCase()];
  if (el.id) parts.push(`#${el.id}`);
  const testId = el.getAttribute("data-testid") ?? el.getAttribute("data-slot");
  if (testId) parts.push(`[${testId}]`);
  const cls = el.getAttribute("class");
  if (cls) {
    const first = cls.split(/\s+/).filter(Boolean).slice(0, 2).join(".");
    if (first) parts.push(`.${first}`);
  }
  return parts.join("");
}

export function FeedbackTelemetry() {
  useEffect(() => {
    const buf = getTelemetry();
    const since = () => Date.now() - buf.loadStart;

    const onError = (e: ErrorEvent) => {
      push(buf.errors, {
        type: "error",
        message: e.message || String(e.error ?? "unknown"),
        at: firstFrame(e.error?.stack) ?? `${e.filename}:${e.lineno}:${e.colno}`,
        t: since(),
      });
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      push(buf.errors, {
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
    console.error = (...args: unknown[]) => {
      push(buf.errors, {
        type: "console",
        message: args
          .map((a) => (a instanceof Error ? a.message : String(a)))
          .join(" ")
          .slice(0, 500),
        t: since(),
      });
      originalConsoleError.apply(console, args);
    };

    // Record failed/slow fetches. Only the redacted URL, method, status and
    // duration — never request or response bodies, which on this app carry exam
    // answers and the learner's own progress.
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
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
          push(buf.fetchFailures, {
            url,
            method,
            status: res.status,
            ms: Date.now() - started,
            t: since(),
          });
        }
        return res;
      } catch (err) {
        push(buf.fetchFailures, {
          url,
          method,
          status: null,
          ms: Date.now() - started,
          t: since(),
        });
        throw err;
      }
    };

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener("click", onClick, true);
      console.error = originalConsoleError;
      window.fetch = originalFetch;
    };
  }, []);

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
