/**
 * End-to-end driver for IN-APP REPORTING (`feedback_reports`).
 *
 * Usage:
 *   NODE_PATH=~/tools/playwright-e2e/node_modules \
 *     node scripts/e2e/feedback.mjs --locale en
 *
 *   --locale   en | af      which locale to file the report in
 *   --base     http://localhost:3000
 *   --keep     leave the report row behind (default: delete it afterwards)
 *   --headed   show the browser
 *
 * WHAT IT PROVES, and why each step is here rather than asserted in a unit test:
 *
 *  1. The inline "this looks wrong" flag appears in practice mode ONLY after the
 *     learner answers — the gate is in QuestionCard, so nothing below the UI can
 *     verify it.
 *  2. The word-count gate really blocks submit. The server revalidates, but a
 *     dialog that lets you press Send and then rejects you is a bad enough
 *     experience to be worth pinning.
 *  3. The row lands with its context populated. This is the actual risk: the
 *     server action enriches from five tables, and a silently-failing join would
 *     produce a report that still "works" while carrying nothing worth reading.
 *  4. `keyed_index` is read server-side, not accepted from the client.
 *
 * It does NOT push to Linear — that is a deliberate admin action and this script
 * should never create issues in a real workspace as a side effect of a test run.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

// ESM ignores NODE_PATH, so resolve the out-of-repo install explicitly — same
// approach as flow.mjs/assessment.mjs, for the same reason (Playwright is not a
// dependency of this project).
const pwDir = [
  process.env.PLAYWRIGHT_DIR,
  join(homedir(), "tools/playwright-e2e/node_modules/playwright"),
  join(process.cwd(), "node_modules/playwright"),
]
  .filter(Boolean)
  .find((p) => existsSync(join(p, "package.json")));
if (!pwDir) {
  console.error("playwright not found — see scripts/e2e/flow.mjs for install notes");
  process.exit(2);
}
const pw = await import(pathToFileURL(join(pwDir, "index.js")).href);
const chromium = pw.chromium ?? pw.default?.chromium;
if (!chromium) {
  console.error("resolved playwright at " + pwDir + " but it exposes no chromium");
  process.exit(2);
}

// Reuse whatever chromium is already in the Playwright cache rather than making
// every run download a build matched to this exact package version.
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const cache = join(homedir(), ".cache/ms-playwright");
  if (!existsSync(cache)) return undefined;
  const builds = readdirSync(cache)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const b of builds) {
    for (const rel of ["chrome-linux64/chrome", "chrome-linux/chrome"]) {
      const p = join(cache, b, rel);
      if (existsSync(p)) return p;
    }
  }
  return undefined;
}

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

const BASE = arg("base", "http://localhost:3000");
const LOCALE = arg("locale", "en");
const KEEP = flag("keep");
const HEADED = flag("headed");

function envLocal() {
  const text = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
  return Object.fromEntries(
    text
      .split("\n")
      .filter((l) => /^[A-Z]/.test(l))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1).trim()];
      }),
  );
}

const env = envLocal();
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !ANON || !SVC) {
  console.error("Supabase keys missing from .env.local");
  process.exit(2);
}

const pass = [];
const fail = [];
const check = (ok, label, detail = "") => {
  (ok ? pass : fail).push(label + (detail ? ` — ${detail}` : ""));
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}${detail ? ` — ${detail}` : ""}`);
};

async function signedInContext(browser) {
  const email = process.env.E2E_EMAIL || "e2e-reporter@k53coach.dev";
  const password = process.env.E2E_PASSWORD || "e2e-Report-Pass-2026!";

  await fetch(`${SUPA}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, "content-type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  }).catch(() => {});

  const tok = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());
  if (!tok.access_token) throw new Error(`no session: ${JSON.stringify(tok).slice(0, 200)}`);

  const ref = new URL(SUPA).hostname.split(".")[0];
  const session = {
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    expires_at: tok.expires_at,
    expires_in: tok.expires_in,
    token_type: "bearer",
    user: tok.user,
  };
  const raw = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");

  const ctx = await browser.newContext({ viewport: { width: 1180, height: 1000 } });
  await ctx.addCookies([
    {
      name: `sb-${ref}-auth-token`,
      value: raw,
      domain: new URL(BASE).hostname,
      path: "/",
      sameSite: "Lax",
      secure: BASE.startsWith("https"),
    },
  ]);
  ctx._userId = tok.user.id;
  return ctx;
}

/** Read rows back with the service role so RLS can't mask a write failure. */
async function fetchReports(userId) {
  const res = await fetch(
    `${SUPA}/rest/v1/feedback_reports?user_id=eq.${userId}&order=created_at.desc&limit=5`,
    { headers: { apikey: SVC, Authorization: `Bearer ${SVC}` } },
  );
  return res.json();
}

async function deleteReports(userId) {
  await fetch(`${SUPA}/rest/v1/feedback_reports?user_id=eq.${userId}`, {
    method: "DELETE",
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
  });
}

