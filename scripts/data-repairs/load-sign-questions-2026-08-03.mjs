/**
 * Load the 2026-08-03 sign-question batch into the DB4 bank as DRAFTS.
 *
 *   node scripts/data-repairs/load-sign-questions-2026-08-03.mjs <batch.json> [--dry-run]
 *
 * WHY A LOADER AND NOT A MIGRATION: same reason as the other files in this folder —
 * this is content, not schema, and the bank keeps moving. The batch JSON alongside it
 * is the record of what was inserted and why.
 *
 * WHY EVERYTHING LANDS AS `draft`: CLAUDE.md constraint 9. These were drafted by AI
 * against verified `road_signs` content and carry a citation each, but AI never
 * self-certifies — a named human approves them in admin, which is now the only path
 * that stamps approved_by/verified_at. Do not add review_status:'approved' here.
 *
 * Re-running is safe: an id that already exists is skipped, not overwritten.
 */
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { select, insert } from "./supabase-rest.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry-run");
const arg = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!arg) {
  console.error("usage: load-sign-questions-2026-08-03.mjs <batch.json> [--dry-run]");
  process.exit(1);
}

const batch = JSON.parse(
  readFileSync(isAbsolute(arg) ? arg : join(HERE, arg), "utf8"),
);

const existing = new Set((await select("questions?select=id&limit=500")).map((r) => r.id));
const served = new Set(
  (
    await select(
      "road_signs?select=code&review_status=eq.approved&asset_status=eq.approved&sa_relevant=is.true&limit=500",
    )
  ).map((r) => r.code),
);
const maxSort = Math.max(
  ...(await select("questions?select=sort_order&limit=500")).map((r) => r.sort_order),
);

let n = 0;
let skipped = 0;
let sort = maxSort;

for (const q of batch) {
  if (existing.has(q.id)) {
    console.log(`  = ${q.id} — already present, skipped`);
    skipped++;
    continue;
  }
  // Guard rails. A bad sign_code renders a broken image to a learner; a missing
  // citation makes the item unapprovable under the new editor rule.
  // sign_code is optional — a concept question (e.g. the temporary-signage set) has
  // no single sign to render. Only validate it when one is given.
  if (q.sign_code != null && !served.has(q.sign_code))
    throw new Error(`${q.id}: sign_code ${q.sign_code} is not served`);
  if (!q.source_citation?.trim()) throw new Error(`${q.id}: no source_citation`);
  if (q.options.length !== 3) throw new Error(`${q.id}: ${q.options.length} options, expected 3`);
  if (!(q.answer >= 0 && q.answer < 3)) throw new Error(`${q.id}: answer out of range`);

  const row = {
    id: q.id,
    topic: "signs",
    difficulty: q.difficulty ?? 2,
    prompt: q.prompt,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
    sign_code: q.sign_code,
    objective_code: q.objective_code,
    source_citation: q.source_citation,
    generated_by: "ai:claude-code (drafting team, 2026-08-03)",
    topic_tag: q.topic_tag ?? null,
    exam_likelihood: q.exam_likelihood ?? "medium",
    vehicle_codes: ["A", "B", "C", "EB"],
    in_exam: true,
    in_readiness: false,
    review_status: "draft",
    sort_order: ++sort,
  };
  console.log(`  → ${q.id}  ${(q.sign_code ?? "—").padEnd(8)} ${q.prompt.slice(0, 62)}…`);
  if (!DRY) await insert("questions", row);
  n++;
}

console.log(`\n${DRY ? "would insert" : "inserted"}: ${n}   skipped: ${skipped}`);
