/**
 * End-to-end flow runner for manual/agent-driven QA.
 *
 *   NODE_PATH=~/tools/playwright-e2e/node_modules node scripts/e2e/flow.mjs [flow ...] [--headed] [--base URL]
 *   npm run e2e            # all flows, headless
 *   npm run e2e -- readiness checkout
 *
 * WHY PLAYWRIGHT IS NOT A DEPENDENCY: this repo's test story is Node's built-in
 * runner over TypeScript (see CLAUDE.md) and adding a browser stack to
 * package.json would drag ~300 MB into every install for a tool only QA uses.
 * Playwright lives in ~/tools/playwright-e2e instead and is reached via NODE_PATH.
 * Install it with:  mkdir -p ~/tools/playwright-e2e && cd $_ && npm init -y && npm i playwright
 *
 * WHAT THIS IS FOR: driving the real flows fast enough to be worth re-running.
 * Every flow returns findings rather than throwing, so one broken screen does not
 * hide the next five. Console errors, failed requests and broken images are
 * collected globally and reported per flow.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// ESM ignores NODE_PATH, so resolve the out-of-repo install explicitly.
// PLAYWRIGHT_DIR overrides; otherwise try the conventional tools location and
// finally a normal bare import in case someone did add it to the repo.
const candidates = [
  process.env.PLAYWRIGHT_DIR,
  join(homedir(), "tools/playwright-e2e/node_modules/playwright"),
  join(process.cwd(), "node_modules/playwright"),
].filter(Boolean);
const hit = candidates.find((p) => existsSync(join(p, "package.json")));
if (!hit) {
  console.error(
    "playwright not found. Install it out of tree:\n" +
      "  mkdir -p ~/tools/playwright-e2e && cd ~/tools/playwright-e2e && npm init -y && npm i playwright\n" +
      "or point PLAYWRIGHT_DIR at an existing install.",
  );
  process.exit(2);
}
// playwright ships CJS, so an ESM import lands the whole module under `default`.
const pw = await import(pathToFileURL(join(hit, "index.js")).href);
const chromium = pw.chromium ?? pw.default?.chromium;
if (!chromium) {
  console.error("resolved playwright at " + hit + " but it exposes no chromium");
  process.exit(2);
}

const argv = process.argv.slice(2);
const HEADED = argv.includes("--headed");
const PAY = argv.includes("--pay");
const baseIdx = argv.indexOf("--base");
const BASE = baseIdx >= 0 ? argv[baseIdx + 1] : "http://localhost:3000";
const wanted = argv.filter((a) => !a.startsWith("--") && a !== BASE);

const findings = [];
const note = (flow, level, msg, detail) =>
  findings.push({ flow, level, msg, ...(detail ? { detail } : {}) });

/** Per-page collectors. Console + network noise is a finding in its own right. */
function watch(page, flow) {
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text();
      // Next dev-tools and HMR chatter are not product defects.
      if (/Download the React DevTools|\[Fast Refresh\]/.test(t)) return;
      note(flow, "console", t.slice(0, 220));
    }
  });
  page.on("requestfailed", (r) => {
    if (/analytics|vercel|fonts\.g/.test(r.url())) return;
    note(flow, "netfail", `${r.failure()?.errorText} ${r.url().slice(0, 140)}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && !r.url().includes("/_next/")) {
      note(flow, "http", `${r.status()} ${r.url().slice(0, 140)}`);
    }
  });
}

async function brokenImages(page, flow) {
  const bad = await page.evaluate(() =>
    Array.from(document.images)
      .filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src)
      .slice(0, 10),
  );
  bad.forEach((src) => note(flow, "image", `broken image: ${src.slice(0, 130)}`));
}

/** Answer whatever question is on screen; returns false when none is left. */
async function answerOne(page) {
  const opts = page.locator('button:has(> :text-matches("^[ABC]$"))');
  const n = await opts.count();
  for (let k = 0; k < n; k++) {
    if (await opts.nth(k).isEnabled()) {
      await opts.nth(k).click();
      return true;
    }
  }
  return false;
}

async function advance(page) {
  // Anchored: an ANSWER option once read "Stop and allow them to finish crossing",
  // which a loose /Finish/ matched, so .first() picked a disabled option button and
  // the run looked like the test could not be completed. Match the whole label.
  const NEXT = /^(Next question|See my readiness score|See my score|See result|Finish|Submit)$/i;
  const next = page.getByRole("button", { name: NEXT });
  if (!(await next.count())) return false;
  // The coach card renders after the answer; the button enables with it.
  try {
    await next.first().waitFor({ state: "visible", timeout: 3000 });
    await page.waitForFunction(
      () => {
        const b = [...document.querySelectorAll("button")].find((x) =>
          /^(Next question|See my readiness score|See my score|See result|Finish|Submit)$/i.test(
            (x.textContent || "").trim(),
          ),
        );
        return b && !b.disabled;
      },
      { timeout: 4000 },
    );
  } catch {
    return false;
  }
  await next.first().click();
  return true;
}


/**
 * Sign in as the e2e buyer by minting a Supabase session with the service-role key
 * and injecting the @supabase/ssr cookie. The app's own auth screen is magic-link
 * only, so there is no password form to drive; this is the supported way to get a
 * server-rendered session in a headless run.
 *
 * Reads .env.local itself so the runner needs no shell preamble. Returns null when
 * the keys are absent, and the flows that need auth then skip rather than fail.
 */
async function signedInContext(browser) {
  const envText = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
  const env = Object.fromEntries(
    envText.split("\n").filter((l) => /^[A-Z]/.test(l)).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim()];
    }),
  );
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const svc = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !svc) return null;

  const email = process.env.E2E_EMAIL || "e2e-buyer@k53coach.dev";
  const password = process.env.E2E_PASSWORD || "e2e-Sandbox-Pass-2026!";
  const j = (r) => r.json();
  // Create on demand; an existing user just 422s and we sign in below.
  await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: svc, Authorization: `Bearer ${svc}`, "content-type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  }).catch(() => {});
  const tok = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then(j);
  if (!tok.access_token) return null;

  const ref = new URL(url).hostname.split(".")[0];
  const session = {
    access_token: tok.access_token, refresh_token: tok.refresh_token,
    expires_at: tok.expires_at, expires_in: tok.expires_in,
    token_type: "bearer", user: tok.user,
  };
  const raw = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // Cookie domain has to track --base, or a run against the deployed site silently
  // sends no session and every authed flow reports "needs_auth".
  const host = new URL(BASE).hostname;
  const secure = BASE.startsWith("https");
  await ctx.addCookies([
    { name: `sb-${ref}-auth-token`, value: raw, domain: host, path: "/", sameSite: "Lax", secure },
  ]);
  ctx._userId = tok.user.id;
  return ctx;
}

const flows = {};

flows.landing = async (page) => {
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  if (!/readiness/i.test(body)) note("landing", "fail", "no readiness CTA on landing");
  // Claims that have to stay true as the library changes.
  const m = body.match(/(\d[\d,]*)\s*\+?\s*road signs/i);
  if (m) note("landing", "claim", `landing claims "${m[0]}" — verify against served count`);
  if (/checked against the official DoT chart/i.test(body))
    note("landing", "claim", '"Every sign checked against the official DoT chart"');
  const five = /5 questions/i.test(body);
  await page.goto(`${BASE}/en/readiness`, { waitUntil: "domcontentloaded" });
  const rBody = await page.locator("body").innerText();
  const fifteen = /15-question|15 question/i.test(rBody);
  if (five && fifteen)
    note("landing", "fail", 'landing promises "5 questions" but the test is 15');
  await brokenImages(page, "landing");
};

flows.readiness = async (page) => {
  await page.goto(`${BASE}/en/readiness`, { waitUntil: "domcontentloaded" });
  let i = 0;
  for (; i < 30; i++) {
    if (!(await answerOne(page))) break;
    // Learner-facing prose must not read like a regulation (CLAUDE.md constraint 10).
    const coach = page.locator("text=Coach Says").locator("xpath=..");
    if (await coach.count()) {
      const t = await coach.first().innerText().catch(() => "");
      const legal = t.match(/\b(regulation|reg\.?)\s*\d+|section\s*\d+|schedule\s*\d/i);
      if (legal)
        note("readiness", "voice", `regulation-speak shown to learner: "${legal[0]}"`, t.slice(0, 160));
    }
    // Only the FINAL button navigates. Waiting for the result URL after every
    // question burned 4s x 14 on timeouts and made a 5s run look like a 60s one.
    const wasLast = await page
      .getByRole("button", { name: /^See my readiness score$/i })
      .count()
      .then((n) => n > 0)
      .catch(() => false);
    if (!(await advance(page))) break;
    if (wasLast) {
      await page
        .waitForURL(/\/readiness\/result/, { timeout: 8000 })
        .catch(() => page.waitForTimeout(300));
    } else {
      await page.waitForTimeout(120);
    }
    if (/\/result/.test(page.url())) break;
  }
  note("readiness", "info", `answered ${i} questions, ended at ${page.url().replace(BASE, "")}`);
  if (!/\/result/.test(page.url()))
    note("readiness", "fail", `did not reach result after ${i} questions`);
  else {
    // The score is client-rendered from localStorage, so assert on the rendered
    // value rather than whatever is in the DOM the instant the URL changes.
    const scored = await page
      .waitForFunction(() => /\d+\s*%/.test(document.body.innerText), { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    const t = await page.locator("body").innerText();
    if (!scored) note("readiness", "fail", `result page shows no score :: ${t.replace(/\s+/g, " ").slice(0, 140)}`);
    else {
      const pct = (t.match(/(\d+)\s*%/) || [])[0];
      const band = (t.match(/Not ready yet|Almost there|Ready/i) || [])[0];
      note("readiness", "info", `result rendered: ${pct} ${band || ""}`);
      const stored = await page.evaluate(() => localStorage.getItem("k53.readiness.result"));
      if (!stored) note("readiness", "fail", "result not persisted to localStorage");
    }
  }
  await brokenImages(page, "readiness");
};

flows.paywall = async (page) => {
  await page.goto(`${BASE}/en/paywall`, { waitUntil: "networkidle" });
  const t = await page.locator("body").innerText();
  if (!/R\s?\d/.test(t)) note("paywall", "fail", "no price rendered on paywall");
  const buy = page.getByRole("button", { name: /unlock|pay|buy|checkout/i });
  note("paywall", "info", `purchase buttons found: ${await buy.count()}`);
  await brokenImages(page, "paywall");
};

flows.learn = async (page) => {
  for (const path of ["/en/learn/road-signs", "/en/learn/rules", "/en/learn/controls"]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const links = await page.locator(`a[href*="${path.split("/").pop()}/"]`).count();
    note("learn", "info", `${path} → ${links} item links`);
    if (links === 0) note("learn", "fail", `${path} lists nothing`);
    await brokenImages(page, "learn");
    const first = page.locator(`a[href*="${path.split("/").pop()}/"]`).first();
    if (await first.count()) {
      await first.click();
      await page.waitForLoadState("networkidle");
      const t = await page.locator("body").innerText();
      if (t.trim().length < 200) note("learn", "fail", `${page.url()} detail looks empty`);
      await brokenImages(page, "learn");
    }
  }
};

flows.mock = async (page) => {
  await page.goto(`${BASE}/en/mock`, { waitUntil: "networkidle" });
  const t = await page.locator("body").innerText();
  const gated = /unlock|paywall|R\s?\d|sign in|log in/i.test(t);
  note("mock", gated ? "info" : "fail", gated ? "mock is gated as expected" : "MOCK NOT GATED for anonymous user");
};

flows.checkout = async (page, ctx) => {
  const res = await page.request.post(`${BASE}/api/pay/payfast/checkout`, {
    headers: { "content-type": "application/json" }, data: {},
  });
  note("checkout", "info", `POST /api/pay/payfast/checkout → ${res.status()}`);
  if (res.status() === 401) {
    note("checkout", "fail", "no session — auth helper did not attach a cookie");
    return;
  }
  if (res.status() === 409) {
    note("checkout", "info", "already entitled (409) — nothing to buy, flow ends here");
    return;
  }
  if (res.status() !== 200) {
    note("checkout", "fail", `unexpected status ${res.status()}: ${(await res.text()).slice(0, 140)}`);
    return;
  }
  const j = await res.json();
  const f = Object.fromEntries(j.fields);
  if (!/sandbox/.test(j.url)) note("checkout", "fail", `NOT sandbox: ${j.url}`);
  if (!f.signature) note("checkout", "fail", "signed request has no signature");
  note("checkout", "info", `merchant ${f.merchant_id} · R${f.amount} · ${j.url}`);
  if (/localhost/.test(f.notify_url))
    note("checkout", "info", `notify_url is ${f.notify_url} — PayFast cannot reach it, so no ITN locally`);

  if (!PAY) {
    note("checkout", "info", "stopping before payment (pass --pay to complete a sandbox payment)");
    return;
  }
  // Submit from a blank document — injecting into the paywall lets React re-render
  // and wipe the form before it submits.
  const html =
    `<html><body><form id=f method=POST action="${j.url}">` +
    j.fields.map(([k, v]) => `<input type=hidden name="${k}" value="${String(v).replace(/"/g, "&quot;")}">`).join("") +
    `</form><script>document.getElementById('f').submit()</script></body></html>`;
  await page.setContent(html);
  await page.waitForURL(/payfast\.co\.za/, { timeout: 25000 });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2500);
  if (!/\/eng\/process\/payment\//.test(page.url())) {
    note("checkout", "fail", `gateway did not accept the signed request: ${page.url()}`);
    note("checkout", "info", (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 200));
    return;
  }
  note("checkout", "info", "gateway ACCEPTED the signature (engine page reached)");
  const btn = page.getByRole("button", { name: /Complete Payment/i });
  if (!(await btn.count())) { note("checkout", "fail", "no Complete Payment button"); return; }
  await btn.first().click();
  await page.waitForTimeout(10000);
  const done = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  note("checkout", /successful/i.test(done) ? "info" : "fail",
    /successful/i.test(done) ? "sandbox payment COMPLETED" : `payment did not complete: ${done.slice(0, 160)}`);
  note("checkout", "info", `m_payment_id ${f.m_payment_id} — check entitlements to confirm the ITN landed`);
};

