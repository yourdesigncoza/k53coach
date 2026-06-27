#!/usr/bin/env node
/**
 * Phase 3 (step 2 helper): chunk the verification manifest into per-batch files
 * the session's subagents consume. Batches are grouped by chart page (so an agent
 * reads one chart-page image and verifies several signs against it) and capped at
 * BATCH_SIZE signs. Output: data/verify/batches/batch-NNN.json.
 *
 * Usage: node scripts/signs/prep-batches.mjs [batchSize]
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const BATCH_SIZE = Number(process.argv[2] || 8);
const DIR = resolve("data/verify/batches");
rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });
mkdirSync(resolve("data/verify/verdicts"), { recursive: true });

const manifest = JSON.parse(
  readFileSync(resolve("data/verify/manifest.json"), "utf8"),
);

const byPage = new Map();
for (const m of manifest) {
  const k = m.chartPage ?? "none";
  if (!byPage.has(k)) byPage.set(k, []);
  byPage.get(k).push(m);
}

let n = 0;
const index = [];
for (const [page, signs] of byPage) {
  for (let i = 0; i < signs.length; i += BATCH_SIZE) {
    n++;
    const id = String(n).padStart(3, "0");
    const slice = signs.slice(i, i + BATCH_SIZE);
    const file = resolve(DIR, `batch-${id}.json`);
    writeFileSync(
      file,
      JSON.stringify(
        { batch: id, chartPage: page, chartPngPath: slice[0].chartPngPath, signs: slice },
        null,
        2,
      ) + "\n",
    );
    index.push({ batch: id, file, chartPage: page, count: slice.length });
  }
}

writeFileSync(resolve(DIR, "index.json"), JSON.stringify(index, null, 2) + "\n");
console.log(`Wrote ${n} batches (size ${BATCH_SIZE}) → ${DIR}`);
for (const b of index) console.log(`  batch-${b.batch}: page ${b.chartPage}, ${b.count} signs`);
