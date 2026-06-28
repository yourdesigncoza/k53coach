#!/usr/bin/env node
/**
 * Phase 6 drift audit (docs/sign-accuracy-pipeline.md): read-only check that no
 * APPROVED sign's on-disk SVG has changed since it was approved (current file
 * sha256 vs the pinned svg_hash). Writes nothing — safe to run in CI. Exits 1 if
 * drift is found so a pipeline can fail on it.
 *
 * Also asserts every externally-sourced sign (approved_by 'ai:claude-code+brave')
 * carries non-empty verification.provenance — the audit trail for content drafted
 * from off-chart sources must never be lost.
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

// Provenance integrity for the external (Brave-grounded) cohort.
const { data: ext, error: extErr } = await supabase
  .from("road_signs")
  .select("code, verification")
  .like("approved_by", "ai:claude-code+brave%");
if (extErr) {
  console.error(extErr.message);
  process.exit(1);
}
const noProvenance = (ext ?? []).filter((r) => {
  const p = r.verification?.provenance;
  return !p || !p.urls?.length || !r.verification?.primarySource;
});

const drift = [];
const missing = [];
for (const r of rows) {
  const current = publicSvgHash(r.svg_file);
  if (!current) missing.push(r.code);
  else if (current !== r.svg_hash) drift.push(r.code);
}

console.log(`Checked ${rows.length} approved signs.`);
if (missing.length) console.log(`Missing SVG files: ${missing.join(", ")}`);
console.log(`Checked ${ext?.length ?? 0} external (Brave-grounded) signs for provenance.`);

let failed = false;
if (drift.length) {
  console.log(`\n⚠ DRIFT — ${drift.length} approved SVG(s) changed on disk:`);
  console.log("  " + drift.join(", "));
  failed = true;
}
if (noProvenance.length) {
  console.log(`\n⚠ PROVENANCE — ${noProvenance.length} external sign(s) missing provenance/primarySource:`);
  console.log("  " + noProvenance.map((r) => r.code).join(", "));
  failed = true;
}
if (failed) process.exit(1);
console.log("No drift; every approved SVG matches its pinned hash; external provenance intact. ✓");