flows.af = async (page) => {
  await page.goto(`${BASE}/af`, { waitUntil: "networkidle" });
  const t = await page.locator("body").innerText();
  if (t.length < 400) note("af", "fail", "af landing looks empty");
  note("af", "info", `af landing ok (${t.length} chars)`);
  await brokenImages(page, "af");
};

const ORDER = ["landing", "readiness", "paywall", "learn", "mock", "checkout", "af"];
const run = wanted.length ? wanted : ORDER;

// Reuse whatever chromium is already in the Playwright cache rather than making
// every run download a build matched to this exact package version.
// CHROMIUM_PATH overrides.
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

const executablePath = findChromium();
const browser = await chromium.launch({ headless: !HEADED, executablePath });
for (const name of run) {
  if (!flows[name]) {
    note(name, "fail", "unknown flow");
    continue;
  }
  const needsAuth = name === "checkout";
  const ctx =
    (needsAuth ? await signedInContext(browser) : null) ??
    (await browser.newContext({ viewport: { width: 1280, height: 900 } }));
  if (needsAuth && !ctx._userId) note(name, "info", "running unauthenticated (no Supabase keys)");
  const page = await ctx.newPage();
  watch(page, name);
  const t0 = Date.now();
  try {
    await flows[name](page, ctx);
    note(name, "info", `flow ok in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e) {
    note(name, "fail", `threw: ${String(e).split("\n")[0].slice(0, 180)}`);
  }
  await ctx.close();
}
await browser.close();

const order = { fail: 0, http: 1, netfail: 2, image: 3, voice: 4, claim: 5, console: 6, info: 7 };
findings.sort((a, b) => (order[a.level] ?? 9) - (order[b.level] ?? 9));
const counts = findings.reduce((a, f) => ((a[f.level] = (a[f.level] || 0) + 1), a), {});
console.log(`\n=== e2e ${BASE} — flows: ${run.join(", ")} ===`);
console.log(Object.entries(counts).map(([k, v]) => `${k}:${v}`).join("  "), "\n");
for (const f of findings) {
  console.log(`[${f.level.toUpperCase().padEnd(7)}] ${f.flow.padEnd(10)} ${f.msg}`);
  if (f.detail) console.log(`            ↳ ${f.detail.replace(/\s+/g, " ").slice(0, 170)}`);
}
process.exit(findings.some((f) => f.level === "fail") ? 1 : 0);
