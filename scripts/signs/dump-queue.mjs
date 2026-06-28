#!/usr/bin/env node
/**
 * One-off: dump the admin exceptions queue (in-chart signs not yet content-approved).
 * Read-only. Prints a compact triage view of each queued sign + its verification.
 */
import { serviceClient } from "./lib.mjs";

const supabase = serviceClient();

// In-chart (sa_relevant) signs whose content gate is NOT approved = the queue.
const { data, error } = await supabase
  .from("road_signs")
  .select(
    "code, name, sa_relevant, asset_status, review_status, svg_file, content, verification",
  )
  .eq("sa_relevant", true)
  .neq("review_status", "approved")
  .order("code", { ascending: true });

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`\n=== Exceptions queue: ${data.length} signs ===\n`);
for (const s of data) {
  const v = s.verification || {};
  const c = s.content || {};
  const en = c.en || {};
  console.log(`──────────────────────────────────────────────`);
  console.log(`${s.code}  —  ${s.name}`);
  console.log(`  gates: asset=${s.asset_status}  review=${s.review_status}`);
  console.log(`  svg:   ${s.svg_file}`);
  if (v.confidence != null) console.log(`  conf:  ${v.confidence}`);
  if (v.suggestedName) console.log(`  chart name: ${v.suggestedName}`);
  if (v.chartPage) console.log(`  chart page: ${v.chartPage}`);
  if (v.alignment) console.log(`  alignment: ${v.alignment}`);
  if (v.reason) console.log(`  reason: ${v.reason}`);
  if (v.notes) console.log(`  notes: ${v.notes}`);
  if (en.summary) console.log(`  content.en.summary: ${en.summary}`);
  console.log("");
}
