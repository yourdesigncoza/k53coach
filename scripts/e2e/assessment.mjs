/**
 * Headed end-to-end driver for the POST-EXAM AI COACHING ASSESSMENT — the only
 * runtime AI surface a learner can reach (`/api/exam/assess`).
 *
 * Usage:
 *   NODE_PATH=~/tools/playwright-e2e/node_modules \
 *     node scripts/e2e/assessment.mjs --profile weak --locale en
 *
 *   --profile  weak | strong | mixed | cache | fallback
 *   --locale   en | af
 *   --base     http://localhost:3000
 *   --attempt  <uuid>   (cache profile: re-open an existing attempt)
 *   --hold     keep the browser open after the assessment renders (for review)
 *
 * WHY IT DRIVES THE REAL PAPER: the assessment is grounded in the misses of the
 * sitting, so a seeded attempt would not exercise `buildAssessmentPayload`
 * against real question text. This clicks all 64 questions like a learner.
 *
 * HOW IT KNOWS THE CORRECT ANSWER: the runner persists the assembled paper to
 * localStorage (`k53.exam.draft`) so a refresh does not lose an hour's sitting —
 * and scoring is client-side, so the paper on the client necessarily carries the
 * answer index. We read it to plan a target score per section, then click.
 * Option order is already shuffled at assembly, so the draft's index matches the
 * on-screen A/B/C order.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

// ESM ignores NODE_PATH, so resolve the out-of-repo install explicitly — same
// approach as flow.mjs, for the same reason (Playwright is not a dependency).
const pwDir = [
  process.env.PLAYWRIGHT_DIR,
  join(homedir(), "tools/playwright-e2e/node_modules/playwright"),
  join(process.cwd(), "node_modules/playwright"),
].filter(Boolean).find((p) => existsSync(join(p, "package.json")));
if (!pwDir) {
  console.error("playwright not found — see scripts/e2e/flow.mjs for install notes");
  process.exit(2);
}
const pw = await import(pathToFileURL(join(pwDir, "index.js")).href);
const chromium = pw.chromium ?? pw.default?.chromium;

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

const BASE = arg("base", "http://localhost:3000");
const PROFILE = arg("profile", "weak");
const LOCALE = arg("locale", "en");
const ATTEMPT = arg("attempt", null);
const HOLD = flag("hold");
const OUT = arg("out", "/tmp/claude-1000/-home-laudes-zoot-projects-k53coach/7a566566-947d-43c9-bdc5-6146d10e8bf7/scratchpad/assessment");

mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);

/**
 * Target correct-answers per section for each profile. Pass marks (EXAM_FORMAT_B):
 * rules 22/30, signs 22/28, controls 5/6 — every section must pass independently.
 */
const PROFILES = {
  weak:   { rules: 12, signs: 9,  controls: 2 },  // fails all three
  strong: { rules: 28, signs: 26, controls: 6 },  // passes comfortably
  mixed:  { rules: 25, signs: 14, controls: 6 },  // signs fails, the rest pass
};

// ── auth ──────────────────────────────────────────────────────────────────────

function envLocal() {
  const text = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
  return Object.fromEntries(
    text.split("\n").filter((l) => /^[A-Z]/.test(l)).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim()];
    }),
  );
}

/**
 * Mint a Supabase session for the e2e buyer (who holds the live PayFast
 * entitlement from the 2026-08-03 ITN run) and inject the @supabase/ssr cookie.
 * The app's auth screen is magic-link only, so there is no password form.
 */
async function signedInContext(browser) {
  const env = envLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const svc = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !svc) throw new Error("Supabase keys missing from .env.local");

  const email = process.env.E2E_EMAIL || "e2e-buyer@k53coach.dev";
  const password = process.env.E2E_PASSWORD || "e2e-Sandbox-Pass-2026!";
  await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: svc, Authorization: `Bearer ${svc}`, "content-type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  }).catch(() => {});
  const tok = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());
  if (!tok.access_token) throw new Error(`no session: ${JSON.stringify(tok).slice(0, 200)}`);

  const ref = new URL(url).hostname.split(".")[0];
  const session = {
    access_token: tok.access_token, refresh_token: tok.refresh_token,
    expires_at: tok.expires_at, expires_in: tok.expires_in,
    token_type: "bearer", user: tok.user,
  };
  const raw = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 1000 } });
  await ctx.addCookies([{
    name: `sb-${ref}-auth-token`, value: raw,
    domain: new URL(BASE).hostname, path: "/", sameSite: "Lax",
    secure: BASE.startsWith("https"),
  }]);
  ctx._userId = tok.user.id;
  return ctx;
}

