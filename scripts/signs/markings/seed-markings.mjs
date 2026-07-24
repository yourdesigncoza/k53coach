/**
 * Seed the road-markings library (DB1, category='marking') into `road_signs`.
 *
 * Content written from the official SADC/SA Road Traffic Signs Manual Vol 1 Ch 7
 * (May 2012) and the National Road Traffic Regulations, 2000 — see the
 * `source` + `confidence` fields on every record.
 *
 * Two things this script deliberately does NOT do:
 *
 *  1. It does not set `asset_status='approved'`. There is no artwork yet —
 *     markings are road-surface diagrams and, unlike the SADC signs, no
 *     public-domain SVG set exists, so each must be drawn and chart-verified.
 *  2. It does not set `review_status='approved'`. This is AI-drafted content
 *     pending human verification (accuracy gate, CLAUDE.md constraint 9).
 *
 * Both gates plus `sa_relevant` control the served set, so these rows are
 * invisible to learners until a human approves them. That is the intended
 * behaviour, not an oversight.
 *
 * Usage: node scripts/signs/markings/seed-markings.mjs [--dry-run]
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry-run");

function env(key) {
  const line = readFileSync(join(HERE, "../../../.env.local"), "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} missing from .env.local`);
  return line.slice(key.length + 1).replace(/^"|"$/g, "").trim();
}

const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY =
  readFileSync(join(HERE, "../../../.env.local"), "utf8")
    .split("\n")
    .find((l) => l.includes("SERVICE_ROLE"))
    .split("=")
    .slice(1)
    .join("=")
    .replace(/^"|"$/g, "")
    .trim();

const files = readdirSync(HERE).filter(
  (f) => f.endsWith(".json") && f !== "package.json",
);
const markings = files.flatMap((f) =>
  JSON.parse(readFileSync(join(HERE, f), "utf8")),
);

const rows = markings.map((m) => ({
  code: m.code,
  name: m.name,
  category: "marking",
  subcategory: m.subcategory,
  temporary: false,
  in_official_chart: true, // present in SARTSM Vol 1 Ch 7
  sa_relevant: true,
  content: m.content,
  related_codes: m.related_codes ?? [],
  source: "SADC/SA Road Traffic Signs Manual Vol 1 Ch 7 (May 2012)",
  source_url:
    "https://www.transport.gov.za/wp-content/uploads/2023/02/V1C7.pdf",
  licence: "Official government text (SA Copyright Act §12(8)(a))",
  attribution_required: false,
  // No artwork yet, and not human-verified yet — both gates stay closed.
  asset_status: "needs_review",
  review_status: "draft",
  // `confidence` in this column is a NUMERIC score consumed by the admin
  // exceptions queue (it calls .toFixed()). The drafting pass's prose
  // confidence note goes in its own key — writing it as `confidence` crashed
  // the admin page server-side.
  verification: { source: m.source, note: m.confidence },
}));

console.log(`${rows.length} markings from ${files.length} files:`);
for (const r of rows) console.log(`  ${r.code.padEnd(7)} ${r.name}`);

if (DRY) {
  console.log("\n--dry-run: nothing written.");
  process.exit(0);
}

// on_conflict=code: the PK is sign_id (a generated uuid we never supply), so
// without this a rerun collides on the road_signs_code_key unique constraint
// instead of merging. Found by adversarial review, confirmed by a failing rerun.
const res = await fetch(`${SUPABASE_URL}/rest/v1/road_signs?on_conflict=code`, {
  method: "POST",
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  },
  body: JSON.stringify(rows),
});

if (!res.ok) {
  console.error(`\nFAILED ${res.status}: ${await res.text()}`);
  process.exit(1);
}
console.log(`\nUpserted ${rows.length} markings (draft, both gates closed).`);
