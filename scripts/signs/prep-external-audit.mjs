#!/usr/bin/env node
/**
 * Content-audit batches for the external (not-in-chart) cohort. Sibling of
 * prep-content-batches.mjs, which is chart-specific (filters approved-only and
 * carries chart_match/chartName that are null here). This selects the drafted
 * external cohort and carries the official source + excerpts so the auditor can
 * cross-check factuality. Runs PRE-serve (before auto-approval).
 *
 * Output: data/verify/external-content-batches/cbatch-NNN.json
 *   (the auditor writes data/verify/content-audit/<code>.json — reused by
 *    apply-content-audit.mjs unchanged)
 * Usage: node scripts/signs/prep-external-audit.mjs [batchSize]
 */
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { serviceClient } from "./lib.mjs";

const BATCH_SIZE = Number(process.argv[2] || 25);
const DIR = resolve("data/verify/external-content-batches");
rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });
mkdirSync(resolve("data/verify/content-audit"), { recursive: true });

const supabase = serviceClient();
const { data: rows, error } = await supabase
  .from("road_signs")
  .select("code, category, content, verification")
  .eq("approved_by", "ai:claude-code+brave")
  .eq("review_status", "reviewed")
  .order("code");
if (error) {
  console.error(error.message);
  process.exit(1);
}

const en = (f) => (f && f.en) || null;
const signs = rows.map((r) => ({
  code: r.code,
  category: r.category,
  family: r.verification?.family ?? null,
  primarySource: r.verification?.primarySource ?? null,
  sources: r.verification?.provenance?.urls ?? [],
  sourceExcerpts: r.verification?.provenance?.snippetExcerpts ?? [],
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
  const slice = signs.slice(i, i + BATCH_SIZE);
  writeFileSync(file, JSON.stringify({ batch: id, signs: slice }, null, 2) + "\n");
  index.push({ batch: id, file, count: slice.length });
}
writeFileSync(resolve(DIR, "index.json"), JSON.stringify(index, null, 2) + "\n");
console.log(`Wrote ${n} external content-audit batches (size ${BATCH_SIZE}) → ${DIR}`);
console.log(`Auditor prompt: scripts/signs/external-audit-prompt.md`);
