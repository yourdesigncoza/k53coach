/**
 * Build a Supabase seed migration from the K53 wiki's original question bank.
 *
 *   node scripts/exam/build-questions-migration.mjs
 *
 * Reads the 110 reviewed question notes at
 *   ~/zoot/projects/wiki-builds/k53/wiki/Questions/*.md
 * (line-regular YAML frontmatter, 3-option A/B/C MCQ) and emits
 *   supabase/migrations/<ts>_exam_question_bank.sql
 * with one `insert … on conflict (id) do nothing` per question, mapped into the
 * existing DB4 `questions` schema plus the exam columns from 20260705120000.
 *
 * Zero-dependency, mirroring scripts/signs/*.mjs. The generated migration is the
 * reproducible, versioned artifact — apply it with `supabase db push`.
 *
 * `sign_code` is set only from a conservative, hand-verified name→code map; any
 * name not in the map (or whose code we can't vouch for) is left null so a
 * question never renders a WRONG sign image. sign_code is cosmetic; a null just
 * means the question shows no artwork.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";

const WIKI_DIR = resolve(
  homedir(),
  "zoot/projects/wiki-builds/k53/wiki/Questions",
);
const OUT_TS = "20260705120500";
const OUT_FILE = resolve(
  "supabase/migrations",
  `${OUT_TS}_exam_question_bank.sql`,
);

// section (frontmatter) -> Topic (DB)
const SECTION_TO_TOPIC = {
  rules_of_the_road: "rules",
  road_signs_signals_markings: "signs",
  vehicle_controls: "controls",
};

// difficulty label -> smallint
const DIFFICULTY = { easy: 1, medium: 2, hard: 3 };

// vehicle_codes frontmatter token -> expanded code set
const CODE_EXPAND = {
  all_codes: ["A", "B", "C", "EB"],
  code_a_motorcycle: ["A"],
  code_b_light_motor_vehicle: ["B"],
  code_c_heavy_vehicle: ["C"],
  code_eb_combination: ["EB"],
};

// Conservative, hand-verified wiki-sign-name -> DB sign code map. Only entries we
// checked against the approved+sa_relevant road_signs set are included; every
// other related_sign resolves to null (no image) rather than risk a wrong glyph.
const SIGN_NAME_TO_CODE = {
  "Stop Sign": "R1",
  "Yield Sign": "R2",
  "No Entry Sign": "R3",
  "Speed Limit Sign": "R201-60",
  "Children Sign": "W308",
  "Slippery Road Sign": "W333",
  "Traffic Circle Ahead Sign": "W201",
  "No Stopping Sign": "R217",
  "Pedestrian Crossing Warning Sign": "W306",
  "T-Junction Sign": "W409",
  "Two-Way Traffic Sign": "W212",
  "Road Narrows Sign": "W214",
  "Steep Descent Sign": "W322",
  "Gravel Road Sign": "W325",
  "Speed Humps Sign": "W332",
  "Wild Animals Sign": "W313",
  "Height Limit Sign": "R204",
  "Roundabout Sign": "R137",
  "Stop Go Sign": "R1.5",
  "No U-Turn Sign": "R213",
  "Pedestrian Crossing Regulatory Sign": "R5",
};

/** Parse the leading `--- … ---` YAML frontmatter into a flat object. */
function parseFrontmatter(text, file) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`${file}: no frontmatter`);
  const body = m[1];
  const lines = body.split("\n");
  const fm = {};
  const opts = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // answer_options: block — indented A/B/C on following lines
    if (/^answer_options:\s*$/.test(line)) {
      for (let j = i + 1; j < lines.length; j++) {
        const o = lines[j].match(/^\s+([ABC]):\s*"?(.*?)"?\s*$/);
        if (!o) break;
        opts[o[1]] = o[2];
        i = j;
      }
      continue;
    }
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  fm._options = opts;
  return fm;
}

/** Strip surrounding quotes from a scalar frontmatter value. */
function unquote(v) {
  if (v == null) return "";
  return v.replace(/^"(.*)"$/, "$1").trim();
}

