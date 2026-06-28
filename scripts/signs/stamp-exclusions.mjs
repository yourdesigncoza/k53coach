#!/usr/bin/env node
/**
 * Stamp a machine-readable exclusionReason on the signs we deliberately keep
 * out of the served set (sa_relevant=false), so "excluded" is auditable rather
 * than silent. Changes NO gates — only writes verification.exclusionReason.
 *
 * Categories (docs/sign-pipeline-handoff.md §4):
 *   - R5xx-B            : layout duplicate of the canonical R5xx plate
 *   - IN9 / IN18        : scrape artifact (alt= name), duplicate of an IN sign
 *   - IN19-RHT          : right-hand-traffic variant — not used in SA (we drive on the left)
 *   - R201-1xx-R51x     : speed+plate composite — deferred; base speed + plate served separately
 *
 * Idempotent. Usage: node scripts/signs/stamp-exclusions.mjs [--dry-run]
 */
import { serviceClient } from "./lib.mjs";

const DRY = process.argv.includes("--dry-run");
const supabase = serviceClient();

const { data: rows, error } = await supabase
  .from("road_signs")
  .select("sign_id, code, verification")
  .eq("sa_relevant", false);
if (error) {
  console.error(error.message);
  process.exit(1);
}

function reasonFor(code) {
  if (/-B$/.test(code)) return "layout duplicate of the canonical R5xx supplementary plate";
  if (code === "IN9" || code === "IN18") return "scrape artifact (alt= name); duplicate of an existing IN sign";
  if (/-RHT$/.test(code)) return "right-hand-traffic variant — not used in SA (left-hand traffic)";
  if (/^R201-\d+-R\d+$/.test(code)) return "speed+plate composite — deferred; base speed sign and plate are served separately";
  return "not a standalone learner sign — kept excluded pending review";
}

const updates = rows.map((r) => ({
  sign_id: r.sign_id,
  code: r.code,
  verification: { ...(r.verification ?? {}), exclusionReason: reasonFor(r.code) },
}));

const byReason = updates.reduce((m, u) => {
  m[u.verification.exclusionReason] = (m[u.verification.exclusionReason] || 0) + 1;
  return m;
}, {});
console.log(`Stamping ${updates.length} excluded signs:`);
for (const [k, n] of Object.entries(byReason)) console.log(`  ${n}× ${k}`);

if (DRY) {
  console.log("\n--dry-run: no writes.");
  process.exit(0);
}

let ok = 0;
for (let i = 0; i < updates.length; i += 25) {
  const batch = updates.slice(i, i + 25);
  const results = await Promise.all(
    batch.map(({ sign_id, verification }) =>
      supabase.from("road_signs").update({ verification }).eq("sign_id", sign_id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed) { console.error(`batch ${i}: ${failed.error.message}`); process.exit(1); }
  ok += batch.length;
}
console.log(`Stamped ${ok} signs (gates unchanged).`);
