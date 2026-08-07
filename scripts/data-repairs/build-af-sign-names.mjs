/**
 * K53-51 — turn Louwrens's returned review sheet into a data-repair file.
 *
 *   node scripts/data-repairs/build-af-sign-names.mjs <returned.csv> [--sent <original.csv>]
 *
 * He edited the `afrikaans_draft` column IN PLACE rather than filling
 * `afrikaans_corrected`, so the sheet carries no marker of what he changed —
 * the diff against the CSV we sent is the only record of his 83 decisions, and
 * this script keeps it in each op's `why`. `afrikaans_corrected` still wins
 * where it is filled, so the file also works if he uses the column as asked.
 *
 * Reads LIVE (for the current content object) and writes a repair file. It
 * writes nothing to the database — apply-repairs.mjs does that.
 *
 * Two things it deliberately does NOT do:
 *
 *  - It does not touch `content.afReview`. That marker records sign-off of the
 *    Afrikaans LESSON text (1 914 fields, still unreviewed). Flipping it here
 *    because the name was reviewed would claim a sign-off nobody gave. The name
 *    gets its own `content.nameReview`.
 *  - It does not propagate his wording to sibling rows he left untouched. He
 *    changed `Aftelbaken` on IN2/IN3 but not IN1, `Gevaarplaat` on W401/W402
 *    but not W415, and `hoëbesettingsvoertuie` on R336/R352 but not R320. Those
 *    are questions for him, not inferences for us — they are printed at the end
 *    of the run and asked on the issue.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { select } from "./supabase-rest.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const REVIEWED_BY = "Louwrens Luyt";
const REVIEWED_AT = "2026-08-06";
const DRAFTED_AT = "2026-08-06";

/**
 * Spelling and grammar slips in his edits, repaired in HIS OWN wording:
 * `[what the sheet says, what we write, why]`.
 *
 * Every one is a keystroke slip against a word he spells correctly elsewhere on
 * the same sheet — not a wording call being overruled. Each is disclosed on the
 * issue so he can veto it. Where his choice merely differs from ours it stands
 * untouched, however much we might have phrased it otherwise.
 */
const SPELLING = {
  R131: [
    "Slegs voertuie wat deur dire getrek word",
    "Slegs voertuie wat deur diere getrek word",
    "dire → diere",
  ],
  R232: [
    "Voertuie wat gevaarlike stowwe vervoer word verbied",
    "Voertuie wat gevaarlike stowwe vervoer verbied",
    "stray 'word' — his own R571 reads 'voertuie wat gevaarlike stowwe vervoer'",
  ],
  R337: [
    "Begin van 'n gereserveerde baan vir voertuie hoëbesettingsvoertuie",
    "Begin van 'n gereserveerde baan vir hoëbesettingsvoertuie",
    "'voertuie' typed twice",
  ],
  R352: [
    "Gereserveerde baan vir voetuie met baie insittendes",
    "Gereserveerde baan vir voertuie met baie insittendes",
    "voetuie → voertuie",
  ],
  W348: [
    "Onbeskermde Steierrand(jetty) of rivieroewer vorentoe",
    "Onbeskermde steierrand of rivieroewer vorentoe",
    "'(jetty)' is a note to us, not part of a sign name; the mid-sentence capital goes with it",
  ],
  W402: [
    "Gevaar bord",
    "Gevaarbord",
    "same English name as W401, which he wrote closed up",
  ],
  W411: ["Boemversperring", "Boomversperring", "Boem → Boom (boom barricade)"],
};

/** Rows where he changed one of a family and left the rest. Asked, never inferred. */
const SIBLINGS = [
  ["IN1", "IN2/IN3 became Aftelmerker; IN1 is still Aftelbaken"],
  ["W415", "W401/W402 became Gevaarbord; W415 is still Oorhoofse gevaarplaat"],
  ["R320", "R336/R352 dropped hoëbesettingsvoertuie; R320 still carries it"],
  ["R320-P", "same as R320"],
  ["R501–R504", "R511/R512 became 'Is van toepassing'; these still read 'Geld'"],
];

const args = process.argv.slice(2);
const sentPath = args.includes("--sent") ? args[args.indexOf("--sent") + 1] : null;
const returnedPath = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--sent");

if (!returnedPath) {
  console.error("usage: build-af-sign-names.mjs <returned.csv> [--sent <original.csv>]");
  process.exit(1);
}

