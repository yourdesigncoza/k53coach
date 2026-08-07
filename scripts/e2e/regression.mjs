/**
 * Front-end regression driver for the 2026-08-06 changes.
 *
 * Usage:
 *   node scripts/e2e/regression.mjs --headed
 *   node scripts/e2e/regression.mjs readiness mock --headed --base http://localhost:3000
 *
 *   sections   readiness | mock | feedback | admin | af   (default: all)
 *              the admin section needs E2E_ADMIN_PASSWORD in the environment
 *              and skips without it — see ADMIN below
 *   --headed   show the browser
 *   --slow     ms of slowMo, for watching a headed run (default 0)
 *   --keep     leave seeded fixture rows behind (default: clean up)
 *
 * WHAT IT PINS, commit by commit — all of it behaviour that only exists once a
 * page is rendered, which is why none of it is reachable from a unit test:
 *
 *  df40be1 / b3f3791 / 7e27dd8 — a learner with no history must never be shown a
 *    score they did not earn. The old code fell back to a hardcoded 62 on the
 *    dashboard and to { signs: 78, rules: 48, controls: 60 } on progress, both
 *    rendered exactly like real data. The gauge still draws (as a full circle at
 *    0%) so the card keeps its shape — so "no number anywhere" is not the
 *    assertion; "no number that isn't 0, and the 0 is labelled as not measured"
 *    is. Both directions are checked: seeded real data must still render.
 *
 *  3e22fdf — the app suggests three passed mocks and never certifies readiness.
 *    Checked as copy present AND as certification language absent.
 *
 *  8fb9406 — the forward-only rule is on the start screen, before the paper.
 *
 *  3633cc8 / 288f35a — the report control is a labelled pill (not a bare glyph),
 *    its dot is green until the page actually faults, and the click trail that
 *    ships with a report identifies WHICH control was pressed.
 *
 *  336d39c / a34db7b — admins reach the report queue from any admin page and see
 *    the untriaged count; a non-admin is turned away from the detail page by the
 *    page's own guard, not by the layout.
 *
 *  0631ecc — the Afrikaans claims repair, asserted against SERVED HTML. The
 *    `ui_translations` table overrides messages/af.json at request time, so a
 *    file-level check proves nothing about what a learner reads.
 *
 * FIXTURES: seeds and cleans up its own rows against the LIVE database, all of
 * them confined to the dedicated e2e users below. It never touches another
 * user's rows and never pushes anything to Linear.
 */
import {
  arg,
  argv,
  flag,
  launch,
  makeChecks,
  rest,
  signedInContext,
  supabaseKeys,
} from "./lib.mjs";

const BASE = arg("base", "http://localhost:3000");
const HEADED = flag("headed");
const SLOW = Number(arg("slow", HEADED ? "120" : "0"));
const KEEP = flag("keep");

const ALL = ["readiness", "mock", "feedback", "admin", "af"];
const wanted = argv.filter((a) => ALL.includes(a));
const sections = wanted.length ? wanted : ALL;

// A learner with deliberately nothing recorded — the state every honesty check
// below is about. Separate from the e2e buyer, whose fixture attempts would
// make "no score yet" untestable.
const BLANK = {
  email: process.env.E2E_BLANK_EMAIL || "e2e-blank@k53coach.dev",
  password: process.env.E2E_BLANK_PASSWORD || "e2e-Blank-Pass-2026!",
};
/**
 * The admin section signs in as a REAL privileged account on the live database,
 * so its password is never defaulted here — supply it per run:
 *
 *   E2E_ADMIN_PASSWORD=… node scripts/e2e/regression.mjs admin
 *
 * Without it the section is skipped rather than silently passing on a page a
 * non-admin would also see.
 */
const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || "agent@k53coach.dev",
  password: process.env.E2E_ADMIN_PASSWORD,
};

const { url: SUPA } = supabaseKeys();
if (!SUPA) {
  console.error("Supabase keys missing from .env.local — this driver needs the live DB");
  process.exit(2);
}

const { check, report } = makeChecks();
const text = (page) => page.locator("body").innerText();

