#!/usr/bin/env node
/**
 * Promote external (not-in-chart) signs to served — the gate after BOTH automated
 * pre-serve checks exist: external-verify (artwork) + content-audit (factuality).
 *
 * Auto-approve a sign iff:
 *   decideApproval(verdict, {minConf:0.95, requirePrimarySource:true})  AND
 *   its content-audit exists and contentOk !== false.
 * Then: asset_status='approved', review_status='approved', svg_hash pinned
 * fail-closed from the on-disk SVG, verified_at, verdict reason merged in. Served.
 *
 * Otherwise the sign stays needs_review/reviewed (already in the /admin queue);
 * we record verification.reason + confidence so the human sees why it's there.
 *
 * Idempotent. Usage: node scripts/signs/apply-external-verdicts.mjs [--dry-run]
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { serviceClient, decideApproval, pinHashLocal } from "./lib.mjs";

const DRY = process.argv.includes("--dry-run");
const MIN_CONF = 0.95;

const verdictDir = resolve("data/verify/external-verdicts");
const auditDir = resolve("data/verify/content-audit");
if (!existsSync(verdictDir)) {
  console.error("No data/verify/external-verdicts/ — run external-verify first.");
  process.exit(1);
}
const verdicts = readdirSync(verdictDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(verdictDir, f), "utf8")));
const audit = new Map(
  existsSync(auditDir)
    ? readdirSync(auditDir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => JSON.parse(readFileSync(join(auditDir, f), "utf8")))
        .map((a) => [a.code, a])
    : [],
);

const supabase = serviceClient();
const codes = verdicts.map((v) => v.code);
const { data: rows, error } = await supabase
  .from("road_signs")
  .select("sign_id, code, svg_file, verification")
  .in("code", codes);
if (error) {
  console.error(error.message);
  process.exit(1);
}
const byCode = new Map(rows.map((r) => [r.code, r]));

const now = new Date().toISOString();
const updates = [];
const stats = { approved: 0, queued: 0, orphan: 0 };

for (const v of verdicts) {
  const row = byCode.get(v.code);
  if (!row) { stats.orphan++; console.warn(`  ! verdict for unknown code ${v.code}`); continue; }

  const a = audit.get(v.code);
  const artworkOk = decideApproval(v, { minConf: MIN_CONF, requirePrimarySource: true });
  const auditOk = a ? a.contentOk !== false : false; // must be audited AND not flagged
  const verification = {
    ...(row.verification ?? {}),
    confidence: v.confidence,
    reason: v.reason,
    visionPass: v.visionPass,
    semanticPass: v.semanticPass,
    hasPrimarySource: v.hasPrimarySource,
    contentAudited: Boolean(a),
    contentIssue: a && a.contentOk === false ? a.issue : null,
  };
  const patch = { verification };

  if (artworkOk && auditOk) {
    let hash;
    try {
      hash = pinHashLocal(row.svg_file); // fail-closed
    } catch (e) {
      stats.queued++;
      console.warn(`  ! ${v.code}: ${e.message} — left in queue`);
      updates.push({ sign_id: row.sign_id, code: v.code, patch });
      continue;
    }
    patch.asset_status = "approved";
    patch.review_status = "approved";
    patch.svg_hash = hash;
    patch.verified_at = now;
    stats.approved++;
  } else {
    stats.queued++;
  }
  updates.push({ sign_id: row.sign_id, code: v.code, patch });
}

console.log(
  `External verdicts: ${verdicts.length} | auto-approved (served): ${stats.approved} | ` +
    `residual (human queue): ${stats.queued}` +
    (stats.orphan ? ` | orphan: ${stats.orphan}` : ""),
);
if (DRY) {
  console.log("\n--dry-run: no writes.");
  process.exit(0);
}

let ok = 0;
for (let i = 0; i < updates.length; i += 25) {
  const batch = updates.slice(i, i + 25);
  const results = await Promise.all(
    batch.map(({ sign_id, patch }) =>
      supabase.from("road_signs").update(patch).eq("sign_id", sign_id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed) { console.error(`batch ${i}: ${failed.error.message}`); process.exit(1); }
  ok += batch.length;
}
console.log(`Wrote ${ok} signs.`);
