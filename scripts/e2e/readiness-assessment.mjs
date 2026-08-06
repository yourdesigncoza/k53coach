/**
 * e2e driver — the free readiness AI assessment (AP-09).
 *
 * Sits the free five-question test as an ANONYMOUS visitor (no sign-in: that is
 * the whole point of this surface), then generates the assessment on the result
 * page and checks what a real learner would see.
 *
 * Why it drives the browser rather than posting to the route: the parts most
 * likely to break are the seams between them — the signed paper token minted on
 * `/readiness`, the sitting stored on the device, and the option ORDER, which is
 * shuffled per sitting so a client-side index means nothing server-side. Posting
 * a hand-built body would exercise none of that.
 *
 * How it knows the answers: it reads the curated readiness pool with the service
 * role and matches on prompt text. It never reads them out of the page, so a bug
 * that leaks answers into the DOM cannot make this driver pass.
 *
 *   node scripts/e2e/readiness-assessment.mjs                     # all profiles, en
 *   node scripts/e2e/readiness-assessment.mjs --profile 0of5 --locale af --headed
 */
import { createHash } from "node:crypto";
import { arg, flag, launch, makeChecks, rest } from "./lib.mjs";

const BASE = arg("base", "http://localhost:3000");
const LOCALE = arg("locale", "en");
const HEADED = flag("headed");
const ONLY = arg("profile", null);
/** `--expect model` / `--expect template` turns the path taken into a check. */
const EXPECT = arg("expect", null);
/** Print the assessment a learner would read — the grounding check is a human one. */
const DUMP = flag("dump");

/** How many of the five to get right. */
const PROFILES = { "0of5": 0, "1of5": 1, "3of5": 3, "5of5": 5 };

const { check, report } = makeChecks();

/** prompt → { correct, wrong } option TEXT, straight from the curated pool. */
async function answerKey() {
  const rows = await rest(
    "questions?select=prompt,options,answer&review_status=eq.approved&in_readiness=is.true",
  );
  return new Map(
    rows.map((r) => [
      r.prompt.trim(),
      {
        correct: r.options[r.answer],
        wrong: r.options.find((_, i) => i !== r.answer),
      },
    ]),
  );
}