/** Every learner-owned row we may have seeded, newest-first cleanup order. */
async function wipeLearner(userId) {
  for (const t of [
    "feedback_reports",
    "attempts",
    "exam_attempts",
    "readiness_results",
    "entitlements",
  ]) {
    await rest(`${t}?user_id=eq.${userId}`, { method: "DELETE" }).catch(() => {});
  }
}

/** Attributes of the readiness gauge's drawn arc, or null when no gauge is on screen. */
function gaugeState(page) {
  return page.evaluate(() => {
    const arc = [...document.querySelectorAll("svg circle")].find((c) =>
      c.getAttribute("stroke-dasharray"),
    );
    if (!arc) return null;
    const centre = arc.closest("div")?.querySelector(".text-4xl");
    return {
      dashoffset: Number(arc.getAttribute("stroke-dashoffset")),
      dasharray: Number(arc.getAttribute("stroke-dasharray")),
      centre: centre?.textContent?.trim() ?? null,
    };
  });
}

/**
 * The three per-topic figures on /progress, read out of the topic cards rather
 * than off the whole page — the em dash also appears in body copy, so counting
 * dashes in `innerText` would pass on a page that shows fabricated numbers.
 */
function topicPercents(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-slot="card-content"] .tabular-nums')].map((e) =>
      (e.textContent || "").trim(),
    ),
  );
}

const browser = await launch({ headed: HEADED, slowMo: SLOW });