/** Minimal RFC4180 reader → array of arrays. No CSV dependency in this repo. */
function parseRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function readSheet(path) {
  const rows = parseRows(readFileSync(path, "utf8"));
  const head = rows[0];
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c !== ""))
    .map((r) => {
      // His editor returned twelve rows with the WHOLE line quoted as a single
      // backslash-escaped field. Re-parse those rather than dropping them.
      const cells = r.length === 1 ? parseRows(r[0].replace(/\\'/g, "'"))[0] : r;
      return Object.fromEntries(head.map((h, i) => [h, (cells[i] ?? "").trim()]));
    });
}

const returned = readSheet(returnedPath);
const sent = sentPath
  ? Object.fromEntries(readSheet(sentPath).map((r) => [r.code, r]))
  : {};

const live = Object.fromEntries(
  (await select("road_signs?select=code,name,content&limit=1000")).map((r) => [r.code, r]),
);

const ops = [];
const spellingApplied = [];
const missing = [];
let changedByHim = 0;

for (const r of returned) {
  const row = live[r.code];
  if (!row) {
    missing.push(`${r.code} (not in road_signs)`);
    continue;
  }

  const onSheet = r.afrikaans_corrected || r.afrikaans_draft;
  if (!onSheet) {
    missing.push(`${r.code} (blank on the sheet)`);
    continue;
  }

  const fix = SPELLING[r.code];
  let name = onSheet;
  let repaired = null;
  if (fix && onSheet === fix[0]) {
    name = fix[1];
    repaired = fix[2];
    spellingApplied.push(`${r.code}: ${fix[2]}`);
  } else if (fix) {
    console.error(`  ! ${r.code} spelling repair no longer matches the sheet — check by hand`);
  }

  const was = sent[r.code]?.afrikaans_draft;
  const his = Boolean(r.afrikaans_corrected) || (was !== undefined && was !== r.afrikaans_draft);
  if (his) changedByHim++;

  ops.push({
    table: "road_signs",
    match: `code=eq.${r.code}`,
    set: {
      content: {
        ...(row.content ?? {}),
        name: { af: name },
        nameReview: {
          humanSignOff: true,
          draftedBy: "ai",
          draftedAt: DRAFTED_AT,
          reviewedBy: REVIEWED_BY,
          reviewedAt: REVIEWED_AT,
        },
      },
    },
    why:
      (his
        ? `Afrikaans name, K53-51 — Louwrens changed our draft "${was ?? ""}" to "${onSheet}".`
        : "Afrikaans name, K53-51 — our draft, accepted unchanged by Louwrens.") +
      (repaired ? ` Keystroke slip repaired in his wording: ${repaired}.` : ""),
  });
}

const out = {
  description:
    `Afrikaans sign names, K53-51. Louwrens reviewed all ${returned.length} drafted names and returned the sheet on ${REVIEWED_AT}; ` +
    `he changed ${changedByHim} and accepted the rest unchanged. Writes content.name.af — the field signName() reads on /af, where ` +
    `until now every learner-facing sign name was English whatever the locale. The applier PATCHes the whole jsonb column, so each op ` +
    `carries the COMPLETE content object; a partial would wipe the lesson text. content.afReview is carried through UNCHANGED and still ` +
    `says humanSignOff: false — that marker covers the Afrikaans LESSON text, which he has not read. The name has its own ` +
    `content.nameReview, and only the name is signed off. ${spellingApplied.length} of his edits carry a repaired keystroke slip, named ` +
    `in that op's why and disclosed on the issue.`,
  drafted_by: "ai",
  drafted_at: DRAFTED_AT,
  human_sign_off: true,
  reviewed_by: REVIEWED_BY,
  reviewed_at: REVIEWED_AT,
  method:
    "Drafts composed from a fixed glossary + pattern rules (K53-51), reviewed by Louwrens in a CSV. He edited the afrikaans_draft column in place, so his decisions are the diff against the sheet we sent — recorded per op in `why`. Nothing was propagated to sibling rows he left untouched.",
  ops,
};

const file = `af-sign-names-${REVIEWED_AT}.json`;
writeFileSync(join(ROOT, "scripts/data-repairs", file), `${JSON.stringify(out, null, 1)}\n`);

console.log(`${ops.length} ops → scripts/data-repairs/${file}`);
console.log(`  changed by Louwrens: ${changedByHim}`);
console.log(`  accepted unchanged:  ${ops.length - changedByHim}`);
console.log(`  spelling repairs:    ${spellingApplied.length}`);
for (const s of spellingApplied) console.log(`      ${s}`);
if (missing.length) console.log(`  skipped: ${missing.join(", ")}`);
console.log("\n  siblings left for him to rule on (not inferred):");
for (const [code, why] of SIBLINGS) console.log(`      ${code}: ${why}`);
