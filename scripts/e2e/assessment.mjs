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
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { arg, flag, launch, signedInContext as signIn } from "./lib.mjs";

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

/**
 * Sign in as the e2e buyer (who holds the live PayFast entitlement from the
 * 2026-08-03 ITN run). The session mechanics live in ./lib.mjs — the app's auth
 * screen is magic-link only, so there is no password form to drive.
 */
async function signedInContext(browser) {
  const ctx = await signIn(browser, {
    base: BASE,
    email: process.env.E2E_EMAIL || "e2e-buyer@k53coach.dev",
    password: process.env.E2E_PASSWORD || "e2e-Sandbox-Pass-2026!",
    viewport: { width: 1180, height: 1000 },
  });
  if (!ctx) throw new Error("could not mint a session — check .env.local");
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

// ── main ──────────────────────────────────────────────────────────────────────

const browser = await launch({
  headed: true, // this driver exists to be watched
  slowMo: 40,
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