async function runProfile(browser, name, correctTarget, key) {
  console.log(`\n── ${name} (${correctTarget}/5 correct, /${LOCALE}) ─────────────`);
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1000 } });
  const page = await ctx.newPage();

  // Count only the calls this feature makes, so "re-viewing costs nothing" is
  // measured rather than assumed.
  let assessCalls = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/readiness/assess")) assessCalls += 1;
  });

  await page.goto(`${BASE}/${LOCALE}/readiness`, { waitUntil: "networkidle" });

  let correctSoFar = 0;
  for (let i = 0; i < 8; i++) {
    // The question's own h1 is the last one on the page (the first is the page
    // title). Match it against the pool rather than reading anything the page
    // might leak about which option is right.
    const prompt = (
      (await page.locator("main h1").last().textContent()) ?? ""
    ).trim();
    const row = key.get(prompt);
    if (!row) {
      check(false, `${name}: prompt not found in the curated pool`, prompt.slice(0, 60));
      break;
    }

    const wantCorrect = correctSoFar < correctTarget;
    const wanted = wantCorrect ? row.correct : row.wrong;

    // Each option button renders a letter badge before its text, so match on
    // the text it contains and click by position.
    const buttons = page.locator("main button");
    const texts = await buttons.allTextContents();
    const index = texts.findIndex((t) => t.trim().endsWith(wanted.trim()));
    if (index < 0) {
      check(false, `${name}: option not on screen`, wanted.slice(0, 50));
      break;
    }
    await buttons.nth(index).click();
    if (wantCorrect) correctSoFar += 1;

    await buttons.last().click(); // Next question / Finish
    await page.waitForTimeout(300);
    if (page.url().includes("/readiness/result")) break;
  }

  const onResult = page.url().includes("/readiness/result");
  check(onResult, `${name}: reached the result page`, page.url().replace(BASE, ""));
  if (!onResult) {
    await ctx.close();
    return;
  }

  // The sitting must be on the device — v2, with the signed token.
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("k53.readiness.result") ?? "null"),
  );
  check(stored?.v === 2, `${name}: sitting stored as v2`);
  check(
    typeof stored?.paperToken === "string" && stored.paperToken.includes("."),
    `${name}: signed paper token persisted`,
  );
  check(
    Array.isArray(stored?.answers) && stored.answers.length > 0,
    `${name}: answers recorded as option text`,
    JSON.stringify(stored?.answers?.[0] ?? null).slice(0, 80),
  );

  // Generate.
  const cta = page.getByRole("button").filter({ hasText: /assess|assesser/i }).first();
  check(await cta.count(), `${name}: assessment CTA present`);
  if (!(await cta.count())) {
    await ctx.close();
    return;
  }
  const started = Date.now();
  await cta.click();
  await page
    .locator("ol li")
    .first()
    .waitFor({ timeout: 45_000 })
    .catch(() => {});
  const ms = Date.now() - started;

  const body = (await page.locator("main").textContent()) ?? "";

  // Which path actually ran. Both are valid states, so this is reported rather
  // than asserted — but a run that never reaches the model has not tested the
  // model, and a green board must not be read as if it had. `--expect model`
  // turns it into a check once the grants table exists.
  const isTemplate = /Based on your section scores|Gebaseer op jou afdelingtellings/i.test(
    body,
  );
  const path = isTemplate ? "template" : "model";
  if (EXPECT) check(path === EXPECT, `${name}: took the ${EXPECT} path`, path);
  else console.log(`  · ${name}: path taken — ${path}`);

  if (DUMP) {
    // No assertion can tell grounded prose from a confident invention. Print it
    // so a human reads what a learner would actually be told.
    const cards = await page.locator("main > section > div.text-left").first().innerText();
    console.log("\n" + cards.replace(/^/gm, "    ") + "\n");
  }

  const planSteps = await page.locator("ol li").count();
  check(planSteps >= 1 && planSteps <= 2, `${name}: plan is 1-2 steps`, `${planSteps}`);
  check(assessCalls === 1, `${name}: exactly one API call`, `${assessCalls}, ${ms}ms`);

  // A free learner cannot reach /mock, so no plan step may point there.
  const hrefs = await page.locator("ol li a").evaluateAll((els) =>
    els.map((e) => e.getAttribute("href")),
  );
  check(
    hrefs.every((h) => h && !h.includes("/mock")),
    `${name}: no plan step points at the paid mock`,
    hrefs.join(" "),
  );

  // Never certify, whatever the score.
  check(
    !/\byou'?re ready\b|\bbook (your|the) test\b|\bgo book\b/i.test(body),
    `${name}: does not tell the learner they are ready`,
  );

  if (correctTarget === 5) {
    // A clean sample must not manufacture a weakness to fill the slot.
    const focusHeading = await page
      .getByText(/Where the marks are going|Waar die punte verlore gaan/i)
      .count();
    check(focusHeading === 0, `${name}: clean sample shows no invented weakness`);
  }

  if (LOCALE === "af") {
    // Match common Afrikaans function words, NOT the fallback's own phrasing:
    // an earlier version looked for "Leer →" and so only ever passed on the
    // template, failing every model-written assessment for being fluent.
    check(
      /\b(jou|jy|nie|moet|oefen)\b/i.test(body),
      `${name}: Afrikaans prose, not English inside Afrikaans chrome`,
    );
    // "Afrikaans is present" is too weak a test: a single English sentence can
    // ride along inside an otherwise Afrikaans assessment. It did — the prompt
    // used to hand the model the literal phrase "review the {section} module",
    // which it copied verbatim into /af.
    const englishLeak = body.match(
      /\b(Review the|Work through|Practice →|Learn →|You got \d|Keep it sharp)\b/,
    );
    check(
      !englishLeak,
      `${name}: no English sentence leaked into the Afrikaans prose`,
      englishLeak?.[0] ?? "",
    );
  }

  // Re-view must not re-spend.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const afterReload = await page.locator("ol li").count();
  check(
    assessCalls === 1,
    `${name}: reload made no second API call`,
    `${assessCalls} total`,
  );
  void afterReload;

  // Hand the day's budget back. A grant row is anonymous by design, so the only
  // way the driver can identify its own is by hashing the token it was served —
  // the same hash the route stores. Without this, a few full runs eat a
  // meaningful slice of the 400/day learners are meant to get.
  if (stored?.paperToken && path === "model") {
    const hash = createHash("sha256").update(stored.paperToken).digest("hex");
    await rest(`readiness_assessment_grants?token_hash=eq.${hash}`, {
      method: "DELETE",
    }).catch(() => {});
  }

  await ctx.close();
}

const browser = await launch({ headed: HEADED, slowMo: HEADED ? 120 : 0 });
try {
  const key = await answerKey();
  console.log(`answer key: ${key.size} curated readiness questions`);
  for (const [name, correct] of Object.entries(PROFILES)) {
    if (ONLY && ONLY !== name) continue;
    await runProfile(browser, name, correct, key);
  }
} finally {
  await browser.close();
}
process.exit(report());
