#!/usr/bin/env node
/**
 * Permanently remove excluded (sa_relevant=false) signs that are NOT in the
 * official chart — the duplicates / non-SA / artifact rows. GUARDED: a candidate
 * whose code appears in data/chart-authority.json (the source of truth derived
 * from init/RTSigns_charts.pdf) is NEVER deleted; the run aborts if one is found.
 *
 * Removes, for each confirmed candidate: the road_signs row, its orphan SVG under
 * public/signs/ (only if no surviving sign references it), and its entry in
 * data/signs-catalog.json (so a re-seed cannot resurrect it).
 *
 * Idempotent. Usage: node scripts/signs/purge-excluded.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { serviceClient } from "./lib.mjs";

const DRY = process.argv.includes("--dry-run");
const supabase = serviceClient();

const chart = JSON.parse(readFileSync(resolve("data/chart-authority.json"), "utf8"));
const chartCodes = new Set(chart.map((c) => c.code));

const { data: all, error } = await supabase
  .from("road_signs")
  .select("sign_id, code, svg_file, sa_relevant");
if (error) {
  console.error(error.message);
  process.exit(1);
}

const candidates = all.filter((r) => r.sa_relevant === false);

// GUARD 1: never delete a code that is in the official chart.
const inChart = candidates.filter((r) => chartCodes.has(r.code));
if (inChart.length) {
  console.error(`ABORT — ${inChart.length} candidate(s) are in the official chart (source of truth):`);
  for (const r of inChart) console.error(`  ${r.code}`);
  process.exit(1);
}

// GUARD 2: don't delete an SVG still referenced by a surviving (non-candidate) sign.
const survivingSvgs = new Set(
  all.filter((r) => r.sa_relevant !== false).map((r) => r.svg_file).filter(Boolean),
);

console.log(`Purging ${candidates.length} excluded, not-in-chart signs (guard passed).`);

if (DRY) {
  for (const r of candidates) {
    const shared = survivingSvgs.has(r.svg_file) ? " (SVG kept — shared)" : "";
    console.log(`  - ${r.code}  ${r.svg_file}${shared}`);
  }
  console.log("\n--dry-run: no deletes.");
  process.exit(0);
}

// 1. Delete the DB rows.
const codes = candidates.map((r) => r.code);
for (let i = 0; i < codes.length; i += 50) {
  const batch = codes.slice(i, i + 50);
  const { error: delErr } = await supabase.from("road_signs").delete().in("code", batch);
  if (delErr) { console.error(`delete batch ${i}: ${delErr.message}`); process.exit(1); }
}
console.log(`Deleted ${codes.length} road_signs rows.`);

// 2. Delete orphan SVG files (only if no surviving sign uses them).
let svgDeleted = 0;
for (const r of candidates) {
  if (!r.svg_file || survivingSvgs.has(r.svg_file)) continue;
  const p = resolve("public", r.svg_file);
  if (existsSync(p)) { rmSync(p); svgDeleted++; }
}
console.log(`Deleted ${svgDeleted} orphan SVG files.`);

// 3. Drop their entries from the ingest catalog so a re-seed won't bring them back.
const catalogPath = resolve("data/signs-catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const codeSet = new Set(codes);
const kept = catalog.filter((c) => !codeSet.has(c.code));
writeFileSync(catalogPath, JSON.stringify(kept, null, 2) + "\n");
console.log(`Catalog: ${catalog.length} -> ${kept.length} entries.`);
