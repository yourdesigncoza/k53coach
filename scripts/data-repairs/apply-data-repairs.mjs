/**
 * Replay the 2026-07-24 data repairs and backfills.
 *
 * WHY THIS EXISTS: these three changes were originally applied straight to the
 * production database over the service-role REST API with no artifact in the
 * repo. An adversarial review flagged that a fresh environment (or a
 * `supabase db reset`) would silently diverge from production with no way to
 * tell what was missing. This script + its JSON make them reproducible.
 *
 * They are deliberately NOT migrations: all three are *data*, not schema, and
 * two of them (objective codes, related codes) are content decisions that will
 * keep changing as the question bank and marking library grow. A migration would
 * freeze one moment of that.
 *
 * What it replays:
 *   1. `questions.objective_code`  — which lesson each question sends a learner
 *      to when they get it wrong. Drives the dashboard's "Recommended next".
 *   2. `road_signs.name` repairs   — 13 W4xx hazard markers were serving with
 *      leaked wiki markup ('alt=|Railway crossing'), four with no name at all,
 *      while approved on BOTH gates. Restored from data/chart-authority.json.
 *      Plus R403, whose name was a raw wikilink.
 *   3. `road_signs.related_codes`  — bidirectional sign <-> marking links
 *      (R1 <-> RTM1 and friends), the client's requirement on K53-30.
 *
 * Idempotent: every write is a targeted PATCH to a known value, so reruns are
 * no-ops. Safe to run against a fresh environment after the markings seed.
 *
 * Usage: node scripts/data-repairs/apply-data-repairs.mjs [--dry-run]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry-run");
const ENV = readFileSync(join(HERE, "../../.env.local"), "utf8");

function env(pred) {
  const line = ENV.split("\n").find(pred);
  if (!line) throw new Error("required key missing from .env.local");
  return line.slice(line.indexOf("=") + 1).replace(/^"|"$/g, "").trim();
}
const SUPABASE_URL = env((l) => l.startsWith("NEXT_PUBLIC_SUPABASE_URL="));
const SERVICE_KEY = env((l) => l.includes("SERVICE_ROLE"));

const data = JSON.parse(
  readFileSync(join(HERE, "data-repairs-2026-07-24.json"), "utf8"),
);

async function patch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
}

const objectives = Object.entries(data.question_objective_codes);
const names = Object.entries(data.sign_name_repairs);
const related = Object.entries(data.sign_related_codes);

console.log(
  `objective codes: ${objectives.length}\n` +
    `name repairs   : ${names.length}\n` +
    `related codes  : ${related.length}`,
);
if (DRY) {
  console.log("\n--dry-run: nothing written.");
  process.exit(0);
}

for (const [id, code] of objectives) {
  await patch(`questions?id=eq.${encodeURIComponent(id)}`, {
    objective_code: code,
  });
}
console.log(`✓ ${objectives.length} objective codes`);

for (const [code, name] of names) {
  await patch(`road_signs?code=eq.${encodeURIComponent(code)}`, { name });
}
console.log(`✓ ${names.length} sign names`);

for (const [code, codes] of related) {
  await patch(`road_signs?code=eq.${encodeURIComponent(code)}`, {
    related_codes: codes,
  });
}
console.log(`✓ ${related.length} related-code links`);
