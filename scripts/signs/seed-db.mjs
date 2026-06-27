#!/usr/bin/env node
/**
 * Seed/refresh the road_signs table (DB1) from data/signs-catalog.json.
 *
 * DRIFT-SAFE (docs/sign-accuracy-pipeline.md Phase 6): re-running after a fresh
 * Wikipedia ingest updates artwork/metadata for unverified signs, but NEVER
 * clobbers an already-approved sign — its asset_status and svg_file are pinned.
 * If an approved sign's SVG content has changed upstream (current file sha256 ≠
 * the stored svg_hash), it is reported as DRIFT for human review instead of being
 * silently overwritten. `content` and the review gates are never touched here.
 *
 * `source_rev` records the at-ingest SVG sha256 (per-file integrity baseline).
 * Uses the service-role key (bypasses RLS) from .env.local.
 *
 * Usage: node scripts/signs/seed-db.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { serviceClient, publicSvgHash } from "./lib.mjs";

const supabase = serviceClient();
const catalog = JSON.parse(
  readFileSync(resolve("data/signs-catalog.json"), "utf8"),
);

// Existing rows: we need their identity + verification state to protect approvals.
const { data: existingRows, error: exErr } = await supabase
  .from("road_signs")
  .select("sign_id, code, asset_status, svg_hash");
if (exErr) {
  console.error(exErr.message);
  process.exit(1);
}
const existing = new Map(existingRows.map((r) => [r.code, r]));

const inserts = [];
const updates = [];
const drift = [];

for (const s of catalog) {
  const currentHash = publicSvgHash(s.provenance.svgFile);
  const meta = {
    name: s.name,
    category: s.category,
    subcategory: s.subcategory,
    temporary: s.temporary,
    in_official_chart: s.inOfficialChart,
    source: s.provenance.source,
    source_url: s.provenance.sourceUrl,
    licence: s.provenance.licence,
    attribution_required: s.provenance.attributionRequired,
    source_rev: currentHash,
  };
  const asset = {
    svg_file: s.provenance.svgFile,
    asset_status: s.provenance.assetStatus,
  };

  const prev = existing.get(s.code);
  if (!prev) {
    inserts.push({ code: s.code, ...meta, ...asset });
    continue;
  }

  if (prev.asset_status === "approved") {
    // Pin the approved artwork. Only refresh non-asset metadata.
    updates.push({ sign_id: prev.sign_id, code: s.code, patch: meta });
    if (prev.svg_hash && currentHash && currentHash !== prev.svg_hash) {
      drift.push({ code: s.code, approved: prev.svg_hash, current: currentHash });
    }
  } else {
    // Not yet approved — safe to refresh artwork + metadata.
    updates.push({ sign_id: prev.sign_id, code: s.code, patch: { ...meta, ...asset } });
  }
}

// Apply inserts.
let ok = 0;
for (let i = 0; i < inserts.length; i += 100) {
  const batch = inserts.slice(i, i + 100);
  const { error } = await supabase.from("road_signs").insert(batch);
  if (error) {
    console.error(`insert ${i}: ${error.message}`);
    process.exit(1);
  }
  ok += batch.length;
}
// Apply updates (per-row; columns vary by approval state).
for (let i = 0; i < updates.length; i += 25) {
  const batch = updates.slice(i, i + 25);
  const results = await Promise.all(
    batch.map(({ sign_id, patch }) =>
      supabase.from("road_signs").update(patch).eq("sign_id", sign_id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed) {
    console.error(`update ${i}: ${failed.error.message}`);
    process.exit(1);
  }
  ok += batch.length;
}

const { count } = await supabase
  .from("road_signs")
  .select("*", { count: "exact", head: true });
console.log(
  `Seeded ${ok} signs (${inserts.length} new, ${updates.length} updated). Table now has ${count} rows.`,
);
if (drift.length) {
  console.log(`\n⚠ DRIFT — ${drift.length} approved sign(s) changed upstream (NOT overwritten):`);
  for (const d of drift) console.log(`  ${d.code}: approved ${d.approved.slice(0, 12)} → current ${d.current.slice(0, 12)}`);
  console.log("Review each in /admin before re-approving the new artwork.");
}