try {
  // ── the not-yet-measured learner ───────────────────────────────────────────
  if (sections.includes("readiness")) try {
    console.log("\n▸ readiness — a learner is never shown a score they didn't earn");
    const ctx = await signedInContext(browser, { base: BASE, ...BLANK });
    if (!ctx) {
      check(false, "signed in as the blank learner");
    } else {
      const page = await ctx.newPage();
      const uid = ctx._userId;
      await wipeLearner(uid);

      await page.goto(`${BASE}/en/dashboard`, { waitUntil: "networkidle" });
      let body = await text(page);

      check(body.includes("No score yet"), "dashboard says no score yet");
      check(
        !/\b62\s*%/.test(body),
        "the hardcoded 62% fallback is gone",
        body.match(/\b\d{1,3}\s*%/)?.[0] ?? "no percentage on the page",
      );
      check(
        !/weakest topic/i.test(body),
        "no fabricated weakest-topic diagnosis",
      );
      // Located by tag+text, not by role: Base UI's Button stamps role="button"
      // onto the anchor it renders, so getByRole("link") finds nothing here.
      const cta = page.locator('a:has-text("Take the readiness test")');
      const hasCta = check((await cta.count()) > 0, "empty state offers the readiness test");
      check(
        hasCta && (await cta.first().getAttribute("href"))?.includes("/readiness") === true,
        "…and it points at /readiness",
      );

      const gauge = await gaugeState(page);
      check(Boolean(gauge), "gauge is still drawn in the empty state");
      check(gauge?.dashoffset === 0, "gauge draws a complete circle", `offset ${gauge?.dashoffset}`);
      check(gauge?.centre === "0%", "gauge centre reads 0%", gauge?.centre ?? "absent");

      await page.goto(`${BASE}/en/progress`, { waitUntil: "networkidle" });
      body = await text(page);
      check(body.includes("No progress yet"), "progress says no progress yet");
      check(
        !/\b(78|48|60)\s*%/.test(body),
        "the sample topic dataset is gone",
        body.match(/\b\d{1,3}\s*%/)?.[0] ?? "no percentage on the page",
      );
      const empties = await topicPercents(page);
      check(
        empties.length === 3 && empties.every((v) => v === "—"),
        "all three topics read “—”",
        empties.join(" ") || "no topic cards",
      );

      // The other direction: real rows must still render as real numbers, or
      // "show nothing" would pass by breaking the page for everyone.
      console.log("\n▸ readiness — seeded real data still renders");
      await rest("readiness_results", {
        method: "POST",
        body: [
          {
            user_id: uid,
            overall: 81,
            band: "almost-ready",
            by_topic: [{ topic: "signs", correct: 3, total: 4, percent: 75 }],
          },
        ],
      });
      const signQ = await rest("questions?topic=eq.signs&review_status=eq.approved&select=id&limit=4");
      await rest("attempts", {
        method: "POST",
        body: signQ.map((q, i) => ({
          user_id: uid,
          question_id: q.id,
          topic: "signs",
          chosen_index: 0,
          correct: i < 3, // 3 of 4 → 75%
        })),
      });

      await page.goto(`${BASE}/en/dashboard`, { waitUntil: "networkidle" });
      const measured = await gaugeState(page);
      check(measured?.centre === "81%", "dashboard shows the real snapshot", measured?.centre ?? "absent");
      check(
        (measured?.dashoffset ?? 0) > 0,
        "measured gauge draws a partial arc, not a full circle",
        `offset ${measured?.dashoffset}`,
      );

      await page.goto(`${BASE}/en/progress`, { waitUntil: "networkidle" });
      body = await text(page);
      const measuredTopics = await topicPercents(page);
      check(
        measuredTopics.includes("75%"),
        "progress shows 75% for the answered topic",
        measuredTopics.join(" "),
      );
      check(
        !body.includes("No progress yet"),
        "…and drops the empty-state copy once there is data",
      );
      check(
        measuredTopics.filter((v) => v === "—").length === 2,
        "unanswered topics still read “—” rather than 0%",
        measuredTopics.join(" "),
      );

      if (!KEEP) await wipeLearner(uid);
      await ctx.close();
    }
  } catch (e) {
    check(false, "the readiness section ran to completion", String(e).split("\n")[0].slice(0, 140));
  }

  // ── mock start screen + the standing advice ────────────────────────────────
  if (sections.includes("mock")) try {
    console.log("\n▸ mock — forward-only rule up front, three-pass advice, no certification");
    const ctx = await signedInContext(browser, { base: BASE, ...BLANK });
    if (!ctx) {
      check(false, "signed in as the blank learner");
    } else {
      const page = await ctx.newPage();
      const uid = ctx._userId;

      // /mock is entitlement-gated; grant a short-lived one rather than
      // borrowing the buyer's real PayFast entitlement.
      await rest("entitlements?user_id=eq." + uid, { method: "DELETE" }).catch(() => {});
      await rest("entitlements", {
        method: "POST",
        body: [
          {
            user_id: uid,
            // `source` is constrained to admin/payfast/yoco — an e2e-only value
            // is rejected by the check constraint, so mark it in `reference`.
            source: "admin",
            reference: `e2e-regression-${Date.now()}`,
            expires_at: new Date(Date.now() + 3600_000).toISOString(),
          },
        ],
      });

      await page.goto(`${BASE}/en/mock`, { waitUntil: "networkidle" });
      const body = await text(page);

      check(!/\/paywall|\/auth/.test(page.url()), "entitled learner reaches /mock", page.url());
      check(
        /you cannot return to it/i.test(body),
        "start screen warns the paper is forward-only",
      );
      check(/cannot skip ahead/i.test(body), "…and that skipping ahead is impossible");
      check(
        !/You can change an answer until you move to the next question\./i.test(body),
        "the old, weaker rule copy is gone",
      );
      check(
        /The real test works the same way/i.test(body),
        "the rule is justified by the real test, not asserted",
      );

      // The advice note: same component on three surfaces, so a drift here is a
      // drift everywhere.
      await page.goto(`${BASE}/en/dashboard`, { waitUntil: "networkidle" });
      const dash = await text(page);
      check(/Before you book the real test/i.test(dash), "dashboard carries the mock advice");
      check(
        /passed 0 of the 3 mock exams we suggest/i.test(dash),
        "advice counts this learner's passes (0 of 3)",
      );
      check(/3 to go/i.test(dash), "…and says how many are left");
      check(
        !/(you are ready|you're ready|ready to book|test ready)/i.test(dash),
        "dashboard never certifies the learner as ready",
      );

      await page.goto(`${BASE}/en/progress`, { waitUntil: "networkidle" });
      const prog = await text(page);
      check(
        /Before you book the real test/i.test(prog),
        "progress carries the same advice note",
      );
      check(
        !/(you are ready|you're ready|ready to book|test ready)/i.test(prog),
        "progress never certifies the learner as ready",
      );

      if (!KEEP) await wipeLearner(uid);
      await ctx.close();
    }
  } catch (e) {
    check(false, "the mock section ran to completion", String(e).split("\n")[0].slice(0, 140));
  }

  // ── the report control ─────────────────────────────────────────────────────
  if (sections.includes("feedback")) try {
    console.log("\n▸ feedback — findable pill, honest dot, a click trail worth reading");
    const ctx = await signedInContext(browser, { base: BASE, ...BLANK });
    if (!ctx) {
      check(false, "signed in as the blank learner");
    } else {
      const page = await ctx.newPage();
      const uid = ctx._userId;
      await rest(`feedback_reports?user_id=eq.${uid}`, { method: "DELETE" }).catch(() => {});

      await page.goto(`${BASE}/en/dashboard`, { waitUntil: "networkidle" });
      const fab = page.locator('button[aria-label^="Report a bug"]');
      check((await fab.count()) === 1, "report control is on the app shell");
      check(
        ((await fab.first().innerText()) || "").includes("Report a bug"),
        "…as a labelled pill, not a bare glyph",
      );
      const box = await fab.first().boundingBox();
      check((box?.width ?? 0) > 90, "…wide enough to read as a button", `${box?.width}px`);

      const dotColour = () =>
        page.evaluate(() => {
          const el = document.querySelector(
            'button[aria-label^="Report a bug"] span[aria-hidden="true"]',
          );
          return el ? getComputedStyle(el).backgroundColor : null;
        });
      const resting = await dotColour();
      const problems = await page.evaluate(() => window.__k53Telemetry?.problems ?? 0);
      check(problems === 0, "nothing captured on a clean page load", `${problems} problems`);
      check(Boolean(resting), "status dot rendered", resting ?? "absent");

      // Flip it with a real window error rather than by poking the buffer: the
      // claim under test is that the dot answers "did this page fault".
      await page.evaluate(() =>
        window.dispatchEvent(
          new ErrorEvent("error", { message: "e2e synthetic fault", filename: "e2e", lineno: 1 }),
        ),
      );
      await page.waitForTimeout(300);
      const flagged = await dotColour();
      check(flagged !== resting, "dot changes once the page actually faults", `${resting} → ${flagged}`);
      check(
        ((await fab.first().getAttribute("aria-label")) || "").includes("Something went wrong"),
        "…and the change reaches the accessible name",
      );

      // File a real report so the click trail can be read back off the row.
      await fab.first().click();
      const dialog = page.locator('[data-slot="dialog-content"]');
      await dialog.waitFor({ state: "visible", timeout: 5000 });
      const textarea = dialog.locator("textarea");
      await textarea.click();
      await textarea.fill(
        "The dashboard threw an error while I was looking at my readiness card and nothing loaded after that.",
      );
      const send = dialog.getByRole("button", { name: /Send report/ });
      await send.click();
      await page.waitForTimeout(2500);

      const rows = await rest(
        `feedback_reports?user_id=eq.${uid}&order=created_at.desc&limit=1`,
      );
      const row = rows?.[0];
      check(Boolean(row), "bug report row written", row?.id ?? "none");
      if (row) {
        check(row.kind === "bug", "kind = bug", row.kind);
        const clicks = row.context?.client?.clicks ?? [];
        check(clicks.length > 0, "click trail attached", `${clicks.length} entries`);
        const sels = clicks.map((c) => c.selector);
        check(
          new Set(sels).size === sels.length,
          "every recorded control has a distinct selector",
          sels.join(" | ").slice(0, 160),
        );
        check(
          !sels.some((s) => /\.group|\.inline-flex/.test(s)),
          "ubiquitous utility classes are filtered out of selectors",
          sels.find((s) => /\.group|\.inline-flex/.test(s)) ?? "",
        );
        check(
          !sels.some((s) => /Report a bug|readiness/i.test(s)),
          "selectors carry no element text",
        );
        const errors = row.context?.client?.errors ?? [];
        check(
          errors.some((e) => /e2e synthetic fault/.test(e.message ?? "")),
          "the captured error travels with the report",
        );
      }

      // The pill collapses during a live paper, but never disappears.
      await rest("entitlements", {
        method: "POST",
        body: [
          {
            user_id: uid,
            source: "admin",
            reference: `e2e-regression-exam-${Date.now()}`,
            expires_at: new Date(Date.now() + 3600_000).toISOString(),
          },
        ],
      });
      await page.goto(`${BASE}/en/mock/exam`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      const examFab = page.locator('button[aria-label^="Report a bug"]');
      check((await examFab.count()) === 1, "report control survives into a live paper");
      check(
        ((await examFab.first().innerText()) || "").trim() === "",
        "…collapsed to its icon so it doesn't sit over the answers",
      );
      await page.evaluate(() => localStorage.removeItem("k53.exam.draft"));

      if (!KEEP) await wipeLearner(uid);
      await ctx.close();
    }
  } catch (e) {
    check(false, "the feedback section ran to completion", String(e).split("\n")[0].slice(0, 140));
  }

  // ── admin triage entry point ───────────────────────────────────────────────
  if (sections.includes("admin")) try {
    console.log("\n▸ admin — the report queue is reachable and counted, and guarded");
    const adminCtx = ADMIN.password
      ? await signedInContext(browser, { base: BASE, ...ADMIN })
      : null;
    if (!ADMIN.password) {
      console.log("  … skipped — set E2E_ADMIN_PASSWORD to run the admin section");
    } else if (!adminCtx) {
      check(false, "signed in as the admin account");
    } else {
      const page = await adminCtx.newPage();

      const before = await rest(
        "feedback_reports?status=eq.new&select=id",
      ).then((r) => r.length);

      await page.goto(`${BASE}/en/admin`, { waitUntil: "networkidle" });
      const link = page.getByRole("link", { name: /Bug Reports/ });
      check((await link.count()) > 0, "Bug Reports sits in the admin header");
      check(
        (await link.first().getAttribute("href"))?.includes("/admin/feedback") === true,
        "…and points at the triage queue",
      );

      // Seed one untriaged report and watch the badge move.
      const seeded = await rest("feedback_reports", {
        method: "POST",
        prefer: "return=representation",
        body: [
          {
            user_id: await blankUserId(),
            user_email: BLANK.email,
            kind: "bug",
            body: "Seeded by scripts/e2e/regression.mjs to prove the untriaged badge counts.",
            status: "new",
            context: { client: { route_pattern: "/dashboard" } },
          },
        ],
      });
      const seededId = seeded?.[0]?.id;
      check(Boolean(seededId), "seeded an untriaged report", seededId ?? "failed");

      await page.goto(`${BASE}/en/admin/guide`, { waitUntil: "networkidle" });
      const badge = await page.evaluate(() => {
        const a = [...document.querySelectorAll("a")].find((x) =>
          /Bug Reports/.test(x.textContent || ""),
        );
        return a ? (a.textContent || "").replace(/[^\d]/g, "") : null;
      });
      check(
        Number(badge) === before + 1,
        "untriaged count is shown on every admin page",
        `badge ${badge}, expected ${before + 1}`,
      );

      await page.goto(`${BASE}/en/admin/feedback`, { waitUntil: "networkidle" });
      const queue = await text(page);
      // Matched on the page's own <h1>, not on body text: the header link says
      // "Bug Reports" too, so a body-text match would pass on a redirect.
      const heading = await page.locator("h1").first().innerText();
      check(/Bug Reports/i.test(heading), "admin sees the triage queue", heading);
      check(queue.includes("regression.mjs"), "…with the seeded report in it");

      // The guard lives on the page now, not the layout: prove it from a
      // non-admin session hitting the DETAIL route directly.
      const learnerCtx = await signedInContext(browser, { base: BASE, ...BLANK });
      if (learnerCtx && seededId) {
        const lp = await learnerCtx.newPage();
        // The guard is `notFound()`, so the URL does not change — the proof is
        // the 404 status plus the absence of the report itself.
        const detail = await lp.goto(`${BASE}/en/admin/feedback/${seededId}`, {
          waitUntil: "networkidle",
        });
        check(
          detail?.status() === 404 && !(await text(lp)).includes("regression.mjs"),
          "a non-admin gets a 404 on a report detail page",
          `status ${detail?.status()}`,
        );
        const list = await lp.goto(`${BASE}/en/admin/feedback`, { waitUntil: "networkidle" });
        check(
          list?.status() === 404 && !(await text(lp)).includes("regression.mjs"),
          "…and on the queue",
          `status ${list?.status()}`,
        );
        await learnerCtx.close();
      }

      if (!KEEP && seededId) {
        await rest(`feedback_reports?id=eq.${seededId}`, { method: "DELETE" });
        await page.goto(`${BASE}/en/admin`, { waitUntil: "networkidle" });
        const after = await page.evaluate(() => {
          const a = [...document.querySelectorAll("a")].find((x) =>
            /Bug Reports/.test(x.textContent || ""),
          );
          return a ? (a.textContent || "").replace(/[^\d]/g, "") : null;
        });
        check(
          Number(after || 0) === before,
          "badge falls back once the report is triaged away",
          `badge ${after || 0}, expected ${before}`,
        );
      }
      await adminCtx.close();
    }
  } catch (e) {
    check(false, "the admin section ran to completion", String(e).split("\n")[0].slice(0, 140));
  }

  // ── the Afrikaans claims repair, read off the served page ──────────────────
  if (sections.includes("af")) try {
    console.log("\n▸ af — the repaired claims, asserted against served HTML");
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();

    await page.goto(`${BASE}/af`, { waitUntil: "networkidle" });
    // The FAQ is a stack of <details>; Chromium leaves closed content out of
    // innerText, and two of the repaired claims live in those answers. Open them
    // all so the assertions read what a learner reads after one click.
    await page.evaluate(() =>
      document.querySelectorAll("details").forEach((d) => d.setAttribute("open", "")),
    );
    const landing = await text(page);
    check(!/5 minute/i.test(landing), "landing no longer claims the free test takes 5 minutes");
    check(/minuut/i.test(landing), "…it says about a minute");
    check(
      !/\baflyn\b|\bvanlyn\b/i.test(landing),
      "no offline claim anywhere on the landing page",
      landing.match(/[^.]*\b(aflyn|vanlyn)\b[^.]*/i)?.[0]?.trim().slice(0, 90) ?? "",
    );
    check(
      /hernu outomaties/i.test(landing),
      "the pricing answer explains nothing auto-renews",
    );
    check(
      /Nasionale Padverkeerswet/i.test(landing),
      "questions are sourced to the Act, not to “the latest manual”",
    );
    check(
      !/nuutste handleiding/i.test(landing),
      "…and the unverifiable manual claim is gone",
    );

    await page.goto(`${BASE}/af/readiness`, { waitUntil: "networkidle" });
    const readiness = await text(page);
    check(!/5 minute/i.test(readiness), "readiness intro drops the 5-minute claim");
    check(/minuut/i.test(readiness), "…and states about a minute");

    // The privacy page is no longer our MVP placeholder — since 2026-08-07 it
    // serves the business's own Privacy Policy (Linear K53-53), published
    // verbatim and in English on both locales (docs/legal/README.md). The two
    // claims this used to assert were placeholder wording that is now gone with
    // the rest of it: the parent-consent promise (which was the point — it was
    // never implemented) and the device-local readiness line. What is worth
    // pinning now is that the real document is what gets served.
    await page.goto(`${BASE}/af/legal/privacy`, { waitUntil: "networkidle" });
    const privacy = await text(page);
    check(
      !/Plekhouer-kennisgewing|regsoorsig opgestel voor bekendstelling/i.test(privacy),
      "the MVP placeholder policy is gone from /af",
    );
    check(
      /Luyt Family Holdings/.test(privacy) && /INFORMATION OFFICER/i.test(privacy),
      "…replaced by the published Privacy Policy, operator and Information Officer named",
    );
    check(
      /Effective Date: August 2026|Ingangsdatum: August 2026/.test(privacy),
      "…carrying the effective date it was supplied with",
    );

    await ctx.close();
  } catch (e) {
    check(false, "the af section ran to completion", String(e).split("\n")[0].slice(0, 140));
  }
} finally {
  await browser.close();
}

/**
 * The blank learner's id without opening a browser context for it — the admin
 * section seeds a report on that learner's behalf and never signs in as them.
 */
async function blankUserId() {
  const { url, service } = supabaseKeys();
  const res = await fetch(
    `${url}/auth/v1/admin/users?page=1&per_page=200`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` } },
  ).then((r) => r.json());
  return (res.users ?? []).find((u) => u.email === BLANK.email)?.id ?? null;
}

process.exit(report());