// ── answer planning ───────────────────────────────────────────────────────────

/**
 * Decide, per question id, whether to answer correctly. Wrong answers are spread
 * evenly through the section rather than clumped at the end, so the misses the
 * model sees span the whole topic (a clump would make the payload look like the
 * learner ran out of time, which is a different failure to coach).
 */
function planAnswers(paper, targets) {
  const plan = {};
  for (const sec of paper.sections) {
    const qs = sec.questions;
    const want = Math.min(targets[sec.topic] ?? 0, qs.length);
    const wrong = qs.length - want;
    // Every `step`-th question is answered wrong.
    const step = wrong > 0 ? qs.length / wrong : Infinity;
    let placed = 0;
    qs.forEach((q, i) => {
      const shouldBeWrong = placed < wrong && Math.floor(i / step) >= placed;
      if (shouldBeWrong) placed++;
      plan[q.id] = { correct: !shouldBeWrong, answer: q.answer, topic: sec.topic };
    });
    // Rounding can leave one short; fix the tail.
    let short = wrong - placed;
    for (let i = qs.length - 1; i >= 0 && short > 0; i--) {
      if (plan[qs[i].id].correct) { plan[qs[i].id].correct = false; short--; }
    }
  }
  return plan;
}

// ── the sitting ───────────────────────────────────────────────────────────────

