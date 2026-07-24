/**
 * Seed AI-drafted exam questions into the DB4 `questions` bank.
 *
 * Every row lands as `review_status: 'draft'`. The exam pool is
 * `review_status='approved' AND in_exam`, so nothing here reaches a learner
 * until a human approves it — that is the accuracy gate (CLAUDE.md constraint
 * 9), not an oversight. `in_exam` is set true so approval is the only remaining
 * step.
 *
 * Provenance is recorded on every row:
 *   generated_by     — the model that drafted it
 *   source_citation  — the provision the question rests on, inherited from the
 *                      learning object it was derived from
 *   objective_code   — the lesson a learner is sent to when they get it wrong
 *
 * Questions were derived from learning objects that already carry citations,
 * rather than written free-hand, so a wrong answer is traceable to a provision.
 *
 * Usage: node scripts/exam/generated/seed-generated-questions.mjs [--dry-run]
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../../..");
const DRY = process.argv.includes("--dry-run");
const GENERATED_BY = "ai:claude-opus-4-8";

const ENV = readFileSync(join(ROOT, ".env.local"), "utf8");
const pick = (pred) => {
  const l = ENV.split("\n").find(pred);
  if (!l) throw new Error("required key missing from .env.local");
  return l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "").trim();
};
const SUPABASE_URL = pick((l) => l.startsWith("NEXT_PUBLIC_SUPABASE_URL="));
const SERVICE_KEY = pick((l) => l.includes("SERVICE_ROLE"));

// Citations live on the learning objects; a question inherits its object's.
const CITES = Object.fromEntries(
  JSON.parse(readFileSync(join(HERE, "objective-citations.json"), "utf8")).map(
    (o) => [o.code, o.cite],
  ),
);

const files = readdirSync(HERE).filter((f) => /^rules-batch-.*\.json$/.test(f));
const rows = [];
for (const f of files.sort()) {
  for (const q of JSON.parse(readFileSync(join(HERE, f), "utf8"))) {
    rows.push(q);
  }
}

// Continue the existing RR-nnn id series rather than restarting it.
const START = 37;
const payload = rows.map((q, i) => ({
  id: `RR-${String(START + i).padStart(3, "0")}`,
  topic: "rules",
  difficulty: q.difficulty,
  prompt: q.prompt,
  options: q.options,
  answer: q.answer,
  explanation: q.explanation,
  objective_code: q.objective_code,
  topic_tag: q.topic_tag,
  exam_likelihood: q.exam_likelihood,
  vehicle_codes: q.vehicle_codes,
  in_exam: true,
  in_readiness: false,
  source_basis: "legislation",
  source_citation: CITES[q.objective_code] || null,
  generated_by: GENERATED_BY,
  review_status: "draft",
  sort_order: START + i,
}));

const missing = payload.filter((p) => !p.source_citation).map((p) => p.objective_code);
console.log(`${payload.length} questions -> ${payload[0].id}..${payload.at(-1).id}`);
if (missing.length) {
  console.log(
    `note: ${missing.length} inherit no citation (objects ${[...new Set(missing)].join(", ")} predate the citation convention) — flagged for the verification pass`,
  );
}

if (DRY) {
  console.log("--dry-run: nothing written.");
  process.exit(0);
}

const res = await fetch(`${SUPABASE_URL}/rest/v1/questions?on_conflict=id`, {
  method: "POST",
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  },
  body: JSON.stringify(payload),
});
if (!res.ok) {
  console.error(`FAILED ${res.status}: ${await res.text()}`);
  process.exit(1);
}
console.log(`Upserted ${payload.length} questions as draft (invisible to learners until approved).`);
