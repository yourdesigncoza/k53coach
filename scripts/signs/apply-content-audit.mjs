#!/usr/bin/env node
/**
 * Phase 3 (content-factuality pass, step 2): apply the independent content audit
 * (data/verify/content-audit/<code>.json). Any sign the second reviewer flagged
 * (contentOk:false) is DEMOTED out of the served set — review_status drops from
 * 'approved' to 'reviewed' (asset stays approved) and the issue is recorded so the
 * admin queue shows why. Signs the audit passed are left as-is.
 *
 * Idempotent. Pass --dry-run to preview. Usage: node scripts/signs/apply-content-audit.mjs [--dry-run]
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { serviceClient } from "./lib.mjs";

const DRY = process.argv.includes("--dry-run");
const supabase = serviceClient();
const dir = resolve("data/verify/content-audit");
const audits = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));

const flagged = audits.filter((a) => a.contentOk === false);
console.log(`Content audit: ${audits.length} reviewed, ${flagged.length} flagged.`);
for (const a of flagged) console.log(`  demote ${a.code}: ${a.issue}`);

if (!flagged.length) {
  console.log("Nothing to demote.");
  process.exit(0);
}
if (DRY) {
  console.log("\n--dry-run: no writes.");
  process.exit(0);
}

// Fetch the flagged rows to merge the issue into existing verification jsonb.
const codes = flagged.map((a) => a.code);
const { data: rows, error } = await supabase
  .from("road_signs")
  .select("sign_id, code, verification")
  .in("code", codes);
if (error) {
  console.error(error.message);
  process.exit(1);
}
const issueByCode = new Map(flagged.map((a) => [a.code, a.issue]));

let ok = 0;
for (const r of rows) {
  const verification = { ...(r.verification ?? {}), contentIssue: issueByCode.get(r.code) ?? null };
  const { error: upErr } = await supabase
    .from("road_signs")
    .update({ review_status: "reviewed", verification })
    .eq("sign_id", r.sign_id);
  if (upErr) {
    console.error(`${r.code}: ${upErr.message}`);
    process.exit(1);
  }
  ok++;
}
console.log(`Demoted ${ok} signs to the human content queue.`);