/** Parse a `[a, b, c]` list, unwrapping [[wikilinks]] and quotes. */
function parseList(v) {
  const inner = (v || "").replace(/^\[/, "").replace(/\]$/, "").trim();
  if (!inner) return [];
  return inner
    .split(",")
    .map((s) => s.replace(/\[\[|\]\]|"/g, "").trim())
    .filter(Boolean);
}

/** SQL single-quote escape. */
function q(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

/** A text[] literal for pg. */
function pgArray(arr) {
  return `'{${arr.map((c) => `"${c}"`).join(",")}}'`;
}

function main() {
  const files = readdirSync(WIKI_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const rows = [];
  const pools = { rules: 0, signs: 0, controls: 0 };
  const signStats = { mapped: 0, unmapped: {} };

  for (const file of files) {
    const text = readFileSync(join(WIKI_DIR, file), "utf8");
    const fm = parseFrontmatter(text, file);

    const section = unquote(fm.section);
    const topic = SECTION_TO_TOPIC[section];
    if (!topic) throw new Error(`${file}: unknown section "${section}"`);

    const difficulty = DIFFICULTY[unquote(fm.difficulty)];
    if (!difficulty) throw new Error(`${file}: bad difficulty "${fm.difficulty}"`);

    const likelihood = unquote(fm.exam_likelihood) || "medium";
    if (!["high", "medium", "low"].includes(likelihood))
      throw new Error(`${file}: bad exam_likelihood "${likelihood}"`);

    const opts = ["A", "B", "C"].map((k) => {
      const v = fm._options[k];
      if (v == null) throw new Error(`${file}: missing option ${k}`);
      return v;
    });
    const correctLetter = unquote(fm.correct_answer);
    const answer = ["A", "B", "C"].indexOf(correctLetter);
    if (answer < 0) throw new Error(`${file}: bad correct_answer "${correctLetter}"`);

    // vehicle codes (expanded, deduped)
    const rawCodes = parseList(fm.vehicle_codes);
    const codeSet = new Set();
    for (const c of rawCodes) {
      const expanded = CODE_EXPAND[c] || [c];
      for (const e of expanded) codeSet.add(e);
    }
    const codes = [...codeSet];
    if (!codes.length) throw new Error(`${file}: no vehicle_codes`);

    // sign_code from the conservative map (first mappable related sign)
    let signCode = null;
    for (const name of parseList(fm.related_signs)) {
      if (SIGN_NAME_TO_CODE[name]) {
        signCode = SIGN_NAME_TO_CODE[name];
        signStats.mapped++;
        break;
      }
      signStats.unmapped[name] = (signStats.unmapped[name] || 0) + 1;
    }

    const topicTag = unquote(fm.topic).replace(/\[\[|\]\]/g, "") || null;

    rows.push({
      id: unquote(fm.question_id),
      topic,
      difficulty,
      prompt: unquote(fm.question_text),
      options: opts,
      answer,
      explanation: unquote(fm.explanation),
      signCode,
      topicTag,
      likelihood,
      codes,
      sourceBasis: unquote(fm.source_basis) || null,
      sortOrder: Number(unquote(fm.question_id).replace(/\D/g, "")) || 0,
    });
    pools[topic]++;
  }

  // Build the migration SQL.
  const header = `-- Generated by scripts/exam/build-questions-migration.mjs — do not edit by hand.
-- ${rows.length} original K53 questions from the wiki bank, imported as approved
-- exam-pool material (review_status='approved', in_exam=true, in_readiness=false).
-- Re-runnable: on conflict (id) do nothing.

insert into public.questions
  (id, topic, difficulty, prompt, options, answer, explanation, sign_code,
   topic_tag, exam_likelihood, vehicle_codes, in_exam, in_readiness,
   source_basis, review_status, sort_order)
values
`;

  const values = rows
    .map((r) => {
      const optionsJson = JSON.stringify(r.options);
      return (
        `  (${q(r.id)}, ${q(r.topic)}, ${r.difficulty}, ${q(r.prompt)}, ` +
        `${q(optionsJson)}::jsonb, ${r.answer}, ${q(r.explanation)}, ` +
        `${r.signCode ? q(r.signCode) : "null"}, ` +
        `${r.topicTag ? q(r.topicTag) : "null"}, ${q(r.likelihood)}, ` +
        `${pgArray(r.codes)}, true, false, ` +
        `${r.sourceBasis ? q(r.sourceBasis) : "null"}, 'approved', ${r.sortOrder})`
      );
    })
    .join(",\n");

  const sql = `${header}${values}\non conflict (id) do nothing;\n`;
  writeFileSync(OUT_FILE, sql);

  // Report.
  console.log(`Wrote ${OUT_FILE}`);
  console.log(`  ${rows.length} questions total`);
  console.log(`  pool by topic: rules ${pools.rules}, signs ${pools.signs}, controls ${pools.controls}`);
  console.log(`  sign_code mapped: ${signStats.mapped}`);
  const unmapped = Object.entries(signStats.unmapped).sort((a, b) => b[1] - a[1]);
  if (unmapped.length) {
    console.log(`  related_signs left null (no verified code): ${unmapped.length} distinct`);
    for (const [name, n] of unmapped) console.log(`    - ${name} (${n})`);
  }
}

main();
