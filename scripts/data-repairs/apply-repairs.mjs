/**
 * Apply a declarative data-repair file.
 *
 *   node scripts/data-repairs/apply-repairs.mjs data-repairs-2026-07-30.json [--dry-run]
 *
 * The file is `{ description, ops: [{ table, match, set, why }] }`, where `match`
 * is a PostgREST filter (`id=eq.RS-041`) and `set` is the patch body. Every op is
 * a targeted write to a known value, so reruns are no-ops and the file doubles as
 * the record of WHY each value changed — `why` is the audit trail, not a comment.
 *
 * Deliberately not migrations, for the same reason as apply-data-repairs.mjs:
 * this is *data*, and content decisions keep moving as the bank grows. A
 * migration would freeze one moment of that. The generator that produced the
 * seed is fixed alongside so a regeneration does not reintroduce the defect.
 *
 * --dry-run prints the plan and writes nothing.
 */
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { patch, select } from "./supabase-rest.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry-run");
const arg = process.argv.slice(2).find((a) => !a.startsWith("--"));

if (!arg) {
  console.error("usage: apply-repairs.mjs <repair-file.json> [--dry-run]");
  process.exit(1);
}

const file = isAbsolute(arg) ? arg : join(HERE, arg);
const { description, ops } = JSON.parse(readFileSync(file, "utf8"));

console.log(`${description}\n\n${ops.length} ops${DRY ? "  (--dry-run)" : ""}\n`);

let changed = 0;
let already = 0;

for (const op of ops) {
  const cols = Object.keys(op.set);
  const [before] = await select(
    `${op.table}?${op.match}&select=${cols.join(",")}`,
  );
  if (!before) {
    console.log(`  ✗ ${op.match} — no row matched`);
    continue;
  }

  // Compare as JSON so array columns (vehicle_codes) compare by value.
  const diffs = cols.filter(
    (c) => JSON.stringify(before[c]) !== JSON.stringify(op.set[c]),
  );
  if (!diffs.length) {
    already++;
    console.log(`  = ${op.match} — already applied`);
    continue;
  }

  for (const c of diffs) {
    const show = (v) => {
      const s = JSON.stringify(v);
      return s && s.length > 70 ? `${s.slice(0, 70)}…` : s;
    };
    console.log(`  → ${op.match} ${c}: ${show(before[c])} => ${show(op.set[c])}`);
  }
  if (!DRY) await patch(`${op.table}?${op.match}`, op.set);
  changed++;
}

console.log(
  `\n${DRY ? "would change" : "changed"}: ${changed}   already applied: ${already}`,
);