async function sitExam(page, targets) {
  log(`→ ${BASE}/${LOCALE}/mock`);
  await page.goto(`${BASE}/${LOCALE}/mock`, { waitUntil: "networkidle" });

  const body = await page.locator("body").innerText();
  if (/unlock|R\s?179/i.test(body) && !/start|begin|Begin/i.test(body)) {
    throw new Error(`paywalled — the e2e buyer's entitlement is not active:\n${body.slice(0, 200)}`);
  }

  // Start the paper (the first primary button on the start screen).
  const startBtn = page.locator("button").filter({ hasText: /start|begin|Begin|Begin die|Begin toets/i }).first();
  await startBtn.click();
  await page.waitForURL(/\/mock\/exam/, { timeout: 15000 });

  // The runner writes the assembled paper to localStorage on mount.
  await page.waitForFunction(() => !!localStorage.getItem("k53.exam.draft"), { timeout: 20000 });
  const draft = JSON.parse(await page.evaluate(() => localStorage.getItem("k53.exam.draft")));
  const paper = draft.paper;
  const total = paper.sections.reduce((n, s) => n + s.questions.length, 0);
  log(`paper: ${total} questions — ` +
      paper.sections.map((s) => `${s.topic} ${s.questions.length} (pass ${s.passRequired})`).join(" · ") +
      (paper.shortened ? "  ⚠ SHORTENED" : ""));

  const plan = planAnswers(paper, targets);
  const flat = paper.sections.flatMap((s) => s.questions.map((q) => ({ q, topic: s.topic })));

  let answered = 0;
  for (let i = 0; i < flat.length; i++) {
    // Section intro screens sit between sections.
    const begin = page.locator("button").filter({ hasText: /^(Begin section|Begin afdeling)$/i });
    if (await begin.count()) { await begin.first().click(); await page.waitForTimeout(120); }

    const opts = page.locator('button:has(> span:text-matches("^[ABC]$"))');
    await opts.first().waitFor({ state: "visible", timeout: 10000 });

    // Anchor on the on-screen prompt rather than trusting our own pointer.
    const prompt = (await page.locator("h1").first().innerText()).trim();
    const item = flat[i].q.prompt.trim() === prompt
      ? flat[i]
      : flat.find((f) => f.q.prompt.trim() === prompt) ?? flat[i];

    const p = plan[item.q.id];
    const n = await opts.count();
    const pick = p.correct ? p.answer : (p.answer + 1) % n;
    await opts.nth(pick).click();
    answered++;

    const next = page.locator("button").filter({
      hasText: /^(Next|Review & submit|Volgende|Hersien|Hersien & dien in)$/i,
    });
    await next.first().click();
    await page.waitForTimeout(90);
  }
  log(`answered ${answered}/${total}`);

  // Confirm & submit.
  const submit = page.locator("button").filter({ hasText: /^(Submit exam|Dien eksamen in)$/i });
  await submit.first().waitFor({ state: "visible", timeout: 10000 });
  await submit.first().click();
  await page.waitForURL(/\/mock\/result\//, { timeout: 30000 });
  const attemptId = page.url().split("/mock/result/")[1].split(/[?#]/)[0];
  log(`submitted → attempt ${attemptId}`);
  return attemptId;
}

// ── the assessment ────────────────────────────────────────────────────────────

async function generateAssessment(page, tag) {
  let apiPayload = null;
  let apiStatus = null;
  let apiMs = null;
  const started = Date.now();
  page.on("response", async (res) => {
    if (res.url().includes("/api/exam/assess")) {
      apiStatus = res.status();
      apiMs = Date.now() - started;
      try { apiPayload = await res.json(); } catch { /* non-JSON error body */ }
    }
  });

  await page.waitForTimeout(600);
  // Match on the shared stem so one regex covers en ("View AI Assessment") and
  // af ("Bekyk KI-assessering") without depending on the AI/KI abbreviation.
  const cta = page.locator("button").filter({ hasText: /assessment|assessering/i });
  if (await cta.count()) {
    log(`clicking the AI assessment CTA: "${(await cta.first().innerText()).trim()}"`);
    await cta.first().click();
  } else {
    log("no CTA — assessment already cached on this attempt, rendering from the server");
  }

  // The verdict lands in a CoachCard; wait for the plan heading, the last block.
  await page.locator("text=/Your plan|Jou plan/i").first()
    .waitFor({ state: "visible", timeout: 90000 });
  await page.waitForTimeout(400);

  const shot = join(OUT, `${tag}.png`);
  await page.screenshot({ path: shot, fullPage: true });

  // Two <main> elements on the result page (app shell + page); the inner one is
  // the result content.
  const text = (await page.locator("main").last().innerText()).replace(/\n{3,}/g, "\n\n");
  writeFileSync(join(OUT, `${tag}.txt`), text);
  if (apiPayload) writeFileSync(join(OUT, `${tag}.json`), JSON.stringify(apiPayload, null, 2));

  log("");
  log(`── API ─────────────────────────────────────────────`);
  log(`status ${apiStatus ?? "(not called — server-rendered cache)"}  ${apiMs ? apiMs + "ms" : ""}`);
  if (apiPayload?.assessment) {
    log(`model: ${apiPayload.assessment.model}  cached: ${apiPayload.cached}  fallback: ${!!apiPayload.assessment.fallback}`);
  }
  log(`── RENDERED ────────────────────────────────────────`);
  log(text);
  log(`────────────────────────────────────────────────────`);
  log(`screenshot: ${shot}`);
  return { apiPayload, apiStatus, text, shot };
}

// ── chromium discovery (reuse the cached build; no per-version download) ──────

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

// ── main ──────────────────────────────────────────────────────────────────────

const browser = await chromium.launch({
  headless: false,
  slowMo: 40,
  executablePath: findChromium(),
  args: ["--window-size=1200,1020"],
});
const ctx = await signedInContext(browser);
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") log(`  [console] ${m.text().slice(0, 160)}`); });

const tag = `${PROFILE}-${LOCALE}`;
try {
  if (PROFILE === "cache") {
    if (!ATTEMPT) throw new Error("--attempt <uuid> required for the cache profile");
    log(`re-opening ${BASE}/${LOCALE}/mock/result/${ATTEMPT}`);
    await page.goto(`${BASE}/${LOCALE}/mock/result/${ATTEMPT}`, { waitUntil: "networkidle" });
    await generateAssessment(page, tag);
  } else {
    const targets = PROFILES[PROFILE];
    if (!targets) throw new Error(`unknown profile ${PROFILE}`);
    log(`profile ${PROFILE}: target correct — ` +
        Object.entries(targets).map(([k, v]) => `${k} ${v}`).join(" · "));
    const attemptId = await sitExam(page, targets);
    await generateAssessment(page, tag);
    log(`ATTEMPT_ID=${attemptId}`);
  }
  if (HOLD) {
    log("\nbrowser held open for review — kill this process to close it.");
    await new Promise(() => {});
  }
} catch (err) {
  log(`FAILED: ${err.message}`);
  try { await page.screenshot({ path: join(OUT, `${tag}-failure.png`), fullPage: true }); } catch {}
  if (HOLD) await new Promise(() => {});
  process.exitCode = 1;
} finally {
  if (!HOLD) await browser.close();
}