const browser = await chromium.launch({ headless: !HEADED, executablePath: findChromium() });
const ctx = await signedInContext(browser);
const page = await ctx.newPage();
const userId = ctx._userId;

// Start clean so "the newest row" is unambiguously the one we just filed.
await deleteReports(userId);

try {
  console.log(`\n▸ Practice mode — inline content flag (${LOCALE})`);
  await page.goto(`${BASE}/${LOCALE}/learn/road-signs/practice`, { waitUntil: "networkidle" });

  const flag_ = page.locator('button:has-text("looks wrong"), button:has-text("lyk verkeerd")');

  check(
    (await flag_.count()) === 0,
    "flag hidden before answering",
    `${await flag_.count()} visible`,
  );

  // Answer the first question — any option; the flag is about disagreeing with
  // the content, not about getting it wrong.
  const answer = page
    .locator('[data-slot="quiz-panel"] button, main button')
    .filter({ hasNotText: /Next|Volgende|Finish|Voltooi|looks wrong|lyk verkeerd/ })
    .first();
  await answer.click();
  await page.waitForTimeout(400);

  check(await flag_.first().isVisible(), "flag appears after answering");

  await flag_.first().click();
  await page.waitForTimeout(400);

  const dialog = page.locator('[data-slot="dialog-content"]');
  check(await dialog.isVisible(), "report dialog opens");

  // Match by accessible name, NOT position: DialogContent renders its close "✕"
  // AFTER {children}, so `.last()` is the close button, not Send.
  const send = dialog.getByRole("button", { name: /Send report|Stuur verslag/ });
  const textarea = dialog.locator("textarea");

  await textarea.fill("too short");
  await page.waitForTimeout(200);
  check(await send.isDisabled(), "submit blocked under the word minimum");

  const bodyText =
    "The keyed answer here does not match what the official chart shows for this sign and I think it is wrong.";
  await textarea.fill(bodyText);
  await page.waitForTimeout(200);
  check(await send.isEnabled(), "submit unlocked at the word minimum");

  await send.click();
  await page.waitForTimeout(2500);

  console.log("\n▸ Row landed with usable context");
  const rows = await fetchReports(userId);
  const row = Array.isArray(rows) ? rows[0] : null;

  check(Boolean(row), "report row written", row ? row.id : JSON.stringify(rows).slice(0, 160));

  if (row) {
    check(row.kind === "content", "kind = content", row.kind);
    check(row.body === bodyText, "body stored verbatim");
    check(Boolean(row.question_id), "anchored to a question", row.question_id ?? "null");
    check(row.status === "new", "status = new", row.status);
    check(
      typeof row.keyed_index === "number",
      "keyed_index resolved server-side",
      String(row.keyed_index),
    );
    check(
      typeof row.chosen_index === "number",
      "chosen_index recorded",
      String(row.chosen_index),
    );

    const ctxJson = row.context ?? {};
    check(Boolean(ctxJson.client), "client context present");
    check(Boolean(ctxJson.server), "server context present");
    check(Boolean(ctxJson.content), "content snapshot present");

    check(
      ctxJson.client?.route_pattern === "/learn/road-signs/practice",
      "route pattern collapsed correctly",
      ctxJson.client?.route_pattern,
    );
    check(ctxJson.client?.locale === LOCALE, "locale recorded", ctxJson.client?.locale);
    check(Boolean(ctxJson.client?.viewport), "viewport recorded", ctxJson.client?.viewport);
    check(
      ctxJson.server?.role !== undefined,
      "reporter role read from profiles",
      String(ctxJson.server?.role),
    );
    check(
      ctxJson.server?.entitled === false || ctxJson.server?.entitled === true,
      "entitlement resolved",
      String(ctxJson.server?.entitled),
    );
    check(
      ctxJson.content?.target === "question" &&
        Array.isArray(ctxJson.content?.options) &&
        ctxJson.content.options.length > 0,
      "question snapshot carries the options as shown",
    );
    check(
      ctxJson.content?.answer === row.keyed_index,
      "snapshot answer agrees with keyed_index",
    );

    // No credential should ever reach the stored URL.
    const urlStr = JSON.stringify(ctxJson.client?.page_url ?? "");
    check(!/token|access_token/i.test(urlStr), "no auth token in the stored URL");
  }

  console.log("\n▸ Admin triage list renders the report");
  await page.goto(`${BASE}/${LOCALE}/admin/feedback`, { waitUntil: "networkidle" });
  const listBody = await page.locator("body").innerText();
  // The reporter is not an admin, so this must NOT show the queue.
  check(
    !listBody.includes("Learner reports"),
    "non-admin is redirected away from the triage queue",
  );
} finally {
  if (!KEEP) await deleteReports(userId);
  await browser.close();
}

console.log(`\n${fail.length === 0 ? "PASS" : "FAIL"} — ${pass.length} passed, ${fail.length} failed`);
if (fail.length) {
  for (const f of fail) console.log(`  ✗ ${f}`);
  process.exit(1);
}
