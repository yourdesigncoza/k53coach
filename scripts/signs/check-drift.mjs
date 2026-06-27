#!/usr/bin/env node
/**
 * Phase 6 drift audit (docs/sign-accuracy-pipeline.md): read-only check that no
 * APPROVED sign's on-disk SVG has changed since it was approved (current file
 * sha256 vs the pinned svg_hash). Writes nothing — safe to run in CI. Exits 1 if
 * drift is found so a pipeline can fail on it.
 *
 * Usage: node scripts/signs/check-drift.mjs
 */
import { serviceClient, publicSvgHash } from "./lib.mjs";

const supabase = serviceClient();
const { data: rows, error } = await supabase
  .from("road_signs")
  .select("code, svg_file, svg_hash")
  .eq("asset_status", "approved")
  .not("svg_hash", "is", null);
if (error) {
  console.error(error.message);
  process.exit(1);
}

const drift = [];
const missing = [];
for (const r of rows) {
  const current = publicSvgHash(r.svg_file);
  if (!current) missing.push(r.code);
  else if (current !== r.svg_hash) drift.push(r.code);
}

console.log(`Checked ${rows.length} approved signs.`);
if (missing.length) console.log(`Missing SVG files: ${missing.join(", ")}`);
if (drift.length) {
  console.log(`\n⚠ DRIFT — ${drift.length} approved SVG(s) changed on disk:`);
  console.log("  " + drift.join(", "));
  process.exit(1);
}
console.log("No drift: every approved SVG matches its pinned hash. ✓");
