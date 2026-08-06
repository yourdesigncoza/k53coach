/**
 * In-app reporting (DB: `feedback_reports`).
 *
 * Two kinds share one queue:
 *  - `bug`     — "this screen is broken", raised from the FAB in the app shell.
 *  - `content` — "this answer looks wrong", raised inline against a specific
 *                question or sign. This is the one that earns its keep: the whole
 *                moat is content accuracy, and a learner who just sat the item is
 *                the cheapest detector we have for a mis-keyed answer.
 *
 * This module is pure — types, limits, word counting and redaction. No I/O, so
 * it is testable under `node --test` without a database. The server actions in
 * `feedback-actions.ts` do the writing.
 */

export type ReportKind = "bug" | "content";
export type ReportStatus = "new" | "pushed" | "resolved" | "dismissed";
export type ReportPriority = "urgent" | "high" | "medium" | "low";

/**
 * Ten words, same bar WeCoza's widget uses. Not arbitrary: "it's broken" is a
 * report nobody can act on, and the cost of a useless report is a triage slot,
 * which is the scarce resource here.
 */
export const MIN_WORDS = 10;
export const MAX_BODY_CHARS = 4000;

/**
 * Courtesy guard, not a spam defence — every row is attributable to a signed-in
 * user, so abuse is a moderation problem, not an infrastructure one. This exists
 * to stop a stuck submit button filing forty identical reports.
 */
export const MAX_REPORTS_PER_HOUR = 10;

/** How many buffered client signals of each type ride along with a report. */
export const TRAIL_LIMIT = 10;

// ── Client-collected context ────────────────────────────────────────────────

export type ErrorEntry = {
  /** "error" | "unhandledrejection" | "console" */
  type: string;
  message: string;
  /** First stack frame only — enough to locate, short enough to read. */
  at?: string;
  /** ms since page load */
  t: number;
};

export type FetchFailure = {
  /** Redacted: pathname plus param KEYS, never param values. */
  url: string;
  method: string;
  status: number | null;
  ms: number;
  t: number;
};

export type ClickEntry = {
  /** Structural selector only — never the element's text. */
  selector: string;
  t: number;
};

export type ClientContext = {
  page_url: string;
  route_pattern: string;
  locale: string;
  referrer: string;
  viewport: string;
  screen: string;
  dpr: number;
  user_agent: string;
  online: boolean;
  timezone: string;
  language: string;
  time_on_page_s: number;
  scroll_y: number;
  /** navigator.connection.effectiveType — "4g" / "3g" / "slow-2g". Matters on SA mobile. */
  connection: string | null;
  color_scheme: string;
  app_version: string;
  errors: ErrorEntry[];
  fetch_failures: FetchFailure[];
  clicks: ClickEntry[];
};

// ── Server-side enrichment ──────────────────────────────────────────────────

/**
 * Facts the client cannot forge, resolved from the session at insert time. A
 * report that says "I'd paid and it still locked me out" is worth very little
 * until you can see the entitlement row for yourself.
 */
export type ServerContext = {
  role: string | null;
  entitled: boolean;
  entitlement_expires_at: string | null;
  last_exam_attempt: {
    id: string;
    overall: number | null;
    passed: boolean | null;
    finished_at: string | null;
  } | null;
  readiness: number | null;
  attempts_total: number;
};

/**
 * Provenance of the flagged item, snapshotted at report time.
 *
 * Snapshotted, not looked up later, and deliberately so: if the answer is
 * corrected next week, the report must still show what the learner actually
 * saw. A report that silently re-reads current state stops being evidence the
 * moment somebody acts on it.
 */
export type QuestionSnapshot = {
  target: "question";
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  objective_code: string | null;
  sign_code: string | null;
  review_status: string;
  source_citation: string | null;
  source_basis: string | null;
  approved_by: string | null;
  verified_at: string | null;
  in_exam: boolean;
  vehicle_codes: string[];
};

export type SignSnapshot = {
  target: "sign";
  code: string;
  name: string;
  category: string;
  review_status: string;
  asset_status: string;
  sa_relevant: boolean | null;
  approved_by: string | null;
  verified_at: string | null;
  svg_file: string | null;
  /** True when the lesson body is empty in BOTH locales — the IN11.x defect. */
  empty_content: boolean;
};

export type ContentSnapshot = QuestionSnapshot | SignSnapshot;

export type ReportContext = {
  client: ClientContext;
  server: ServerContext;
  content?: ContentSnapshot;
};

// ── Validation ──────────────────────────────────────────────────────────────

