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
//
// "Conservative" was not enough on its own — the 2026-07-30 citation sweep found
// three entries here that named a real code for the WRONG glyph, and the image
// renders directly above the prompt (question-card.tsx), so it contradicted the
// stem. Each entry below is now pinned to the road_signs name it resolves to.
// Before adding one, check data/verify/verdicts/<code>.json describes the glyph
// the wiki name means, not merely a sign whose name sounds similar.
const SIGN_NAME_TO_CODE = {
  "Stop Sign": "R1", // Stop
  "Yield Sign": "R2", // Yield
  "No Entry Sign": "R3", // No entry
  "Children Sign": "W308", // Children ahead
  "Slippery Road Sign": "W333", // Slippery road ahead
  "Traffic Circle Ahead Sign": "W201", // Traffic circle ahead
  "No Stopping Sign": "R217", // Stopping prohibited
  "Pedestrian Crossing Warning Sign": "W306", // Pedestrian crossing ahead
  "T-Junction Sign": "W104", // T-junction ahead (square-on inverted T).
  // was W409, which is the T-junction CHEVRON board — not a triangle at all.
  // W105/W106 are the SKEW variants and are not what "T-junction" means bare.
  "Two-Way Traffic Sign": "W212", // Two-way traffic ahead
  "Road Narrows Sign": "W328", // Roadway narrows from both sides ahead.
  // was W214 = "Right lane ends ahead", a merge arrow, not a narrowing road.
  "Steep Descent Sign": "W322", // Steep descent ahead
  "Gravel Road Sign": "W325", // Unpaved road surface ahead
  "Speed Humps Sign": "W332", // Speed humps ahead
  "Wild Animals Sign": "W313", // Wild animals ahead
  "Height Limit Sign": "R204", // Height limit
  "Roundabout Sign": "R137", // Roundabout
  "Stop Go Sign": "R1.5", // Stop/go
  "No U-Turn Sign": "R213", // U-turn prohibited
  // DELIBERATELY UNMAPPED — there is no such sign, so any code would be a lie:
  //   "Speed Limit Sign"  — R201-<n> is one sign per speed. The name alone
  //     cannot say which, and it was pinned to R201-60 on an 80 km/h question.
  //   "Pedestrian Crossing Regulatory Sign" — was R5, which is the pedestrian
  //     PRIORITY ZONE sign (red, per data/verify/verdicts/R5.json). South Africa
  //     has no blue rectangular pedestrian-crossing command sign; that is the
  //     Vienna Convention. RS-041 rested on it and has been withdrawn.
};

// `related_signs` records what a question RELATES to, which for a "which sign is
// it — A, B or C?" item is often a distractor rather than the sign under test.
// RS-027 shipped rendering the gravel sign above a question whose distractor (0)
// is the gravel sign. Per-question overrides win over the name map.
const SIGN_CODE_OVERRIDES = {
  "RS-027": "W333", // asks which sign shows the skidding car; related_signs names the gravel distractor
  "RS-004": "R201-80", // "Speed Limit Sign" is deliberately unmapped; this item names 80 km/h
};

// Questions the citation sweep found unsound. They are still emitted — deleting
// a row from a generated seed loses the record of why it went — but as
// review_status='draft', so no learner surface serves them (getPracticeQuestions
// filters on review_status alone, so in_exam=false would not be enough).
const WITHDRAWN = {
  "RS-041":
    "No blue rectangular pedestrian-crossing sign exists in South Africa; " +
    "Schedule 1 R5 is a red pedestrian-PRECINCT sign. Vienna Convention, not SA.",
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

/**
 * The note body's `## Explanation` section, preferred over the frontmatter copy.
 *
 * Whatever wrote the wiki notes cut the frontmatter `explanation:` scalar at
 * exactly 200 characters — 11 of the 110 notes ended mid-word ("…not exempt from
 * rep"), and they shipped that way to learners until 2026-07-30. The body section
 * is the same prose untruncated, so it is the source of truth; the frontmatter is
 * the fallback for a note that has no body section.
 */
function explanationOf(text, fm, file) {
  const body = text.match(/^## Explanation\s*\n([\s\S]*?)(?=\n##\s|\s*$)/m);
  const fromBody = body ? body[1].trim() : "";
  const fromFm = unquote(fm.explanation);
  if (!fromBody && !fromFm) throw new Error(`${file}: no explanation`);
  return fromBody || fromFm;
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

    const id = unquote(fm.question_id);

    // sign_code: a per-question override first, else the conservative map
    // (first mappable related sign).
    let signCode = SIGN_CODE_OVERRIDES[id] ?? null;
    if (!signCode) {
      for (const name of parseList(fm.related_signs)) {
        if (SIGN_NAME_TO_CODE[name]) {
          signCode = SIGN_NAME_TO_CODE[name];
          signStats.mapped++;
          break;
        }
        signStats.unmapped[name] = (signStats.unmapped[name] || 0) + 1;
      }
    }

    const topicTag = unquote(fm.topic).replace(/\[\[|\]\]/g, "") || null;

    rows.push({
      id,
      topic,
      difficulty,
      prompt: unquote(fm.question_text),
      options: opts,
      answer,
      explanation: explanationOf(text, fm, file),
      signCode,
      topicTag,
      likelihood,
      codes,
      sourceBasis: unquote(fm.source_basis) || null,
      sortOrder: Number(id.replace(/\D/g, "")) || 0,
      withdrawn: WITHDRAWN[id] ?? null,
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
        `${pgArray(r.codes)}, ${r.withdrawn ? "false" : "true"}, false, ` +
        `${r.sourceBasis ? q(r.sourceBasis) : "null"}, ` +
        `${r.withdrawn ? "'draft'" : "'approved'"}, ${r.sortOrder})`
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
