/**
 * AP-01 step 1 — read-only inventory of every `ui_translations` override row.
 *
 * The bug this exists to make visible: `src/i18n/request.ts` merges these rows
 * over the shipped `messages/{en,af}.json` at request time, so a row written in
 * July still wins over every i18n commit and over the 2026-08-04 claims audit.
 * Nothing in the product surfaces that, which is why /af served retracted claims
 * for three weeks. This script diffs the database against the files.
 *
 * READ ONLY. It never writes to Supabase. The repair itself is a separate,
 * recorded step (`ui-translations-repair-<date>.json`); this run also emits the
 * rollback copy the plan requires.
 *
 * Usage:
 *   node scripts/data-repairs/audit-ui-overrides.mjs            # table to stdout
 *   node scripts/data-repairs/audit-ui-overrides.mjs --write    # + backup JSON
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { select } from "./supabase-rest.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const json = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const DEFAULTS = { en: json("messages/en.json"), af: json("messages/af.json") };

/**
 * Classification from AP-01 §1. Membership is the plan's, not this script's —
 * anything absent lands in `unclassified`, so a new row can never be silently
 * swept into a bucket that authorises deleting it.
 *
 *   a — the DB text asserts something untrue or withdrawn. Reset without waiting
 *       for Louwrens: removing a false claim is not a wording choice.
 *   b — terminology a later commit disagreed with. His call; the answer belongs
 *       in messages/af.json either way.
 *   c — DB wording genuinely better than the JSON. Promote into the JSON first,
 *       delete the row second. Louwrens decides membership.
 */
const CLASSES = {
  // Deleted 2026-08-06 (ui-translations-repair-2026-08-06.json), so these should
  // no longer appear in a run. Kept listed so a re-appearing row is recognised
  // rather than landing in `unclassified` as if it were new.
  a: [
    "readiness.benefitTime",
    "landing.ctaNote", // corrected 2026-08-06 — "ongeveer 5 minute", not wording
    "landing.feat4Body",
    "landing.planF4",
    "landing.faqA4", // corrected 2026-08-06 — AP-01 keyed this text to faqA5
    "landing.faqA2",
    "landing.feat2Body",
    "legal.p3",
  ],
  b: [
    "topics.controls",
    "module.controlsTitle",
    "module.controlsSubtitle",
    "module.backControls",
    "module.relatedControls",
    "nav.mock",
    "nav.home",
    "landing.login",
    "common.login",
    "paywall.testNeedsAuth",
    "auth.title",
    "mock.timerLabel",
    "mock.viewResult",
    "notFound.home",
    "result.seeAssessment",
    "assessment.cta",
    "examResult.viewAssessment",
    "progressPage.blendNote",
    "learn.subtitle",
    "landing.demoKicker",
    "landing.planCta",
    "landing.subtitle",
    "landing.feat2Title",
    "landing.feat3Body",
    "mock.subtitle",
    "mock.rule1",
    "mock.rule2",
    "nav.admin",
    // The 11 rows AP-01's lists omitted entirely (added 2026-08-06). Ten are
    // plain wording preference; `landing.faqA4` was the eleventh and is class
    // (a) above. `legal.p2` is a grammar correction of ours ("hanteer" →
    // "gehanteer") and `nav.admin` is a stray trailing space — both his call.
    "auth.demoSkip",
    "auth.learnMore",
    "dashboard.mockSub",
    "dashboard.welcomeSub",
    "exam.sectionBrief",
    "examResult.failedBlurb",
    "examResult.passedBlurb",
    "examResult.retake",
    "examResult.showAll",
    "legal.p2",
  ],
  /**
   * AP-01 filed these three under (a). Reading the actual text, none of them
   * asserts anything untrue, so none qualifies for delete-without-asking — and
   * two of them argue the other way:
   *
   *   legal.p1        pure grammar ("geen rekening word benodig nie" vs "geen
   *                   rekening nodig nie"). No claim content at all.
   *   landing.faqA5   his text is accurate; ours only ADDS the English-only
   *                   disclosure (constraint 8). A missing disclosure, not a lie.
   *   landing.feat1Body  deleting it would make the site claim MORE — ours adds
   *                   "getoets teen die amptelike reels" where his says only
   *                   "clear reasons in plain language". A claims repair must
   *                   not be the vehicle for shipping a new unreviewed claim.
   */
  deferred: ["legal.p1", "landing.faqA5", "landing.feat1Body"],
};