/** Whitespace-split word count, matching the live counter in the dialog. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/).length;
}

export type ValidationError = "empty" | "too_short" | "too_long";
export type ValidationResult = { ok: true } | { ok: false; error: ValidationError };

export function validateBody(text: string): ValidationResult {
  const words = countWords(text);
  if (words === 0) return { ok: false, error: "empty" };
  if (words < MIN_WORDS) return { ok: false, error: "too_short" };
  if (text.length > MAX_BODY_CHARS) return { ok: false, error: "too_long" };
  return { ok: true };
}

// ── Redaction ───────────────────────────────────────────────────────────────

/**
 * Query params whose VALUES never travel with a report.
 *
 * Login here is magic-link-only, so an auth callback genuinely does carry a
 * usable token in the URL — a learner who hits "report" on a half-loaded
 * callback page would otherwise post their own session credential into a
 * Linear issue that an external collaborator can read.
 */
const SENSITIVE_PARAMS = new Set([
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
  "provider_token",
  "code",
  "key",
  "apikey",
  "api_key",
  "secret",
  "password",
  "email",
  "signature",
]);

/**
 * Keep the path and the shape of the query; drop sensitive values. Param keys
 * are kept because "there was a `?retry=` on the URL" is often the whole bug,
 * and a key name is not a credential.
 */
export function redactUrl(raw: string): string {
  if (!raw) return "";
  let u: URL;
  try {
    u = new URL(raw, "http://local");
  } catch {
    return "[unparseable]";
  }
  const params = new URLSearchParams(u.search);
  for (const key of [...params.keys()]) {
    if (SENSITIVE_PARAMS.has(key.toLowerCase())) params.set(key, "[redacted]");
  }
  u.search = params.toString();
  // A fragment can carry the same tokens as the query (Supabase implicit flow
  // puts them there), and nothing in triage has ever needed one.
  u.hash = "";
  return u.origin === "http://local" ? u.pathname + u.search : u.toString();
}

/**
 * Collapse a concrete path to its route pattern so reports group by screen
 * rather than by which sign was open: /en/learn/road-signs/R1 → /learn/road-signs/[code].
 */
export function routePattern(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  // Drop the locale prefix — it is recorded separately.
  if (segments[0] === "en" || segments[0] === "af") segments.shift();

  const out = segments.map((seg, i) => {
    const prev = segments[i - 1];
    if (prev === "road-signs" && seg !== "practice") return "[code]";
    if ((prev === "rules" || prev === "controls") && seg !== "practice") return "[code]";
    if (prev === "result") return "[attemptId]";
    if (prev === "questions" || prev === "signs") return "[id]";
    // Bare uuids anywhere else.
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(seg)) return "[id]";
    return seg;
  });
  return "/" + out.join("/");
}

/** Truncate without splitting a surrogate pair, and mark that we did. */
export function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  return [...text].slice(0, max).join("") + "…";
}

/**
 * Utility classes shared by so many elements that they identify nothing.
 *
 * The first real report exposed why this matters: every `Button` in the app
 * serialised to `button[button].group/button.inline-flex`, because cva emits its
 * shared base first and the old code took the first two classes. Two different
 * buttons produced byte-identical selectors, so a trail could not answer the one
 * question it exists for — WHICH control did they press.
 */
const UBIQUITOUS_CLASS =
  /^(group|inline-flex|flex|grid|block|inline|shrink|grow|items-|justify-|gap-|w-full|min-w|max-w|whitespace|transition|outline|select-|relative|absolute|overflow|cursor|pointer-events|field-sizing)/;

/** Minimal shape of a DOM element, so this stays testable without a DOM. */
export type DescribableElement = {
  tagName: string;
  getAttribute(name: string): string | null;
};

/**
 * Structural fingerprint of a click target.
 *
 * Text content is deliberately excluded — on this app the clickable text is
 * often the learner's answer choice or a question prompt, and `aria-label` is
 * excluded for the same reason (`SignImage` sets it to the sign's name). Only
 * machine identifiers and distinguishing classes go in.
 *
 * Classes are taken from the TAIL, not the head: `cn(base, variants, className)`
 * puts the shared base first and the caller's overrides last, so the end of the
 * list is where the difference between two buttons actually lives.
 */
export function describeElement(el: DescribableElement | null): string {
  if (!el) return "unknown";
  const tag = el.tagName.toLowerCase();
  const parts: string[] = [tag];

  const attr = (n: string) => el.getAttribute(n) || "";

  const id = attr("id");
  if (id) parts.push(`#${id}`);

  // data-slot is the shadcn primitive marker; it is frequently just the tag
  // name ("button" on a <button>), which adds no information at all.
  const testId = attr("data-testid");
  const slot = attr("data-slot");
  if (testId) parts.push(`[${testId}]`);
  else if (slot && slot !== tag) parts.push(`[${slot}]`);

  const type = attr("type");
  if (type) parts.push(`[type=${type}]`);
  const name = attr("name");
  if (name) parts.push(`[name=${name}]`);
  const href = attr("href");
  if (href) parts.push(`[href=${redactUrl(href)}]`);

  const classes = attr("class")
    .split(/\s+/)
    .filter(Boolean)
    .filter((c) => !UBIQUITOUS_CLASS.test(c));
  const distinguishing = classes.slice(-3);
  if (distinguishing.length) parts.push("." + distinguishing.join("."));

  return clamp(parts.join(""), 120);
}

