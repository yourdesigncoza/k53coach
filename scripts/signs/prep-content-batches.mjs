#!/usr/bin/env node
/**
 * Phase 3 (content-factuality pass, step 1): chunk the asset-approved signs into
 * text-only audit batches. An independent agent re-checks each sign's drafted
 * English content against the chart ground truth (code + chart name + meaning) —
 * a second opinion that can DEMOTE content the drafting agent wrongly passed.
 *
 * Output: data/verify/content-batches/cbatch-NNN.json
 * Usage: node scripts/signs/prep-content-batches.mjs [batchSize]
 */
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { serviceClient } from "./lib.mjs";

const BATCH_SIZE = Number(process.argv[2] || 25);
const DIR = resolve("data/verify/content-batches");
rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });
mkdirSync(resolve("data/verify/content-audit"), { recursive: true });

const supabase = serviceClient();
const { data: rows, error } = await supabase
  .from("road_signs")
  .select("code, category, chart_match, content")
  .eq("asset_status", "approved")
  .eq("review_status", "approved")
  .order("code");
if (error) {
  console.error(error.message);
  process.exit(1);
}

const en = (f) => (f && f.en) || null;
const signs = rows.map((r) => ({
  code: r.code,
  category: r.category,
  chartName: r.chart_match?.name ?? null,
  content: {
    plainEnglish: en(r.content?.plainEnglish),
    formalMeaning: en(r.content?.formalMeaning),
    behaviour: en(r.content?.behaviour),
    commonMistake: en(r.content?.commonMistake),
    testHint: en(r.content?.testHint),
  },
}));

let n = 0;
const index = [];
for (let i = 0; i < signs.length; i += BATCH_SIZE) {
  n++;
  const id = String(n).padStart(3, "0");
  const file = resolve(DIR, `cbatch-${id}.json`);
  writeFileSync(
    file,
    JSON.stringify({ batch: id, signs: signs.slice(i, i + BATCH_SIZE) }, null, 2) +
      "\n",
  );
  index.push({ batch: id, file, count: signs.slice(i, i + BATCH_SIZE).length });
}
writeFileSync(resolve(DIR, "index.json"), JSON.stringify(index, null, 2) + "\n");
console.log(`Wrote ${n} content-audit batches (size ${BATCH_SIZE}) → ${DIR}`);
