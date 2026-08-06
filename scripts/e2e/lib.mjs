/**
 * Shared plumbing for the e2e drivers (`flow`, `assessment`, `feedback`,
 * `regression`).
 *
 * Every driver needs the same four things — an out-of-tree Playwright, a
 * chromium binary from the shared cache, the Supabase keys out of `.env.local`,
 * and a signed-in browser context minted with the service role. Each script had
 * grown its own copy, so a fix to one (the cookie domain having to track
 * `--base`, for instance) reached only the script it was made in.
 *
 * WHY PLAYWRIGHT IS NOT A DEPENDENCY: this repo's test story is Node's built-in
 * runner over TypeScript (see CLAUDE.md) and adding a browser stack to
 * package.json would drag ~300 MB into every install for a tool only QA uses.
 * Playwright lives in ~/tools/playwright-e2e instead. Install it with:
 *   mkdir -p ~/tools/playwright-e2e && cd $_ && npm init -y && npm i playwright
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// ── playwright resolution ─────────────────────────────────────────────────────

/**
 * ESM ignores NODE_PATH, so the out-of-repo install has to be resolved by path.
 * PLAYWRIGHT_DIR overrides; otherwise the conventional tools location, then a
 * normal in-repo node_modules in case someone did add it as a dependency.
 */
function resolvePlaywrightDir() {
  return [
    process.env.PLAYWRIGHT_DIR,
    join(homedir(), "tools/playwright-e2e/node_modules/playwright"),
    join(process.cwd(), "node_modules/playwright"),
  ]
    .filter(Boolean)
    .find((p) => existsSync(join(p, "package.json")));
}

const pwDir = resolvePlaywrightDir();
if (!pwDir) {
  console.error(
    "playwright not found. Install it out of tree:\n" +
      "  mkdir -p ~/tools/playwright-e2e && cd ~/tools/playwright-e2e && npm init -y && npm i playwright\n" +
      "or point PLAYWRIGHT_DIR at an existing install.",
  );
  process.exit(2);
}

// playwright ships CJS, so an ESM import lands the whole module under `default`.
const pw = await import(pathToFileURL(join(pwDir, "index.js")).href);
export const chromium = pw.chromium ?? pw.default?.chromium;
if (!chromium) {
  console.error("resolved playwright at " + pwDir + " but it exposes no chromium");
  process.exit(2);
}

/**
 * Reuse whatever chromium is already in the Playwright cache rather than making
 * every run download a build matched to this exact package version.
 */
export function findChromium() {
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

/** Launch with the cached binary and the headed/headless choice in one place. */
export function launch({ headed = false, slowMo = 0, args } = {}) {
  return chromium.launch({
    headless: !headed,
    slowMo,
    executablePath: findChromium(),
    ...(args ? { args } : {}),
  });
}

// ── argv ──────────────────────────────────────────────────────────────────────

export const argv = process.argv.slice(2);

/** `--name value`, with a default. A following `--flag` does not count as a value. */
export function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
}

export function flag(name) {
  return argv.includes(`--${name}`);
}

// ── env ───────────────────────────────────────────────────────────────────────

/** Parse `.env.local` so a driver needs no shell preamble. */
export function envLocal() {
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

/** Supabase keys, or nulls when the app is running in demo mode. */
export function supabaseKeys() {
  const env = envLocal();
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    anon: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null,
    service: env.SUPABASE_SERVICE_ROLE_KEY ?? null,
  };
}

// ── auth ──────────────────────────────────────────────────────────────────────

/**
 * Sign in by minting a Supabase session with the service-role key and injecting
 * the @supabase/ssr cookie. The app's auth screen is magic-link only, so there
 * is no password form to drive; this is the supported way to get a
 * server-rendered session in a headless run.
 *
 * The user is created on demand (an existing one just 422s and we sign in
 * below), so a driver can use a dedicated account without any setup step.
 *
 * Returns null when the keys are absent so callers can skip rather than fail.
 * The cookie domain tracks `base`, or a run against a deployed site silently
 * sends no session and every authed assertion reports "not signed in".
 */
export async function signedInContext(browser, { base, email, password, viewport } = {}) {
  const { url, anon, service } = supabaseKeys();
  if (!url || !anon || !service) return null;

  await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  }).catch(() => {});

  const tok = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());
  if (!tok.access_token) return null;

  const ref = new URL(url).hostname.split(".")[0];
  const session = {
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    expires_at: tok.expires_at,
    expires_in: tok.expires_in,
    token_type: "bearer",
    user: tok.user,
  };
  const raw = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");

  const ctx = await browser.newContext({
    viewport: viewport ?? { width: 1280, height: 900 },
  });
  await ctx.addCookies([
    {
      name: `sb-${ref}-auth-token`,
      value: raw,
      domain: new URL(base).hostname,
      path: "/",
      sameSite: "Lax",
      secure: base.startsWith("https"),
    },
  ]);
  ctx._userId = tok.user.id;
  ctx._email = email;
  return ctx;
}

// ── PostgREST with the service role ───────────────────────────────────────────

/**
 * Read/write rows with the service role, so RLS cannot mask a failure the test
 * is trying to see. Every driver that seeds or cleans up fixtures needs this.
 */
export async function rest(path, { method = "GET", body, prefer } = {}) {
  const { url, service } = supabaseKeys();
  if (!url || !service) throw new Error("Supabase service key missing from .env.local");
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "content-type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

// ── assertions ────────────────────────────────────────────────────────────────

/**
 * Findings-style checker: nothing throws, so one broken screen does not hide the
 * next five. `report()` prints the tally and returns the exit code.
 */
export function makeChecks() {
  const pass = [];
  const fail = [];
  const check = (ok, label, detail = "") => {
    (ok ? pass : fail).push(label + (detail ? ` — ${detail}` : ""));
    console.log(`${ok ? "  ✓" : "  ✗"} ${label}${detail ? ` — ${detail}` : ""}`);
    return Boolean(ok);
  };
  const report = () => {
    console.log(
      `\n${fail.length === 0 ? "PASS" : "FAIL"} — ${pass.length} passed, ${fail.length} failed`,
    );
    for (const f of fail) console.log(`  ✗ ${f}`);
    return fail.length === 0 ? 0 : 1;
  };
  return { check, report, pass, fail };
}