/**
 * Strip a click target down to its structure. Text content is deliberately
 * excluded: on this app the clickable text is often the learner's own answer
 * choice or a question prompt, and neither belongs in a bug report.
 */
export function redactClicks(clicks: ClickEntry[]): ClickEntry[] {
  return clicks.slice(-TRAIL_LIMIT).map((c) => ({
    selector: clamp(c.selector, 120),
    t: c.t,
  }));
}

export function redactErrors(errors: ErrorEntry[]): ErrorEntry[] {
  return errors.slice(-TRAIL_LIMIT).map((e) => ({
    type: e.type,
    message: clamp(e.message, 500),
    at: e.at ? clamp(e.at, 200) : undefined,
    t: e.t,
  }));
}

export function redactFetchFailures(failures: FetchFailure[]): FetchFailure[] {
  return failures.slice(-TRAIL_LIMIT).map((f) => ({
    url: clamp(redactUrl(f.url), 300),
    method: f.method,
    status: f.status,
    ms: f.ms,
    t: f.t,
  }));
}

/**
 * Full sanitising pass over whatever the browser posted.
 *
 * The client payload is attacker-controlled — a server action's arguments always
 * are — so nothing from it reaches the database unclamped. Sizes are bounded
 * here rather than in the DB because a jsonb column will happily store a
 * megabyte of junk.
 */
export function sanitiseClientContext(raw: Partial<ClientContext>): ClientContext {
  const pageUrl = redactUrl(String(raw.page_url ?? ""));
  let pathname = "/";
  try {
    pathname = new URL(pageUrl, "http://local").pathname;
  } catch {
    /* keep default */
  }

  return {
    page_url: clamp(pageUrl, 500),
    route_pattern: clamp(String(raw.route_pattern || routePattern(pathname)), 200),
    locale: clamp(String(raw.locale ?? ""), 10),
    referrer: clamp(redactUrl(String(raw.referrer ?? "")), 300),
    viewport: clamp(String(raw.viewport ?? ""), 20),
    screen: clamp(String(raw.screen ?? ""), 20),
    dpr: Number(raw.dpr) || 1,
    user_agent: clamp(String(raw.user_agent ?? ""), 400),
    online: raw.online !== false,
    timezone: clamp(String(raw.timezone ?? ""), 60),
    language: clamp(String(raw.language ?? ""), 20),
    time_on_page_s: Math.max(0, Math.round(Number(raw.time_on_page_s) || 0)),
    scroll_y: Math.max(0, Math.round(Number(raw.scroll_y) || 0)),
    connection: raw.connection ? clamp(String(raw.connection), 20) : null,
    color_scheme: clamp(String(raw.color_scheme ?? ""), 20),
    app_version: clamp(String(raw.app_version ?? ""), 60),
    errors: redactErrors(Array.isArray(raw.errors) ? raw.errors : []),
    fetch_failures: redactFetchFailures(
      Array.isArray(raw.fetch_failures) ? raw.fetch_failures : [],
    ),
    clicks: redactClicks(Array.isArray(raw.clicks) ? raw.clicks : []),
  };
}

// ── Display helpers (shared by the admin list and the Linear adapter) ────────

/** Short human label for a report, used in the triage list and as a fallback title. */
export function reportLabel(r: {
  kind: ReportKind;
  question_id: string | null;
  sign_code: string | null;
  body: string;
}): string {
  if (r.kind === "content") {
    const anchor = r.question_id ?? r.sign_code ?? "unknown";
    return `Content flagged: ${anchor}`;
  }
  return clamp(r.body.replace(/\s+/g, " ").trim(), 60);
}

/**
 * Reports older than this with no triage decision are the ones that quietly rot.
 * Surfaced in the admin list rather than enforced anywhere.
 */
export const STALE_AFTER_DAYS = 7;

export function isStale(status: ReportStatus, createdAt: string, now: number): boolean {
  if (status !== "new") return false;
  const age = now - new Date(createdAt).getTime();
  return age > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Stamp `stale` onto a page of rows, reading the clock exactly once.
 *
 * `isStale` takes `now` so it stays pure and testable; this is the one place
 * that reads the clock, and it lives outside any component — calling `Date.now()`
 * during render is impure and would hydrate differently from the server pass.
 */
export function markStale<T extends { status: string; created_at: string }>(
  rows: T[],
): Array<T & { stale: boolean }> {
  const now = Date.now();
  return rows.map((r) => ({
    ...r,
    stale: isStale(r.status as ReportStatus, r.created_at, now),
  }));
}
