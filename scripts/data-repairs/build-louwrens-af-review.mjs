/**
 * AP-01 final step — build the Afrikaans wording review for Louwrens.
 *
 * The 41 rows left in `ui_translations` after the 2026-08-06 false-claim repair
 * are all his wording versus ours, both true. His call on every one. This emits
 * the CSV he reads (same channel as the question-bank sign-off on 2026-08-05,
 * which worked) plus a one-line-per-row markdown preview for the Linear issue.
 *
 * Reads LIVE. Writes nothing to the database.
 *
 *   node scripts/data-repairs/build-louwrens-af-review.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { select } from "./supabase-rest.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const json = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const EN = json("messages/en.json");
const AF = json("messages/af.json");

/** Namespace → where he'll actually see it. He does not know our key names. */
const SCREEN = {
  assessment: "AI-terugvoer",
  auth: "Aanmeldbladsy",
  common: "Algemeen (regdeur)",
  dashboard: "Dashboard",
  exam: "Proefeksamen",
  examResult: "Proefeksamen — uitslag",
  landing: "Tuisblad (bemarking)",
  learn: "Leer-afdeling",
  legal: "Privaatheidsbladsy",
  mock: "Proefeksamen",
  module: "Leermodules",
  nav: "Kieslys / navigasie",
  notFound: "Bladsy-nie-gevind",
  paywall: "Betaalbladsy",
  progressPage: "Vordering",
  readiness: "Gratis gereedheidstoets",
  result: "Uitslag",
  topics: "Onderwerpe",
};

/**
 * The three rows where taking OUR version is not a neutral wording swap. Flagged
 * so he is not asked a question that is really ours to answer first.
 */
const FLAGS = {
  "landing.feat1Body":
    "LET WEL: ons weergawe voeg 'n NUWE bewering by ('getoets teen die amptelike reels'). Moenie kies bloot omdat dit meer sê nie.",
  "landing.faqA5":
    "LET WEL: ons weergawe voeg 'n nodige mededeling by — dat die vrae self nog in Engels is.",
  "legal.p1": "Net grammatika — geen betekenisverskil.",
};

const csvCell = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;

const rows = await select(
  "ui_translations?select=locale,namespace,key,value&order=namespace.asc,key.asc",
);

const out = rows
  .map((r) => ({
    screen: SCREEN[r.namespace] ?? r.namespace,
    id: `${r.namespace}.${r.key}`,
    en: EN[r.namespace]?.[r.key] ?? "",
    his: r.value,
    ours: AF[r.namespace]?.[r.key] ?? "",
    note: FLAGS[`${r.namespace}.${r.key}`] ?? "",
    locale: r.locale,
  }))
  .sort((a, b) => a.screen.localeCompare(b.screen) || a.id.localeCompare(b.id));

const HEAD = [
  "#",
  "Waar dit verskyn",
  "Engels (ter verwysing)",
  "JOU Afrikaans (tans regstreeks)",
  "Ons alternatief",
  "BESLUIT (A / B / C)",
  "As C — jou nuwe bewoording",
  "Nota",
];

const csv = [
  HEAD.map(csvCell).join(","),
  ...out.map((r, i) =>
    [i + 1, r.screen, r.en, r.his, r.ours, "", "", r.note].map(csvCell).join(","),
  ),
].join("\n");

writeFileSync(join(ROOT, "docs/louwrens-af-wording-review-2026-08-06.csv"), `${csv}\n`);

const md = out
  .map(
    (r, i) =>
      `${i + 1}. **${r.screen}** — EN: _${r.en}_\n` +
      `   - **A (joune, tans regstreeks):** ${r.his}\n` +
      `   - **B (ons alternatief):** ${r.ours}` +
      (r.note ? `\n   - ⚠ ${r.note}` : ""),
  )
  .join("\n");

writeFileSync(join(ROOT, "docs/louwrens-af-wording-review-2026-08-06.md"), `${md}\n`);

console.log(`${out.length} rows`);
console.log(`flagged: ${out.filter((r) => r.note).length}`);
console.log(`missing our-side text: ${out.filter((r) => !r.ours).length}`);
console.log(`missing EN reference: ${out.filter((r) => !r.en).length}`);
console.log("→ docs/louwrens-af-wording-review-2026-08-06.csv");
console.log("→ docs/louwrens-af-wording-review-2026-08-06.md");
