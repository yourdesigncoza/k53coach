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
 * Usage: node scripts/exam/generated/seed-generated-questions.mjs --series=<name> [--dry-run]
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../../..");
const DRY = process.argv.includes("--dry-run");
// Which model actually drafted a batch is provenance, not decoration — it lives
// per series so a later batch cannot silently inherit an earlier run's model name.

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

/**
 * One entry per question series. `start` continues the existing id run rather
 * than restarting it, so re-running is deterministic: the same batch files
 * always produce the same ids.
 */
const SERIES = {
  rules: {
    prefix: "RR", topic: "rules", start: 37,
    match: /^rules-batch-.*\.json$/, generatedBy: "ai:claude-opus-4-8",
  },
  signs: {
    prefix: "RS", topic: "signs", start: 43,
    match: /^signs-batch-.*\.json$/, generatedBy: "ai:claude-opus-5",
  },
};

const name = process.argv.find((a) => a.startsWith("--series="))?.split("=")[1];
if (!name || !SERIES[name]) {
  console.error(`usage: seed-generated-questions.mjs --series=<${Object.keys(SERIES).join("|")}> [--dry-run]`);
  console.error("--series is required on purpose: see the approved-row guard below.");
  process.exit(1);
}
const { prefix, topic, start: START, match, generatedBy: GENERATED_BY } = SERIES[name];

const files = readdirSync(HERE).filter((f) => match.test(f));
if (!files.length) {
  console.error(`no batch files matching ${match} in ${HERE}`);
  process.exit(1);
}
const rows = [];
for (const f of files.sort()) {
  for (const q of JSON.parse(readFileSync(join(HERE, f), "utf8"))) {
    rows.push(q);
  }
}

const payload = rows.map((q, i) => ({
  id: `${prefix}-${String(START + i).padStart(3, "0")}`,
  topic,
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

/**
 * Approved-row guard. The upsert below uses `resolution=merge-duplicates` so an
 * edited batch file can be re-seeded — but every row it writes carries
 * `review_status: 'draft'`, so re-running over ids a human has since APPROVED
 * would silently revoke those approvals and throw away the sign-off. That is
 * the one thing the accuracy gate cannot survive, so it is checked, not trusted.
 */
const idList = payload.map((p) => p.id).join(",");
const check = await fetch(
  `${SUPABASE_URL}/rest/v1/questions?select=id,review_status&id=in.(${idList})&review_status=eq.approved`,
  { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
);
if (!check.ok) {
  console.error(`guard query failed ${check.status}: ${await check.text()}`);
  process.exit(1);
}
const approved = await check.json();
if (approved.length) {
  console.error(
    `REFUSING: ${approved.length} of these ids are already approved — re-seeding would reset them to draft and discard the human sign-off.`,
  );
  console.error(`  ${approved.map((r) => r.id).join(", ")}`);
  console.error("Give the new questions their own id range, or edit the approved rows via a data repair instead.");
  process.exit(1);
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
