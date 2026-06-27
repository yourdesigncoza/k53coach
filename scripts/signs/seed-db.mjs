#!/usr/bin/env node
/**
 * Seed/refresh the road_signs table (DB1) from data/signs-catalog.json.
 *
 * Upserts ASSET + provenance columns only — `content` and `review_status` are
 * omitted, so re-running after a fresh ingest updates artwork/metadata without
 * clobbering admin-drafted learner content. Uses the service-role key (bypasses
 * RLS) from .env.local.
 *
 * Usage: node scripts/signs/seed-db.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(".env.local"), "utf8").split(
      /\r?\n/,
    )) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {
    /* no .env.local */
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const catalog = JSON.parse(
  readFileSync(resolve("data/signs-catalog.json"), "utf8"),
);

const rows = catalog.map((s) => ({
  code: s.code,
  name: s.name,
  category: s.category,
  subcategory: s.subcategory,
  temporary: s.temporary,
  in_official_chart: s.inOfficialChart,
  svg_file: s.provenance.svgFile,
  source: s.provenance.source,
  source_url: s.provenance.sourceUrl,
  licence: s.provenance.licence,
  attribution_required: s.provenance.attributionRequired,
  asset_status: s.provenance.assetStatus,
}));

let ok = 0;
for (let i = 0; i < rows.length; i += 100) {
  const batch = rows.slice(i, i + 100);
  const { error } = await supabase
    .from("road_signs")
    .upsert(batch, { onConflict: "code" });
  if (error) {
    console.error(`batch ${i}: ${error.message}`);
    process.exit(1);
  }
  ok += batch.length;
}

const { count } = await supabase
  .from("road_signs")
  .select("*", { count: "exact", head: true });
console.log(`Upserted ${ok} signs. Table now has ${count} rows.`);