const classOf = (ns, key) => {
  const id = `${ns}.${key}`;
  if (CLASSES.a.includes(id)) return "a";
  if (CLASSES.b.includes(id)) return "b";
  if (CLASSES.deferred.includes(id)) return "deferred";
  return "unclassified";
};

/**
 * Strings the claims audit removed. Presence in a DB value is the P0 signal.
 *
 * ⚠ `vanlyn` and `aflyn` are BOTH "offline" — Louwrens used one, our JSON draft
 * used the other. AP-01's first verification grep listed only `aflyn`, so it
 * would have returned 0 and declared the repair done while `landing.faqA4`'s
 * "kernfunksionaliteit werk vanlyn" was still served (3 hits live, 2026-08-06).
 * Same shape as the `grep -c` trap: a search that cannot find the thing reads
 * exactly like the thing being absent. Match on every synonym, not the one we
 * happened to write.
 */
const FALSE_CLAIM_MARKERS = [
  "aflyn",
  "vanlyn",
  "5 minute",
  "R179",
  "toestemming",
  "installeer",
  "geïnstalleer",
  "VVir",
];

const trunc = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const rows = await select(
  "ui_translations?select=locale,namespace,key,value,updated_at,updated_by" +
    "&order=locale.asc,namespace.asc,key.asc",
);

const audited = rows.map((r) => {
  const jsonValue = DEFAULTS[r.locale]?.[r.namespace]?.[r.key];
  return {
    locale: r.locale,
    namespace: r.namespace,
    key: r.key,
    db_value: r.value,
    json_value: jsonValue ?? null,
    // A row whose value already equals the shipped default is inert: deleting it
    // changes nothing on the page. Worth knowing before counting "49 to repair".
    differs: jsonValue !== undefined && jsonValue !== r.value,
    orphaned_key: jsonValue === undefined,
    false_claim_markers: FALSE_CLAIM_MARKERS.filter((m) => r.value.includes(m)),
    updated_at: r.updated_at,
    updated_by: r.updated_by,
    class: classOf(r.namespace, r.key),
  };
});

for (const r of audited) {
  const flag = r.false_claim_markers.length
    ? `⚠ ${r.false_claim_markers.join(",")}`
    : r.differs
      ? ""
      : "inert";
  console.log(
    [
      r.locale.padEnd(2),
      r.class.padEnd(12),
      `${r.namespace}.${r.key}`.padEnd(28),
      trunc(r.db_value, 46).padEnd(46),
      trunc(r.json_value ?? "(key absent from JSON)", 46).padEnd(46),
      flag,
    ].join("  "),
  );
}

const tally = (fn) => audited.filter(fn).length;
console.log(
  `\n${audited.length} rows  |  ` +
    `a=${tally((r) => r.class === "a")} ` +
    `b=${tally((r) => r.class === "b")} ` +
    `deferred=${tally((r) => r.class === "deferred")} ` +
    `unclassified=${tally((r) => r.class === "unclassified")}  |  ` +
    `differs=${tally((r) => r.differs)} ` +
    `inert=${tally((r) => !r.differs && !r.orphaned_key)} ` +
    `orphaned=${tally((r) => r.orphaned_key)}  |  ` +
    `false-claim markers=${tally((r) => r.false_claim_markers.length > 0)}`,
);
console.log(
  `editors: ${[...new Set(audited.map((r) => r.updated_by))].join(", ")}`,
);

if (process.argv.includes("--write")) {
  const stamp = new Date().toISOString().slice(0, 10);
  const out = join(ROOT, `scripts/data-repairs/ui-translations-backup-${stamp}.json`);
  writeFileSync(out, `${JSON.stringify(audited, null, 2)}\n`);
  console.log(`\nwrote ${out}`);
}
