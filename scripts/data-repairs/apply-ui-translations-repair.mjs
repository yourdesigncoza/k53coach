/**
 * AP-01 — apply `ui-translations-repair-<date>.json`.
 *
 * Deleting a `ui_translations` row IS the reset: the migration comment states a
 * row exists only where an admin edited a string away from its shipped default,
 * so absence means `messages/<locale>.json` renders again.
 *
 * Every delete is conditional on the value recorded at audit time. A row edited
 * between the audit and this run matches nothing, deletes nothing, and is
 * reported as a skip — it is never clobbered. Dry-run by default; pass --apply.
 *
 *   node scripts/data-repairs/apply-ui-translations-repair.mjs            # dry run
 *   node scripts/data-repairs/apply-ui-translations-repair.mjs --apply
 *   node …/apply-ui-translations-repair.mjs --file scripts/data-repairs/<other>.json
 *
 * `--file` exists because the repair landed in two passes against the same table:
 * the false claims first (no wording judgement, did not wait for anyone), then the
 * 41 wording rows once Louwrens had ruled on each. Same delete semantics, same
 * safety, different op list — so it takes a file rather than growing a second copy.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { remove, select } from "./supabase-rest.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fileArg = process.argv.indexOf("--file");
const REPAIR =
  fileArg !== -1
    ? process.argv[fileArg + 1]
    : "scripts/data-repairs/ui-translations-repair-2026-08-06.json";
const repair = JSON.parse(readFileSync(join(ROOT, REPAIR), "utf8"));

/**
 * PostgREST filter value.
 *
 * ⚠ Plain `encodeURIComponent`, NOT double-quoted. Quoting is required inside
 * `in.(…)` lists and `or=(…)` groups, but for a bare `col=eq.value` PostgREST
 * takes everything after the first `.` literally — so wrapping in `"` matches a
 * value that actually starts and ends with a quote character, i.e. nothing.
 * Measured: quoted → 0 rows, unquoted → 1 row, for a value with no special
 * characters at all. `encodeURIComponent` already escapes `,`, which is the
 * only reason quoting looked necessary (faqA2 contains commas).
 *
 * This is why the script counts returned rows instead of trusting a 2xx: the
 * quoted version deleted nothing and reported eight tidy "no match" skips,
 * which reads exactly like "the rows were already clean".
 */
const filterValue = (v) => encodeURIComponent(v);

const apply = process.argv.includes("--apply");
console.log(`${apply ? "APPLY" : "DRY RUN"} — ${repair.ops.length} ops from ${REPAIR}\n`);

let deleted = 0;
let skipped = 0;

for (const op of repair.ops) {
  const id = `${op.locale} ${op.namespace}.${op.key}`;
  const path =
    `ui_translations?locale=eq.${op.locale}` +
    `&namespace=eq.${encodeURIComponent(op.namespace)}` +
    `&key=eq.${encodeURIComponent(op.key)}` +
    `&value=eq.${filterValue(op.old)}`;

  if (!apply) {
    const rows = await select(`${path}&select=locale,namespace,key`);
    console.log(`  ${rows.length === 1 ? "would delete" : "NO MATCH   "}  ${id}`);
    rows.length === 1 ? deleted++ : skipped++;
    continue;
  }

  const rows = await remove(path);
  if (rows.length === 1) {
    deleted++;
    console.log(`  deleted     ${id}`);
  } else {
    skipped++;
    console.log(`  SKIPPED     ${id} — ${rows.length} rows matched the audited value`);
  }
}

console.log(`\n${deleted} deleted, ${skipped} skipped`);
if (skipped) {
  console.log(
    "A skip means the live value no longer equals what the audit recorded.\n" +
      "Re-run audit-ui-overrides.mjs before deciding what to do with it.",
  );
}
if (apply) {
  console.log(
    "\n⚠ NOT DONE YET. getOverrides is force-cache tagged `ui-translations`.\n" +
      "A direct PostgREST write does not touch that tag, so the live pages keep\n" +
      "serving the deleted strings. Bust it with:\n\n" +
      "    vercel cache invalidate --tag ui-translations --yes\n\n" +
      "⚠ A REDEPLOY DOES NOT DO THIS. Vercel's Data Cache persists across\n" +
      "deployments by design — measured 2026-08-06: a full production redeploy\n" +
      "landed, aliased, and still served every one of the deleted strings. Only\n" +
      "the tag invalidation cleared them. The other route is one admin save in\n" +
      "the translation manager, which calls updateTag() in translation-actions.\n\n" +
      "Verify against the live HTML, never the database — and check the response\n" +
      "SIZE first: an SSO redirect body is 15 bytes and scores 0 on every grep,\n" +
      "which is indistinguishable from a clean page.",
  );
}
